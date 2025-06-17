"""WebSocket event handlers for real-time game tracking."""

from flask_login import current_user
from flask_socketio import emit, join_room, leave_room
from flask import current_app

from ..extensions import db, socketio
from dojopool.models.game import Game
from .chat_events import *

@socketio.on("connect")
def handle_connect():
    """Handle client connection."""
    # Allow unauthenticated connections in development mode
    if current_app.config.get('ENV') == 'development':
        emit("connection_response", {"status": "connected"})
        return True
    
    # Require authentication in production
    if not current_user.is_authenticated:
        return False
    
    emit("connection_response", {"status": "connected"})
    return True


@socketio.on("join_game")
def handle_join_game(data):
    """Handle a player joining a game room."""
    if not current_user.is_authenticated:
        return False

    game_id = data.get("game_id")
    if not game_id:
        emit("error", {"message": "Game ID is required"})
        return

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return

    # Verify player is part of the game
    if current_user.id not in [game.player1_id, game.player2_id]:
        emit("error", {"message": "Not authorized to join this game"})
        return

    room = f"game_{game_id}"
    join_room(room)
    emit("joined_game", {"game": game.to_dict()}, room=room)


@socketio.on("leave_game")
def handle_leave_game(data):
    """Handle a player leaving a game room."""
    game_id = data.get("game_id")
    if game_id:
        room = f"game_{game_id}"
        leave_room(room)
        emit("left_game", {"game_id": game_id}, room=room)


@socketio.on("game_action")
def handle_game_action(data):
    """Handle game actions (shots, fouls, etc.)."""
    if not current_user.is_authenticated:
        return False

    game_id = data.get("game_id")
    action_type = data.get("action_type")
    action_data = data.get("action_data", {})

    if not all([game_id, action_type]):
        emit("error", {"message": "Missing required fields"})
        return

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return

    # Process different types of actions
    if action_type == "shot":
        # Handle shot action
        result = game.process_shot(action_data)
        if result.get("success"):
            room = f"game_{game_id}"
            emit(
                "game_update",
                {"type": "shot", "data": result.get("data"), "game": game.to_dict()},
                room=room,
            )

    elif action_type == "foul":
        # Handle foul action
        result = game.process_foul(action_data)
        if result.get("success"):
            room = f"game_{game_id}"
            emit(
                "game_update",
                {"type": "foul", "data": result.get("data"), "game": game.to_dict()},
                room=room,
            )

    # Save game state
    db.session.commit()


@socketio.on("request_game_state")
def handle_game_state_request(data):
    """Handle requests for current game state."""
    game_id = data.get("game_id")
    if not game_id:
        emit("error", {"message": "Game ID is required"})
        return

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return

    emit("game_state", {"game": game.to_dict()})
