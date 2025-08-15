"""API views."""

from flask import jsonify

from . import api_bp


@api_bp.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})
