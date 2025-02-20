"""Simple Flask test server."""

from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify({"status": "ok", "message": "Flask test server is running"})


if __name__ == "__main__":
    print("Starting test server on http://localhost:5000")
    app.run(host="localhost", port=5000, debug=True)
