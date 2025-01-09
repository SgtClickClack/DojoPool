"""Main views."""
from flask import jsonify
from . import main_bp

@main_bp.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"}) 