"""Spectator views."""
from flask import jsonify
from . import spectator_bp

@spectator_bp.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"}) 