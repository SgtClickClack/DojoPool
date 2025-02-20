"""Minimal Flask application for testing."""

from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify({"status": "ok", "message": "DojoPool minimal server is running"})


if __name__ == "__main__":
    from waitress import serve

    print("Starting minimal server on http://localhost:8080")
    serve(app, host="localhost", port=8080)
