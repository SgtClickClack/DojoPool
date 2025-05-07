"""Achievements API routes."""

# TODO: Implement integration with AchievementService and write integration tests for all endpoints.

from flask import Blueprint, jsonify, request, g
from flask_login import login_required
from dojopool.services.achievement_service import AchievementService
from dojopool.auth.decorators import admin_required

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


@achievements_bp.route("/leaderboard", methods=["GET"])
@login_required
def get_leaderboard():
    """Get the achievement leaderboard."""
    user_id = getattr(g, "user_id", None) # Assuming leaderboard might be personalized or needs auth
    if not user_id: # Or if it's a public leaderboard, this check might be different
        return jsonify({"error": "User not authenticated"}), 401
    result = service.get_achievement_leaderboard()
    return jsonify(result)


@achievements_bp.route("/admin", methods=["POST"])
@admin_required
def admin_create_achievement():
    """Create a new achievement (Admin only)."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input"}), 400
    
    # Validate required fields (name, description, category_id, points)
    # This should ideally be done via a schema validation library like Marshmallow or Pydantic
    required_fields = ["name", "description", "category_id", "points"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing required fields: {', '.join(required_fields)}"}), 400

    try:
        result = service.create_achievement(data)
        # The service.create_achievement is expected to return something like {"achievement_id": new_id, ...}
        # and handle IntegrityError if category_id is invalid.
        return jsonify(result), 201
    except Exception as e:
        # Log the exception e
        return jsonify({"error": "Failed to create achievement", "details": str(e)}), 500


@achievements_bp.route("/admin/<string:achievement_id>", methods=["GET"])
@admin_required
def admin_get_achievement(achievement_id):
    """Get details of a specific achievement (Admin only)."""
    try:
        result = service.get_achievement_details(achievement_id)
        if not result:
            return jsonify({"error": "Achievement not found"}), 404
        return jsonify(result)
    except Exception as e:
        # Log the exception e
        return jsonify({"error": "Failed to get achievement details", "details": str(e)}), 500


@achievements_bp.route("/admin/<string:achievement_id>", methods=["PUT"])
@admin_required
def admin_update_achievement(achievement_id):
    """Update an existing achievement (Admin only)."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input"}), 400

    try:
        # The service.update_achievement should handle non-existent achievement_id gracefully (e.g., return error or specific response)
        result = service.update_achievement(achievement_id, data)
        if "error" in result: # Assuming service might return an error structure
            return jsonify(result), 404 if "not found" in result.get("error", "").lower() else 400
        return jsonify(result)
    except Exception as e:
        # Log the exception e
        return jsonify({"error": "Failed to update achievement", "details": str(e)}), 500


@achievements_bp.route("/admin/<string:achievement_id>", methods=["DELETE"])
@admin_required
def admin_delete_achievement(achievement_id):
    """Delete an achievement (Admin only)."""
    try:
        result = service.delete_achievement(achievement_id)
        if "error" in result: # Assuming service might return an error structure for not found
            return jsonify(result), 404
        return jsonify(result)
    except Exception as e:
        # Log the exception e
        return jsonify({"error": "Failed to delete achievement", "details": str(e)}), 500
