"""Narrative views."""
from flask import jsonify
from . import narrative_bp

@narrative_bp.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"}) 