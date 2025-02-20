"""
Module: ai/routes
Provides Flask routes for AI-related endpoints.
"""

from typing import Dict

from flask import Blueprint, jsonify

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/ai/info")
def get_ai_info() -> Dict[str, str]:
    """Get AI information.

    Returns:
        Dict containing status message
    """
    return {"message": "AI endpoint works correctly"}
