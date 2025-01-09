"""Game views."""
from flask import jsonify
from . import game_bp

@game_bp.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"}) 