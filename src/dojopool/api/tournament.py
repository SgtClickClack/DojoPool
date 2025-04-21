"""
Tournament/game flow API endpoints for DojoPool.
"""
from flask import Blueprint, request, jsonify, abort
from dojopool.core.models.tournament import Tournament, TournamentPlayer, TournamentType, TournamentStatus
from dojopool.core.models.match import Match
from dojopool.core.extensions import db
from flask_login import current_user, login_required

# Blueprint for tournament/game APIs

tournament_bp = Blueprint("tournament", __name__)

@tournament_bp.errorhandler(Exception)
def handle_tournament_error(error):
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
    data = request.get_json()
    required_fields = ["name", "organizer_id", "tournament_type", "game_type", "format"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
    try:
        tournament = Tournament(
            name=data["name"],
            organizer_id=data["organizer_id"],
            tournament_type=TournamentType(data["tournament_type"]),
            game_type=data["game_type"],
            format=data["format"],
            status=TournamentStatus.REGISTRATION_OPEN
        )
        db.session.add(tournament)
        db.session.commit()
        return jsonify(tournament.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@tournament_bp.route("/tournaments", methods=["GET"])
def list_tournaments():
    tournaments = Tournament.query.all()
    return jsonify([t.to_dict() for t in tournaments])

@tournament_bp.route("/tournaments/<int:tournament_id>", methods=["GET"])
def get_tournament(tournament_id):
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
    tournament = Tournament.query.get_or_404(tournament_id)
    # Check if user already joined
    entry = TournamentPlayer.query.filter_by(tournament_id=tournament_id, player_id=current_user.id).first()
    if entry:
        return jsonify({"message": "Already joined"}), 200
    try:
        new_entry = TournamentPlayer(
            tournament_id=tournament_id,
            player_id=current_user.id,
            status="active"
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
    tournament = Tournament.query.get_or_404(tournament_id)
    if tournament.status != TournamentStatus.REGISTRATION_OPEN:
        return jsonify({"error": "Tournament cannot be started in its current status."}), 400
    # Fetch all players
    players = [tp.player_id for tp in TournamentPlayer.query.filter_by(tournament_id=tournament_id).all()]
    if len(players) < 2:
        return jsonify({"error": "At least two players required to start a tournament."}), 400
    # Shuffle and pair players for first round
    import random
    random.shuffle(players)
    matches = []
    for i in range(0, len(players), 2):
        if i+1 < len(players):
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
            # Odd player gets a bye
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
    tournament.status = TournamentStatus.IN_PROGRESS
    db.session.commit()
    return jsonify({
        "message": "Tournament started.",
        "matches": [m.to_dict() for m in matches]
    })

@tournament_bp.route("/tournaments/<int:tournament_id>/advance", methods=["POST"])
@login_required
def advance_tournament(tournament_id):
    tournament = Tournament.query.get_or_404(tournament_id)
    if tournament.status != TournamentStatus.IN_PROGRESS:
        return jsonify({"error": "Tournament is not in progress."}), 400
    # Find last completed round
    last_round = db.session.query(Match.round).filter(
        Match.tournament_id == tournament_id
    ).order_by(Match.round.desc()).first()
    if not last_round:
        return jsonify({"error": "No matches found for this tournament."}), 400
    last_round_num = last_round[0]
    # Get winners from last round
    matches = Match.query.filter_by(tournament_id=tournament_id, round=last_round_num).all()
    winners = []
    for m in matches:
        if m.status == "completed" and m.winner_id:
            winners.append(m.winner_id)
        elif m.status == "bye":
            winners.append(m.player1_id)
    if len(winners) < 2:
        # Tournament complete
        tournament.status = TournamentStatus.COMPLETED
        db.session.commit()
        return jsonify({"message": "Tournament completed.", "winner_id": winners[0] if winners else None})
    # Shuffle and pair winners for next round
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
    return jsonify({
        "message": "Next round created.",
        "matches": [m.to_dict() for m in next_matches]
    })

@tournament_bp.route("/matches/<int:match_id>", methods=["GET"])
def get_match(match_id):
    match = Match.query.get_or_404(match_id)
    return jsonify(match.to_dict())

@tournament_bp.route("/matches/<int:match_id>/result", methods=["POST"])
@login_required
def submit_match_result(match_id):
    match = Match.query.get_or_404(match_id)
    data = request.get_json()
    # Validate required fields and match state
    if not data or "status" not in data or "score" not in data or "winner_id" not in data:
        return jsonify({"error": "Missing required fields: status, score, winner_id"}), 400
    if match.status not in ["scheduled"]:
        return jsonify({"error": "Match cannot be updated in its current status."}), 400
    match.status = data["status"]
    match.score = data["score"]
    match.winner_id = data["winner_id"]
    match.loser_id = data.get("loser_id")
    db.session.commit()
    return jsonify(match.to_dict())
