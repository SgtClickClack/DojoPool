from flask_caching import Cache
from flask_caching import Cache
from datetime import datetime
from typing import Any, Dict, List

from flask import Blueprint, jsonify, request
from flask.typing import ResponseReturnValue
from flask_login import current_user, login_required

from ..auth.utils import admin_required
from ..models import Tournament, Venue, db

bp = Blueprint("tournaments", __name__, url_prefix="/tournaments")


@bp.route("/", methods=["GET"])
def list_tournaments() -> ResponseReturnValue:
    """List all tournaments."""
    # Get query parameters for filtering
    venue_id = request.args.get("venue_id", type=int)
    status = request.args.get("status")

    # Build query
    query = Tournament.query

    if venue_id:
        query = query.filter_by(venue_id=venue_id)
    if status:
        query = query.filter_by(status=status)

    tournaments = query.all()

    return jsonify(
        {
            "tournaments": [
                {
                    "id": t.id,
                    "name": t.name,
                    "venue_id": t.venue_id,
                    "start_date": t.start_date.isoformat() if t.start_date else None,
                    "end_date": t.end_date.isoformat() if t.end_date else None,
                    "status": t.status,
                    "max_participants": t.max_participants,
                    "current_participants": len(t.participants),
                }
                for t in tournaments
            ]
        }
    )


@bp.route("/<int:tournament_id>", methods=["GET"])
def get_tournament(tournament_id: int) -> ResponseReturnValue:
    """Get tournament details."""
    tournament = Tournament.query.get_or_404(tournament_id)

    return jsonify(
        {
            "id": tournament.id,
            "name": tournament.name,
            "description": tournament.description,
            "venue_id": tournament.venue_id,
            "start_date": (
                tournament.start_date.isoformat() if tournament.start_date else None
            ),
            "end_date": (
                tournament.end_date.isoformat() if tournament.end_date else None
            ),
            "status": tournament.status,
            "max_participants": tournament.max_participants,
            "current_participants": len(tournament.participants),
            "rules": tournament.rules,
            "prize_pool": tournament.prize_pool,
        }
    )


@bp.route("/", methods=["POST"])
@admin_required
def create_tournament():
    """Create a new tournament."""
    data = request.get_json()

    # Validate required fields
    required_fields = ["name", "venue_id", "max_participants"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Validate venue exists
    venue = Venue.query.get(data["venue_id"])
    if not venue:
        return jsonify({"error": "Invalid venue ID"}), 400

    # Create tournament
    tournament = Tournament(
        name=data["name"],
        description=data.get("description"),
        venue_id=data["venue_id"],
        max_participants=data["max_participants"],
        rules=data.get("rules"),
        prize_pool=data.get("prize_pool"),
        status="pending",
    )

    db.session.add(tournament)
    db.session.commit()

    return (
        jsonify(
            {
                "id": tournament.id,
                "name": tournament.name,
                "venue_id": tournament.venue_id,
                "status": tournament.status,
            }
        ),
        201,
    )


@bp.route("/<int:tournament_id>", methods=["PUT"])
@admin_required
def update_tournament(tournament_id: int) -> ResponseReturnValue:
    """Update tournament details."""
    tournament = Tournament.query.get_or_404(tournament_id)
    data = request.get_json()

    # Don't allow updating if tournament has started
    if tournament.status not in ["pending", "registration"]:
        return jsonify({"error": "Cannot update tournament after it has started"}), 400

    # Update fields
    if "name" in data:
        tournament.name = data["name"]
    if "description" in data:
        tournament.description = data["description"]
    if "max_participants" in data:
        if len(tournament.participants) > data["max_participants"]:
            return (
                jsonify(
                    {"error": "New max_participants is less than current participants"}
                ),
                400,
            )
        tournament.max_participants = data["max_participants"]
    if "rules" in data:
        tournament.rules = data["rules"]
    if "prize_pool" in data:
        tournament.prize_pool = data["prize_pool"]

    db.session.commit()

    return jsonify(
        {"id": tournament.id, "name": tournament.name, "status": tournament.status}
    )


@bp.route("/<int:tournament_id>", methods=["DELETE"])
@admin_required
def delete_tournament(tournament_id: int) -> ResponseReturnValue:
    """Delete a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)

    # Don't allow deleting if tournament has started
    if tournament.status not in ["pending", "registration"]:
        return jsonify({"error": "Cannot delete tournament after it has started"}), 400

    db.session.delete(tournament)
    db.session.commit()

    return jsonify({"message": "Tournament deleted successfully"})


@bp.route("/<int:tournament_id>/register", methods=["POST"])
@login_required
def register_for_tournament(tournament_id: int) -> ResponseReturnValue:
    """Register current user for a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)

    # Check tournament status
    if tournament.status != "registration":
        return jsonify({"error": "Tournament is not open for registration"}), 400

    # Check if already registered
    if current_user in tournament.participants:
        return jsonify({"error": "Already registered for this tournament"}), 400

    # Check max participants
    if len(tournament.participants) >= tournament.max_participants:
        return jsonify({"error": "Tournament is full"}), 400

    # Register user
    tournament.participants.append(current_user)
    db.session.commit()

    return jsonify(
        {
            "message": "Successfully registered for tournament",
            "tournament_id": tournament.id,
        }
    )


@bp.route("/<int:tournament_id>/unregister", methods=["POST"])
@login_required
def unregister_from_tournament(tournament_id: int) -> ResponseReturnValue:
    """Unregister current user from a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)

    # Check tournament status
    if tournament.status != "registration":
        return jsonify({"error": "Cannot unregister after tournament has started"}), 400

    # Check if registered
    if current_user not in tournament.participants:
        return jsonify({"error": "Not registered for this tournament"}), 400

    # Unregister user
    tournament.participants.remove(current_user)
    db.session.commit()

    return jsonify(
        {
            "message": "Successfully unregistered from tournament",
            "tournament_id": tournament.id,
        }
    )


@bp.route("/<int:tournament_id>/start", methods=["POST"])
@admin_required
def start_tournament(tournament_id: int) -> ResponseReturnValue:
    """Start a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)

    # Validate tournament can be started
    if tournament.status != "registration":
        return jsonify({"error": "Tournament cannot be started"}), 400

    if len(tournament.participants) < 2:
        return jsonify({"error": "Not enough participants to start tournament"}), 400

    # Update tournament status and start time
    tournament.status = "in_progress"
    tournament.start_date = datetime.utcnow()
    db.session.commit()

    return jsonify(
        {
            "message": "Tournament started successfully",
            "tournament_id": tournament.id,
            "start_date": tournament.start_date.isoformat(),
        }
    )


@bp.route("/<int:tournament_id>/end", methods=["POST"])
@admin_required
def end_tournament(tournament_id: int) -> ResponseReturnValue:
    """End a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)

    # Validate tournament can be ended
    if tournament.status != "in_progress":
        return jsonify({"error": "Tournament is not in progress"}), 400

    # Update tournament status and end time
    tournament.status = "completed"
    tournament.end_date = datetime.utcnow()
    db.session.commit()

    return jsonify(
        {
            "message": "Tournament ended successfully",
            "tournament_id": tournament.id,
            "end_date": tournament.end_date.isoformat(),
        }
    )
