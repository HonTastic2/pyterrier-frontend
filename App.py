from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
import pyterrier as pt # type: ignore
import pandas as pd # type: ignore
import ir_datasets
import shutil
import os
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

@app.route('/api/data', methods=['POST'])
def post_data():
    data = request.get_json()
    input_query = data.get('query')
    n = data.get('num_results')
    result = search_top_n(input_query, BM25, n)
    return jsonify({"result": result}), 201

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
