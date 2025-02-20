from flask_caching import Cache
from flask_caching import Cache
"""Game management routes for DojoPool."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from flask_login import current_user, login_required
from src.core.database import db
from src.core.models.game import Game
from werkzeug.wrappers import Response as WerkzeugResponse

from . import game_bp


@game_bp.route("/")
@login_required
def list_games() -> ResponseReturnValue:
    """List all games for the current user."""
    games: Any = Game.query.filter(
        (Game.player1_id == current_user.id) | (Game.player2_id == current_user.id)
    ).all()
    return jsonify([game.to_dict() for game in games])


@game_bp.route("/<int:game_id>")
@login_required
def get_game(game_id: int) -> ResponseReturnValue:
    """Get a specific game."""
    game: Game = Game.query.get_or_404(game_id)
    return jsonify(game.to_dict())


@game_bp.route("/", methods=["POST"])
@login_required
def create_game():
    """Create a new game."""
    data: Any = request.get_json()

    if not data or "opponent_id" not in data:
        return jsonify({"error": "Missing opponent_id"}), 400

    game: Game = Game(
        player1_id=current_user.id,
        player2_id=data["opponent_id"],
        game_type=data.get("game_type", "8ball"),
        status="pending",
    )

    db.session.add(game)
    db.session.commit()

    return jsonify(game.to_dict()), 201


@game_bp.route("/<int:game_id>", methods=["PUT"])
@login_required
def update_game(game_id: int) -> ResponseReturnValue:
    """Update a game's status."""
    game: Game = Game.query.get_or_404(game_id)

    if game.player1_id != current_user.id and game.player2_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    data: Any = request.get_json()

    if "status" in data:
        game.status = data["status"]

    if "winner_id" in data:
        game.winner_id = data["winner_id"]

    if "score" in data:
        game.score = data["score"]

    db.session.commit()

    return jsonify(game.to_dict())


@game_bp.route("/<int:game_id>", methods=["DELETE"])
@login_required
def delete_game(game_id: int) -> ResponseReturnValue:
    """Delete a game."""
    game: Game = Game.query.get_or_404(game_id)

    if game.player1_id != current_user.id and game.player2_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    if game.status != "pending":
        return jsonify({"error": "Cannot delete non-pending game"}), 400

    db.session.delete(game)
    db.session.commit()

    return "", 204
