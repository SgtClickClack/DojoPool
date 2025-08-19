"""Game views module."""

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from ...core.extensions import db
from ...core.models.game import GameSession
from ...services.game_service import GameService

bp = Blueprint("game", __name__)
game_service = GameService()


@bp.route("/session", methods=["POST"])
@login_required
def create_session():
    """Create a new game session."""
    request.get_json()

    # Create new session
    session = GameSession(user_id=current_user.id, status="active")

    # Save to database
    db.session.add(session)
    db.session.commit()

    return jsonify(session.to_dict()), 201


@bp.route("/session/<int:session_id>", methods=["GET"])
@login_required
def get_session(session_id):
    """Get game session details."""
    session = GameSession.query.get_or_404(session_id)

    # Check if user has access to this session
    if session.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify(session.to_dict())


@bp.route("/session/<int:session_id>", methods=["PUT"])
@login_required
def update_session(session_id):
    """Update game session."""
    session = GameSession.query.get_or_404(session_id)

    # Check if user has access to this session
    if session.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    # Update allowed fields
    if "status" in data:
        session.status = data["status"]
    if "metrics" in data:
        session.metrics = data.get("metrics")
    if "settings" in data:
        session.settings = data.get("settings")

    db.session.commit()

    return jsonify(session.to_dict())


@bp.route("/session/<int:session_id>", methods=["DELETE"])
@login_required
def end_session(session_id):
    """End game session."""
    session = GameSession.query.get_or_404(session_id)

    # Check if user has access to this session
    if session.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    session.end()

    return jsonify({"message": "Session ended successfully"})


@bp.route("/session/<int:session_id>/cancel", methods=["POST"])
@login_required
def cancel_session(session_id):
    """Cancel game session."""
    session = GameSession.query.get_or_404(session_id)

    # Check if user has access to this session
    if session.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    session.cancel()

    return jsonify({"message": "Session cancelled successfully"})
