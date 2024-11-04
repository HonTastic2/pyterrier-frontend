from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "Hello from Python!"})

@app.route('/api/data', methods=['POST'])
def post_data():
    data = request.get_json()
    input_query = data.get('query')
    result = input_query + " from Python!"
    return jsonify({"result": result}), 201

if __name__ == "__main__":
    app.run(debug=True)
