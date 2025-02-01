"""Ranking views."""

from flask import jsonify

from . import ranking_bp


@ranking_bp.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})
