"""Main routes for DojoPool."""

from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Home page."""
    return jsonify({
        'message': 'Welcome to DojoPool',
        'version': '1.0.0'
    })

@main_bp.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'Service is healthy'
    })