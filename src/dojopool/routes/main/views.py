"""Main routes views."""

from flask import render_template, jsonify
from . import main_bp


@main_bp.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})


@main_bp.route("/")
def index():
    """Landing page."""
    return render_template("landing.html")
