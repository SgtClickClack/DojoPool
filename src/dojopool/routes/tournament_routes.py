"""Tournament routes module."""

from datetime import datetime
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from flask_login import current_user, login_required
from src.models.tournament import Tournament
from src.services.tournament_service import TournamentService
from src.utils.validators import validate_tournament_data
from werkzeug.wrappers import Response as WerkzeugResponse

bp: Blueprint = Blueprint("tournaments", __name__, url_prefix="/api/tournaments")


@bp.route("/", methods=["POST"])
@login_required
def create_tournament() -> Response:
    """Create a new tournament."""
    data = request.get_json()

    # Validate tournament data
    errors: validate_tournament_data = validate_tournament_data(data)
    if errors:
        return jsonify({"errors": errors}), 400

    try:
        # Convert date strings to datetime objects
        data["start_date"] = datetime.fromisoformat(data["start_date"])
        data["end_date"] = datetime.fromisoformat(data["end_date"])

        tournament: Any = TournamentService.create_tournament(data)
        return jsonify(tournament.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/", methods=["GET"])
def get_tournaments():
    """Get list of tournaments."""
    status = request.args.get("status", type=str)
    if status == "active":
        tournaments: Any = TournamentService.get_active_tournaments()
    else:
        tournaments: Any = Tournament.get_all()

    return jsonify([t.to_dict() for t in tournaments])


@bp.route("/<int -> Response -> Any:tournament_id>", methods=["GET"])
def get_tournament(tournament_id):
    """Get tournament details."""
    tournament: Any = TournamentService.get_tournament(tournament_id)
    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404

    return jsonify(tournament.to_dict())


@bp.route("/<int -> Response -> Any:tournament_id>/register", methods=["POST"])
@login_required
def register_player(tournament_id):
    """Register current player for tournament."""
    try:
        success: Any = TournamentService.register_player(tournament_id, current_user.id)
        if success:
            return jsonify({"message": "Successfully registered for tournament"})
        return jsonify({"error": "Failed to register for tournament"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<int:tournament_id>/start", methods=["POST"])
@login_required
def start_tournament(tournament_id):
    """Start the tournament."""
    try:
        success: Any = TournamentService.start_tournament(tournament_id)
        if success:
            return jsonify({"message": "Tournament started successfully"})
        return jsonify({"error": "Failed to start tournament"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<int:tournament_id>/matches/<int:match_id>", methods=["POST"])
@login_required
def record_match_result(tournament_id, match_id):
    """Record match result."""
    data = request.get_json()
    winner_id: Any = data.get("winner_id")

    if not winner_id:
        return jsonify({"error": "Winner ID is required"}), 400

    try:
        success: Any = TournamentService.record_match_result(
            tournament_id, match_id, winner_id
        )
        if success:
            return jsonify({"message": "Match result recorded successfully"})
        return jsonify({"error": "Failed to record match result"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<int:tournament_id>/standings", methods=["GET"])
def get_standings(tournament_id):
    """Get tournament standings."""
    standings = TournamentService.get_tournament_standings(tournament_id)
    return jsonify(standings)


@bp.route("/player/<int:player_id>", methods=["GET"])
def get_player_tournaments(player_id):
    """Get tournaments for a specific player."""
    tournaments: Any = TournamentService.get_player_tournaments(player_id)
    return jsonify([t.to_dict() for t in tournaments])


@bp.route("/<int -> Response -> Any:tournament_id>", methods=["PUT"])
@login_required
def update_tournament(tournament_id):
    """Update tournament details."""
    data = request.get_json()

    # Validate tournament data
    errors: validate_tournament_data = validate_tournament_data(data, update=True)
    if errors:
        return jsonify({"errors": errors}), 400

    try:
        # Convert date strings to datetime objects if present
        if "start_date" in data:
            data["start_date"] = datetime.fromisoformat(data["start_date"])
        if "end_date" in data:
            data["end_date"] = datetime.fromisoformat(data["end_date"])

        success: Any = TournamentService.update_tournament(tournament_id, data)
        if success:
            return jsonify({"message": "Tournament updated successfully"})
        return jsonify({"error": "Failed to update tournament"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<int:tournament_id>/cancel", methods=["POST"])
@login_required
def cancel_tournament(tournament_id):
    """Cancel the tournament."""
    try:
        success: Any = TournamentService.cancel_tournament(tournament_id)
        if success:
            return jsonify({"message": "Tournament cancelled successfully"})
        return jsonify({"error": "Failed to cancel tournament"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
