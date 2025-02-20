"""Game routes module."""

from flask import (
    Blueprint,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required

from ...core.extensions import db
from ...models.game import Game, GameSession, Shot
from ...models.user import User
from ...models.venue import Venue
from ...services.game_service import GameService
from ...tasks import process_frame

game_bp = Blueprint("game", __name__)
game_service = GameService()


@game_bp.route("/session", methods=["POST"])
@login_required
def create_session():
    """Create a new game session."""
    data = request.get_json()

    # Create new session
    session = GameSession(user_id=current_user.id, status="active")

    # Save to database
    db.session.add(session)
    db.session.commit()

    return jsonify(session.to_dict()), 201


@game_bp.route("/session/<int:session_id>", methods=["GET"])
@login_required
def get_session(session_id):
    """Get game session details."""
    session = GameSession.query.get_or_404(session_id)

    # Check if user has access to this session
    if session.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify(session.to_dict())


@game_bp.route("/session/<int:session_id>", methods=["PUT"])
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


@game_bp.route("/session/<int:session_id>", methods=["DELETE"])
@login_required
def end_session(session_id):
    """End game session."""
    session = GameSession.query.get_or_404(session_id)

    # Check if user has access to this session
    if session.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    session.end()

    return jsonify({"message": "Session ended successfully"})


@game_bp.route("/session/<int:session_id>/cancel", methods=["POST"])
@login_required
def cancel_session(session_id):
    """Cancel game session."""
    session = GameSession.query.get_or_404(session_id)

    # Check if user has access to this session
    if session.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    session.cancel()

    return jsonify({"message": "Session cancelled successfully"})


@game_bp.route("/process-frame", methods=["POST"])
def process_frame_view():
    frame_data = request.json.get("frame_data")
    if not frame_data:
        return jsonify({"error": "Missing frame_data"}), 400

    # Offload the heavy processing to Celery
    task = process_frame.delay(frame_data)
    return jsonify({"task_id": task.id, "status": "Processing started"}), 202


@game_bp.route("/setup", methods=["GET"])
@login_required
def setup():
    """Game setup page."""
    venues = Venue.query.filter_by(is_active=True).all()
    available_players = User.query.filter(
        User.id != current_user.id,
        User.is_active == True,
    ).all()
    return render_template(
        "game/setup.html",
        venues=venues,
        available_players=available_players,
    )


@game_bp.route("/matchmaking", methods=["GET"])
@login_required
def matchmaking():
    """Matchmaking page."""
    available_players = User.query.filter(
        User.id != current_user.id,
        User.is_active == True,
    ).all()
    pending_challenges = []  # TODO: Implement challenges system
    return render_template(
        "game/matchmaking.html",
        available_players=available_players,
        pending_challenges=pending_challenges,
    )


@game_bp.route("/create", methods=["POST"])
@login_required
def create_game():
    """Create a new game."""
    try:
        game = game_service.create_game(
            venue_id=request.form.get("venue_id", type=int),
            player_ids=[current_user.id],
            game_type=request.form.get("game_type"),
            is_ranked=bool(request.form.get("is_ranked")),
        )
        return redirect(url_for("game.play", game_id=game["id"]))
    except ValueError as e:
        flash(str(e), "error")
        return redirect(url_for("game.setup"))


@game_bp.route("/<int:game_id>/play")
@login_required
def play(game_id):
    """Game play page."""
    game = Game.query.get_or_404(game_id)
    current_player = game.player if game.player_id == current_user.id else game.opponent
    return render_template(
        "game/play.html",
        game=game,
        current_player=current_player,
    )


@game_bp.route("/<int:game_id>/score", methods=["POST"])
@login_required
def update_score(game_id):
    """Update game score."""
    data = request.get_json()
    points = data.get("points", 1)
    try:
        result = game_service.update_score(
            game_id=game_id,
            player_id=current_user.id,
            points=points,
        )
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@game_bp.route("/<int:game_id>/end", methods=["POST"])
@login_required
def end_game(game_id):
    """End a game."""
    try:
        result = game_service.end_game(
            game_id=game_id,
            winner_id=current_user.id,
        )
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@game_bp.route("/send-challenge/<int:player_id>", methods=["POST"])
@login_required
def send_challenge(player_id):
    """Send a game challenge to another player."""
    # TODO: Implement challenge system
    flash("Challenge sent!", "success")
    return redirect(url_for("game.matchmaking"))


@game_bp.route("/accept-challenge/<int:challenge_id>", methods=["POST"])
@login_required
def accept_challenge(challenge_id):
    """Accept a game challenge."""
    # TODO: Implement challenge system
    flash("Challenge accepted!", "success")
    return redirect(url_for("game.matchmaking"))


@game_bp.route("/decline-challenge/<int:challenge_id>", methods=["POST"])
@login_required
def decline_challenge(challenge_id):
    """Decline a game challenge."""
    # TODO: Implement challenge system
    flash("Challenge declined.", "info")
    return redirect(url_for("game.matchmaking"))


@game_bp.route("/quick-match", methods=["POST"])
@login_required
def quick_match():
    """Find a quick match."""
    # TODO: Implement matchmaking system
    flash("Looking for a quick match...", "info")
    return redirect(url_for("game.matchmaking"))
