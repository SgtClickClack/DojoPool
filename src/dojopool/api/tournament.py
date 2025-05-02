"""
Tournament/game flow API endpoints for DojoPool.
"""
from flask import Blueprint, request, jsonify, abort
# Removed direct model imports at module level
# from dojopool.core.models.tournament import Tournament, TournamentPlayer, TournamentType, TournamentStatus
# from dojopool.core.models.match import Match
from dojopool.core.extensions import db
from flask_login import current_user, login_required
from datetime import datetime

# Blueprint for tournament/game APIs

tournament_bp = Blueprint("tournament", __name__)

@tournament_bp.errorhandler(Exception)
def handle_tournament_error(error):
    # Keep local import for SQLAlchemyError if needed
    from sqlalchemy.exc import SQLAlchemyError
    import traceback
    if isinstance(error, SQLAlchemyError):
        db.session.rollback()
        return jsonify({"error": "A database error occurred.", "details": str(error)}), 500
    elif hasattr(error, 'code') and hasattr(error, 'description'):
        return jsonify({"error": error.description}), error.code
    else:
        db.session.rollback()
        return jsonify({
            "error": "An unexpected error occurred.",
            "details": str(error),
            "trace": traceback.format_exc()
        }), 500

@tournament_bp.route("/tournaments", methods=["POST"])
@login_required
def create_tournament():
    # Import models locally
    from dojopool.models.tournament import Tournament, TournamentStatus, TournamentFormat # Use ORM enums
    from dojopool.models.user import User # Needed for organizer
    data = request.get_json()
    # Required fields based on ORM model __init__
    required_fields = ["name", "venue_id", "start_date", "end_date", "registration_deadline", "max_participants", "entry_fee", "prize_pool", "format"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
    try:
        # Use parameters matching ORM Tournament.__init__
        tournament = Tournament(
            name=data["name"],
            description=data.get("description"),
            start_date=datetime.fromisoformat(data["start_date"]), # Assuming ISO format
            end_date=datetime.fromisoformat(data["end_date"]),   # Assuming ISO format
            venue_id=data["venue_id"],
            organizer_id=current_user.id, # Use logged-in user as organizer
            registration_deadline=datetime.fromisoformat(data["registration_deadline"]), # Assuming ISO format
            max_participants=data["max_participants"],
            entry_fee=float(data["entry_fee"]),
            prize_pool=float(data["prize_pool"]),
            format=data["format"], # Use string value directly for format
            status=TournamentStatus.REGISTRATION.value, # Use ORM enum value
            rules=data.get("rules")
        )
        db.session.add(tournament)
        db.session.commit()
        return jsonify(tournament.to_dict()), 201
    except (ValueError, TypeError) as e: # Catch potential conversion errors
        db.session.rollback()
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@tournament_bp.route("/tournaments", methods=["GET"])
def list_tournaments():
    # Import model locally
    from dojopool.models.tournament import Tournament
    tournaments = Tournament.query.all()
    return jsonify([t.to_dict() for t in tournaments])

@tournament_bp.route("/tournaments/<int:tournament_id>", methods=["GET"])
def get_tournament(tournament_id):
    # Import models locally
    from dojopool.models.tournament import Tournament, TournamentPlayer
    tournament = Tournament.query.get_or_404(tournament_id)
    # Get participants (TournamentPlayer joined with User)
    participants = [
        {
            "id": tp.player.id,
            "username": tp.player.username,
            "status": tp.status
        }
        for tp in tournament.players
    ]
    # Get matches (if any)
    matches = [m.to_dict() for m in getattr(tournament, 'matches', [])] if hasattr(tournament, 'matches') else []
    data = tournament.__dict__.copy()
    data["participants"] = participants
    data["matches"] = matches
    # Remove private fields
    data.pop('_sa_instance_state', None)
    return jsonify(data)

@tournament_bp.route("/tournaments/<int:tournament_id>/join", methods=["POST"])
@login_required
def join_tournament(tournament_id):
    from dojopool.models.tournament import Tournament, TournamentParticipant
    tournament = Tournament.query.get_or_404(tournament_id)
    entry = TournamentParticipant.query.filter_by(tournament_id=tournament_id, user_id=current_user.id).first()
    if entry:
        return jsonify({"message": "Already joined"}), 200
    try:
        new_entry = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=current_user.id, # Corrected: use user_id
            status="registered"
        )
        db.session.add(new_entry)
        db.session.commit()
        return jsonify({"message": f"User {current_user.id} joined tournament {tournament_id}"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@tournament_bp.route("/tournaments/<int:tournament_id>/start", methods=["POST"])
@login_required
def start_tournament(tournament_id):
    from dojopool.models.tournament import Tournament, TournamentParticipant, TournamentStatus
    from dojopool.models.match import Match
    tournament = Tournament.query.get_or_404(tournament_id)
    if tournament.status != TournamentStatus.REGISTRATION.value:
        return jsonify({"error": "Tournament cannot be started"}), 400
    players = [tp.user_id for tp in tournament.participants]
    if len(players) < 2:
        return jsonify({"error": "Need at least two players"}), 400
    import random
    random.shuffle(players)
    matches = []
    for i in range(0, len(players), 2):
        if i+1 < len(players):
            # Use keyword args matching Match columns
            match = Match(
                tournament_id=tournament_id,
                round=1,
                match_number=(i//2)+1,
                player1_id=players[i],
                player2_id=players[i+1],
                status="scheduled"
            )
            db.session.add(match)
            matches.append(match)
        else:
            # Use keyword args matching Match columns
            match = Match(
                tournament_id=tournament_id,
                round=1,
                match_number=(i//2)+1,
                player1_id=players[i],
                player2_id=None,
                status="bye"
            )
            db.session.add(match)
            matches.append(match)
    tournament.status = TournamentStatus.IN_PROGRESS.value
    db.session.commit()
    return jsonify({"message": "Tournament started.", "matches": [m.to_dict() for m in matches]})

@tournament_bp.route("/tournaments/<int:tournament_id>/advance", methods=["POST"])
@login_required
def advance_tournament(tournament_id):
    from dojopool.models.tournament import Tournament, TournamentStatus
    from dojopool.models.match import Match
    tournament = Tournament.query.get_or_404(tournament_id)
    if tournament.status != TournamentStatus.IN_PROGRESS.value:
        return jsonify({"error": "Tournament is not in progress."}), 400
    last_round_tuple = db.session.query(db.func.max(Match.round)).filter(
        Match.tournament_id == tournament_id
    ).first()
    if not last_round_tuple or last_round_tuple[0] is None:
        return jsonify({"error": "No matches found or rounds not started for this tournament."}), 400
    last_round_num = last_round_tuple[0]

    matches = Match.query.filter_by(tournament_id=tournament_id, round=last_round_num).all()
    winners = []
    all_matches_completed_or_bye = True
    for m in matches:
        if m.status == "completed" and m.winner_id:
            winners.append(m.winner_id)
        elif m.status == "bye":
            winners.append(m.player1_id)
        else:
            all_matches_completed_or_bye = False
            break

    if not all_matches_completed_or_bye:
         return jsonify({"error": f"Round {last_round_num} is not yet complete."}), 400

    if len(winners) < 2:
        tournament.status = TournamentStatus.COMPLETED.value
        db.session.commit()
        return jsonify({"message": "Tournament completed.", "winner_id": winners[0] if winners else None})

    import random
    random.shuffle(winners)
    next_matches = []
    for i in range(0, len(winners), 2):
        if i+1 < len(winners):
            match = Match(
                tournament_id=tournament_id,
                round=last_round_num+1,
                match_number=(i//2)+1,
                player1_id=winners[i],
                player2_id=winners[i+1],
                status="scheduled"
            )
            db.session.add(match)
            next_matches.append(match)
        else:
            match = Match(
                tournament_id=tournament_id,
                round=last_round_num+1,
                match_number=(i//2)+1,
                player1_id=winners[i],
                player2_id=None,
                status="bye"
            )
            db.session.add(match)
            next_matches.append(match)
    db.session.commit()
    return jsonify({"message": "Next round created.", "matches": [m.to_dict() for m in next_matches]})

@tournament_bp.route("/matches/<int:match_id>", methods=["GET"])
def get_match(match_id):
    # Import model locally
    from dojopool.models.match import Match
    match = Match.query.get_or_404(match_id)
    return jsonify(match.to_dict())

@tournament_bp.route("/matches/<int:match_id>/result", methods=["POST"])
@login_required
def submit_match_result(match_id):
    # Import model locally, remove MatchStatus
    from dojopool.models.match import Match
    match = Match.query.get_or_404(match_id)
    data = request.get_json()
    if not data or "status" not in data or "winner_id" not in data:
        return jsonify({"error": "Missing required fields: status, winner_id"}), 400
    # Allow submitting results for scheduled or in_progress matches
    # Use string status
    if match.status not in ["scheduled", "in_progress"]:
        return jsonify({"error": "Match cannot be updated in its current status."}), 400

    # Validate status transition
    new_status = data["status"]
    # Use string status
    if new_status not in ["completed", "forfeited"]:
         return jsonify({"error": f"Invalid result status value: {new_status}"}), 400
    match.status = new_status

    match.winner_id = data["winner_id"]
    # Determine loser_id based on winner_id
    if match.player1_id == match.winner_id:
        match.loser_id = match.player2_id
    elif match.player2_id == match.winner_id:
        match.loser_id = match.player1_id
    else:
        # Handle case where winner_id is neither player (e.g., validation error)
        return jsonify({"error": "winner_id does not match either player"}), 400

    match.score = data.get("score") # Score is optional
    match.end_time = datetime.utcnow() # Mark end time when result is submitted
    db.session.commit()
    return jsonify(match.to_dict())
