"""Game-specific WebSocket event handlers."""

from flask_login import current_user
from flask_socketio import emit

from ..extensions import db
from ..models.game import Game
from . import socketio


def process_game_action(game, action_type, action_data):
    """Process a game action and return the result."""
    result = {"success": False, "data": None}

    action_handlers = {
        "shot": game.process_shot,
        "foul": game.process_foul,
        "rack": game.process_rack,
        "break": game.process_break,
        "ball_pocketed": game.process_ball_pocketed,
        "scratch": game.process_scratch,
        "safety_play": game.process_safety_play,
        "timeout": game.process_timeout,
        "challenge": game.process_challenge,
    }

    handler = action_handlers.get(action_type)
    if handler:
        result = handler(action_data)

    return result


@socketio.on("shot_taken")
def handle_shot(data):
    """Handle a shot being taken."""
    if not current_user.is_authenticated:
        return False

    game_id = data.get("game_id")
    shot_data = data.get("shot_data", {})

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return

    result = game.process_shot(shot_data)
    if result.get("success"):
        room = f"game_{game_id}"
        emit(
            "shot_result",
            {"success": True, "data": result.get("data"), "game": game.to_dict()},
            room=room,
        )

    db.session.commit()


@socketio.on("ball_pocketed")
def handle_ball_pocketed(data):
    """Handle a ball being pocketed."""
    if not current_user.is_authenticated:
        return False

    game_id = data.get("game_id")
    ball_data = data.get("ball_data", {})

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return

    result = game.process_ball_pocketed(ball_data)
    if result.get("success"):
        room = f"game_{game_id}"
        emit(
            "pocket_result",
            {"success": True, "data": result.get("data"), "game": game.to_dict()},
            room=room,
        )

        # Check for game completion
        if game.is_game_over():
            emit(
                "game_completed",
                {"winner": game.winner_id, "final_score": game.score, "stats": game.stats},
                room=room,
            )

    db.session.commit()


@socketio.on("break_shot")
def handle_break(data):
    """Handle the break shot."""
    if not current_user.is_authenticated:
        return False

    game_id = data.get("game_id")
    break_data = data.get("break_data", {})

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return

    result = game.process_break(break_data)
    if result.get("success"):
        room = f"game_{game_id}"
        emit(
            "break_result",
            {"success": True, "data": result.get("data"), "game": game.to_dict()},
            room=room,
        )

    db.session.commit()


@socketio.on("safety_declared")
def handle_safety(data):
    """Handle a safety being declared."""
    if not current_user.is_authenticated:
        return False

    game_id = data.get("game_id")
    safety_data = data.get("safety_data", {})

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return

    result = game.process_safety_play(safety_data)
    if result.get("success"):
        room = f"game_{game_id}"
        emit(
            "safety_result",
            {"success": True, "data": result.get("data"), "game": game.to_dict()},
            room=room,
        )

    db.session.commit()


@socketio.on("foul_called")
def handle_foul(data):
    """Handle a foul being called."""
    if not current_user.is_authenticated:
        return False

    game_id = data.get("game_id")
    foul_data = data.get("foul_data", {})

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return

    result = game.process_foul(foul_data)
    if result.get("success"):
        room = f"game_{game_id}"
        emit(
            "foul_result",
            {"success": True, "data": result.get("data"), "game": game.to_dict()},
            room=room,
        )

    db.session.commit()
