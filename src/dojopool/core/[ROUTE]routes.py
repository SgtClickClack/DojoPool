from flask import Blueprint, jsonify
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response

core_bp: Blueprint = Blueprint("core", __name__)


@core_bp.route("/")
def index() -> ResponseReturnValue:
    """Root endpoint.

    Returns:
        Welcome message response
    """
    return jsonify({"status": "success", "message": "Welcome to DojoPool API"})


@core_bp.route("/health")
def health_check():
    """Health check endpoint.

    Returns:
        Health check response
    """
    return jsonify({"status": "healthy", "version": "1.0.0"})
