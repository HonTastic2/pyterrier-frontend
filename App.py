from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
import pyterrier as pt # type: ignore
import pandas as pd # type: ignore
import ir_datasets
import shutil
import os
import sqlite3

dataset = ir_datasets.load('wapo/v2/trec-news-2019')

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
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT DEFAULT NULL,
            query TEXT,
            rank INTEGER
        )
    ''')
    conn.commit()
    conn.close()

BM25 = pt.BatchRetrieve(index, wmodel='BM25')

def search_top_n(query_text, retriever, n):
    result = []
    # Create query as a dataframe and get top 10 results
    query_df = pd.DataFrame([{"qid": "1", "query": query_text}])
    results = retriever.transform(query_df).head(n)
    
    # Format results
    for i, row in results.iterrows():
        doc = dataset.docs_store().get(row['docno'])
        result.append([i+1, doc.title, doc.url])

    return result

app = Flask(__name__)
CORS(app) 

@app.before_first_request
def setup():
    init_db()

@app.route('/api/data', methods=['POST'])
def post_data():
    # Parse input and get results
    data = request.get_json()
    input_query = data.get('query')
    n = data.get('num_results')
    results = search_top_n(input_query, BM25, n)

    # Save results to the database
    conn = get_db_connection()
    cursor = conn.cursor()
    for rank, result in enumerate(results):
        cursor.execute(
            'INSERT INTO links (url, title, query, rank) VALUES (?, ?, ?, ?)',
            (result['url'], result['title'], input_query, rank)
        )
    conn.commit()
    conn.close()

    return jsonify({"result": results}), 201

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)

@app.route('/api/update_link', methods=['POST'])
def update_link():
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

    return jsonify({"message": "Link updated successfully"}), 200