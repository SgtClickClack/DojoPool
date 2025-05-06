"""Achievements API routes."""

# TODO: Implement integration with AchievementService and write integration tests for all endpoints.

from flask import Blueprint, jsonify, request, g
from flask_login import login_required
from dojopool.services.achievement_service import AchievementService

achievements_bp = Blueprint("achievements", __name__, url_prefix="/achievements")
service = AchievementService()


@achievements_bp.route("/", methods=["GET"])
@login_required
def get_achievements():
    """Get user's achievements."""
    user_id = getattr(g, "user_id", None)
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    result = service.get_user_achievements(user_id)
    return jsonify(result)


@achievements_bp.route("/progress", methods=["GET"])
@login_required
def get_progress():
    """Get achievement stats for the user."""
    user_id = getattr(g, "user_id", None)
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    result = service.get_achievement_stats(user_id)
    return jsonify(result)


@achievements_bp.route("/claim", methods=["POST"])
@login_required
def claim_achievement():
    """Claim an achievement reward (stub)."""
    # TODO: Implement claim logic in AchievementService if needed
    return jsonify({"success": True})
