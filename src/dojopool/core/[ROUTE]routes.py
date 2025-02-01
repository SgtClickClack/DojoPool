from flask import Blueprint, jsonify

core_bp = Blueprint("core", __name__)


@core_bp.route("/")
def index():
    """Root endpoint."""
    return jsonify({"status": "success", "message": "Welcome to DojoPool API"})


@core_bp.route("/health")
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "version": "1.0.0"})
