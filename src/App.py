from flask import Flask, jsonify, request
from flask_cors import CORS
import pyterrier as pt
import pandas as pd
import ir_datasets
dataset = ir_datasets.load('wapo/v2/trec-news-2019')

if not pt.started():
    pt.init()

def doc_to_dict(doc):
    if not doc.title or not doc.body:
        return None
    return {
        'docno': doc.doc_id,
        'text': f"{doc.title}\n{doc.body}"
    }

index = pt.IndexFactory.of('./index_path')

print(f"Indexed {index.getCollectionStatistics().getNumberOfDocuments()} documents")

BM25 = pt.BatchRetrieve(index, wmodel='BM25')

def search_top_10(query_text, retriever):
    result = ""
    query_df = pd.DataFrame([{"qid": "1", "query": query_text}])
    results = retriever.transform(query_df).head(10)
    
    for i, row in results.iterrows():
        doc = dataset.docs_store().get(row['docno'])
        result += f"Rank: {i+1}, Title: {doc.title}, URL: {doc.url} \n"

    return result

app = Flask(__name__)
CORS(app) 

@app.route('/api/data', methods=['POST'])
def post_data():
    data = request.get_json()
    input_query = data.get('query')
    result = search_top_10(input_query, BM25)
    return jsonify({"result": result}), 201

if __name__ == "__main__":
    app.run(debug=True)
