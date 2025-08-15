"""Tournament routes module."""

from datetime import datetime

from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user, login_required

from dojopool.models.tournament import Tournament
from dojopool.services.tournament_service import TournamentService
from dojopool.utils.validators import validate_tournament_data
from dojopool.core.decorators import admin_required

bp = Blueprint("tournaments", __name__, url_prefix="/api/tournaments")

# Instantiate service if needed (or get from app context)
tournament_service = TournamentService()


@bp.route("/", methods=["POST"])
@login_required
def create_tournament():
    """Create a new tournament."""
    data = request.get_json()

    # Validate tournament data
    errors = validate_tournament_data(data)
    if errors:
        return jsonify({"errors": errors}), 400

    try:
        # Convert date strings to datetime objects
        data["start_date"] = datetime.fromisoformat(data["start_date"])
        data["end_date"] = datetime.fromisoformat(data["end_date"])

        tournament = tournament_service.create_tournament(data)
        return jsonify(tournament.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/", methods=["GET"])
def get_tournaments():
    """Get list of tournaments with optional filtering by status, type, and search."""
    status = request.args.get("status")
    type_ = request.args.get("type")
    search = request.args.get("search")

    query = Tournament.query
    if status:
        query = query.filter(Tournament.status == status)
    if type_:
        query = query.filter(Tournament.format == type_)
    if search:
        ilike = f"%{search.lower()}%"
        query = query.filter(
            (Tournament.name.ilike(ilike)) | (Tournament.description.ilike(ilike))
        )
    tournaments = query.all()
    return jsonify([t.to_dict() for t in tournaments])


@bp.route("/<int:tournament_id>", methods=["GET"])
def get_tournament(tournament_id):
    """Get tournament details."""
    tournament = tournament_service.get_tournament(tournament_id)
    if not tournament:
        return jsonify({"error": "Tournament not found"}), 404

    return jsonify(tournament.to_dict())


@bp.route("/<int:tournament_id>/register", methods=["POST"])
@login_required
def register_player(tournament_id):
    """Register current player for tournament."""
    try:
        success = tournament_service.register_player(tournament_id, current_user.id)
        if success:
            return jsonify({"message": "Successfully registered for tournament"})
        return jsonify({"error": "Failed to register for tournament"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/<int:tournament_id>/start", methods=["POST"])
@login_required
@admin_required
def start_tournament_route(tournament_id):
    """API endpoint to start the tournament."""
    try:
        updated_tournament = tournament_service.start_tournament(tournament_id)
        return jsonify(updated_tournament.to_dict()), 200
    except ValueError as e:
        current_app.logger.warning(f"Failed to start tournament {tournament_id}: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error starting tournament {tournament_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500


@bp.route("/<int:tournament_id>/matches/<int:match_id>/complete", methods=["POST"])
@login_required
@admin_required
def complete_match_route(tournament_id, match_id):
    """API endpoint to record match result and advance bracket."""
    data = request.get_json()
    winner_id = data.get("winner_id")
    score = data.get("score")

    if not winner_id or score is None:
        return jsonify({"error": "Winner ID and score are required"}), 400

    try:
        tournament_service.complete_match(
            tournament_id=tournament_id,
            match_id=match_id,
            winner_id=int(winner_id),
            score=str(score)
        )
        updated_match = tournament_service.get_match(match_id)
        if updated_match:
            return jsonify(updated_match.to_dict()), 200
        else:
            return jsonify({"message": "Match result recorded successfully, but couldn't fetch updated match."}), 200

    except ValueError as e:
        current_app.logger.warning(f"Failed to complete match {match_id} in tournament {tournament_id}: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error completing match {match_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500


@bp.route("/<int:tournament_id>/standings", methods=["GET"])
def get_standings(tournament_id):
    """Get tournament standings."""
    standings = tournament_service.get_tournament_standings(tournament_id)
    return jsonify(standings)


@bp.route("/player/<int:player_id>", methods=["GET"])
def get_player_tournaments(player_id):
    """Get tournaments for a specific player."""
    tournaments = tournament_service.get_player_tournaments(player_id)
    return jsonify([t.to_dict() for t in tournaments])


@bp.route("/<int:tournament_id>", methods=["PUT"])
@login_required
def update_tournament(tournament_id):
    """Update tournament details."""
    data = request.get_json()

    # Validate tournament data
    errors = validate_tournament_data(data, update=True)
    if errors:
        return jsonify({"errors": errors}), 400

    try:
        # Convert date strings to datetime objects if present
        if "start_date" in data:
            data["start_date"] = datetime.fromisoformat(data["start_date"])
        if "end_date" in data:
            data["end_date"] = datetime.fromisoformat(data["end_date"])

        success = tournament_service.update_tournament(tournament_id, data)
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
        success = tournament_service.cancel_tournament(tournament_id)
        if success:
            return jsonify({"message": "Tournament cancelled successfully"})
        return jsonify({"error": "Failed to cancel tournament"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
