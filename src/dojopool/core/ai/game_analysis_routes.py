"""
Module: game_analysis_routes

Provides API routes for game analysis.
"""

from typing import Dict

from flask import Blueprint, jsonify

game_analysis_bp = Blueprint("game_analysis", __name__)


@game_analysis_bp.route("/game-analysis")
def get_game_analysis() -> Dict[str, str]:
    """Get game analysis information.

    Returns:
        Dict containing status message
    """
    return {"message": "Game analysis route is working!"}
