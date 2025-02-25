from flask import Flask, jsonify
from waitress import serve

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify({"status": "ok", "message": "Test server is running"})


if __name__ == "__main__":
    print("Starting test server on http://localhost:8080")
    serve(app, host="localhost", port=8080)
