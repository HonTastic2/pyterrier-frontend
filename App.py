from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
import pyterrier as pt # type: ignore
import pandas as pd # type: ignore
import ir_datasets
import shutil
import os
import sqlite3
from dotenv import load_dotenv
from openai import OpenAI

dataset = ir_datasets.load('wapo/v2/trec-news-2019')
load_dotenv()


if not pt.java.started():
    pt.java.init()

# Convert found document to dictionary, if both fields are present
def doc_to_dict(doc):
    if not doc.title or not doc.body:
        return None
    return {
        'docno': doc.doc_id,
        'text': f"{doc.title}\n{doc.body}"
    }

# Check if index exists, if not create one
index_path = '/app/index_path'
if os.path.exists(index_path):
    index = pt.IndexFactory.of(index_path)
else:
    indexer = pt.IterDictIndexer(index_path, meta={'docno': 36}, verbose=True)
    index_ref = indexer.index((d for d in (doc_to_dict(doc) for doc in dataset.docs_iter()) if d))
    index = pt.IndexFactory.of(index_ref)

print(f"Indexed {index.getCollectionStatistics().getNumberOfDocuments()} documents")
print(os.getenv('LLAMA_API_KEY'))


def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # Create table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY,
            status TEXT DEFAULT NULL,
            rank INTEGER,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            query TEXT
        )
    ''')
    conn.commit()
    conn.close()

BM25 = pt.BatchRetrieve(index, wmodel='BM25')

def print_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM links')
    rows = cursor.fetchall()

    for row in rows:
        print(row)

    conn.close()

def split_query(query, chunk_size=64):
    terms = query.split()
    return [terms[i:i+chunk_size] for i in range(0, len(terms), chunk_size)]

def run_split_query(retriever, query):
    subqueries = split_query(query)
    results = []
    
    for subquery in subqueries:
        subquery_str = " ".join(subquery)
        res = retriever.transform(pd.DataFrame([{"qid":"1", "query": subquery_str}]))
        results.append(res)

    return pd.concat(results, ignore_index=True)

def summarize_query(query):
    client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv('OPENAI_API_KEY'),
    )

    completion = client.chat.completions.create(
    model="meta-llama/llama-3.1-405b-instruct:free",
    messages=[
        {
        "role": "user",
        "content": "Summarize the following query to the 20 most informative terms: " + query
        }
    ]
    )
    return (completion.choices[0].message.content)

def search_top_n(query_title, query_body, method, retriever, n):
    result = []
    if (method == "title"):
        query_text = query_title
    elif (method == "body"):
        query_text = query_body
    elif (method == "titlebody"):
        query_text = query_title + " " + query_body
    else:
        query_text = query_title

    # Create query as a dataframe and get top 10 results
    # query_df = pd.DataFrame([{"qid": "1", "query": query_text}])
    # results = retriever.transform(query_df).head(n)
    results = run_split_query(retriever, query_text).head(n)
    
    # Format results
    for i, row in results.iterrows():
        doc = dataset.docs_store().get(row['docno'])
        result.append([i+1, doc.title, doc.url])

    return result

app = Flask(__name__)
CORS(app)

@app.before_request
def setup():
    init_db()
    if not hasattr(app, 'has_run'):
        app.has_run = True


@app.route('/api/data', methods=['POST'])
def post_data():
    # Parse input and get results
    data = request.get_json()
    title = data.get('title')
    body = data.get('body')
    method = data.get('method')
    n = data.get('num_results')
    print(summarize_query(title + " " + body))
    results = search_top_n(title, body, method, BM25, n)

    # Save results to the database
    conn = get_db_connection()
    cursor = conn.cursor()
    for rank, result in enumerate(results):
        cursor.execute(
            'INSERT INTO links (url, title, query, rank) VALUES (?, ?, ?, ?)',
            (result[2], result[1], f"{title} {body}", rank)
        )
    conn.commit()
    conn.close()

    return jsonify({"result": results}), 201


@app.route('/api/update_link', methods=['POST'])
def update_link():
    try:
        # Parse given data
        data = request.json
        url = data['url']
        status = data['status']
        input_query = data['query']

        # Update database accordingly
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE links SET status = ? WHERE url = ? AND query = ?', (status, url, input_query))
        conn.commit()
        conn.close()

        print_db()
        print(1)

        return jsonify({"message": "Link updated successfully"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error updating link"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)