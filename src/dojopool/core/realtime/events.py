"""WebSocket events module.

This module provides event registration and dispatching functionality for WebSocket operations.
"""

from datetime import datetime
from typing import Any, Dict

from flask import session
from flask_socketio import emit, join_room, leave_room

from .auth import require_permissions
from .constants import ErrorCodes, EventTypes, Permissions
from .decorators import event_handler
from .log_config import logger
from .utils import format_error_response


def handle_connect():
    """Handle client connection event."""
    try:
        # Generate client ID if not exists
        if "client_id" not in session:
            session["client_id"] = str(datetime.now().timestamp())

        # Join user's personal room
        if "user_id" in session:
            room = f'user_{session["user_id"]}'
            join_room(room)

        logger.info(
            f"Client connected: {session['client_id']}",
            extra={"client_id": session["client_id"], "user_id": session.get("user_id")},
        )

        # Send welcome message
        emit(
            "welcome",
            {
                "client_id": session["client_id"],
                "user_id": session.get("user_id"),
                "timestamp": datetime.now().isoformat(),
            },
        )

    except Exception:
        logger.error("Error handling connect", exc_info=True)


def handle_disconnect():
    """Handle client disconnection event."""
    try:
        if "client_id" in session:
            logger.info(
                f"Client disconnected: {session['client_id']}",
                extra={"client_id": session["client_id"]},
            )
    except Exception:
        logger.error("Error handling disconnect", exc_info=True)


@event_handler(EventTypes.JOIN_GAME, requires_auth=True)
def handle_join_game(data: Dict[str, Any]) -> None:
    """Handle game join event.

    Args:
        data: Game data
    """
    try:
        game_id = data.get("game_id")
        if not game_id:
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing game_id")
            emit("error", error)
            return

        # Join game room
        room = f"game_{game_id}"
        join_room(room)

        # Notify other players
        emit("player_joined", {"game_id": game_id, "player_id": session.get("user_id")}, room=room)

        logger.info(
            f"Player joined game: {game_id}",
            extra={"game_id": game_id, "player_id": session.get("user_id")},
        )

    except Exception:
        logger.error("Error handling join_game", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error joining game")
        emit("error", error)


@event_handler(EventTypes.LEAVE_GAME, requires_auth=True)
def handle_leave_game(data: Dict[str, Any]) -> None:
    """Handle game leave event.

    Args:
        data: Game data
    """
    try:
        game_id = data.get("game_id")
        if not game_id:
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing game_id")
            emit("error", error)
            return

        # Leave game room
        room = f"game_{game_id}"
        leave_room(room)

        # Notify other players
        emit("player_left", {"game_id": game_id, "player_id": session.get("user_id")}, room=room)

        logger.info(
            f"Player left game: {game_id}",
            extra={"game_id": game_id, "player_id": session.get("user_id")},
        )

    except Exception:
        logger.error("Error handling leave_game", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error leaving game")
        emit("error", error)


@event_handler(EventTypes.CHAT_MESSAGE, requires_auth=True)
def handle_chat_message(data: Dict[str, Any]) -> None:
    """Handle chat message event.

    Args:
        data: Message data
    """
    try:
        room = data.get("room")
        message = data.get("message")

        if not room or not message:
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing room or message")
            emit("error", error)
            return

        # Send message to room
        emit(
            "chat_message",
            {
                "room": room,
                "sender_id": session.get("user_id"),
                "message": message,
                "timestamp": datetime.now().isoformat(),
            },
            room=room,
        )

        logger.info(
            f"Chat message sent: {room}", extra={"room": room, "sender_id": session.get("user_id")}
        )

    except Exception:
        logger.error("Error handling chat_message", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error sending chat message")
        emit("error", error)


@event_handler(EventTypes.UPDATE_SCORE, requires_auth=True)
def handle_update_score(data: Dict[str, Any]) -> None:
    """Handle score update event.

    Args:
        data: Score data
    """
    try:
        game_id = data.get("game_id")
        player1_score = data.get("player1_score")
        player2_score = data.get("player2_score")

        if not all([game_id, player1_score is not None, player2_score is not None]):
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing required fields")
            emit("error", error)
            return

        # Emit score update to game room
        room = f"game_{game_id}"
        emit(
            "score_update",
            {
                "game_id": game_id,
                "player1_score": player1_score,
                "player2_score": player2_score,
                "timestamp": datetime.now().isoformat(),
            },
            room=room,
        )

        logger.info(
            f"Score updated: {game_id}",
            extra={
                "game_id": game_id,
                "player1_score": player1_score,
                "player2_score": player2_score,
            },
        )

    except Exception:
        logger.error("Error handling update_score", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error updating score")
        emit("error", error)


@event_handler(EventTypes.END_GAME, requires_auth=True)
def handle_end_game(data: Dict[str, Any]) -> None:
    """Handle game end event.

    Args:
        data: Game data
    """
    try:
        game_id = data.get("game_id")
        reason = data.get("reason", "Game completed")

        if not game_id:
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing game_id")
            emit("error", error)
            return

        # Emit game end to game room
        room = f"game_{game_id}"
        emit(
            "game_end",
            {"game_id": game_id, "reason": reason, "timestamp": datetime.now().isoformat()},
            room=room,
        )

        logger.info(f"Game ended: {game_id}", extra={"game_id": game_id, "reason": reason})

    except Exception:
        logger.error("Error handling end_game", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error ending game")
        emit("error", error)


@event_handler(EventTypes.JOIN_TOURNAMENT, requires_auth=True)
def handle_join_tournament(data: Dict[str, Any]) -> None:
    """Handle tournament join event.

    Args:
        data: Tournament data
    """
    try:
        tournament_id = data.get("tournament_id")
        if not tournament_id:
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing tournament_id")
            emit("error", error)
            return

        # Join tournament room
        room = f"tournament_{tournament_id}"
        join_room(room)

        # Notify other players
        emit(
            "player_joined_tournament",
            {"tournament_id": tournament_id, "player_id": session.get("user_id")},
            room=room,
        )

        logger.info(
            f"Player joined tournament: {tournament_id}",
            extra={"tournament_id": tournament_id, "player_id": session.get("user_id")},
        )

    except Exception:
        logger.error("Error handling join_tournament", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error joining tournament")
        emit("error", error)


@event_handler(EventTypes.LEAVE_TOURNAMENT, requires_auth=True)
def handle_leave_tournament(data: Dict[str, Any]) -> None:
    """Handle tournament leave event.

    Args:
        data: Tournament data
    """
    try:
        tournament_id = data.get("tournament_id")
        if not tournament_id:
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing tournament_id")
            emit("error", error)
            return

        # Leave tournament room
        room = f"tournament_{tournament_id}"
        leave_room(room)

        # Notify other players
        emit(
            "player_left_tournament",
            {"tournament_id": tournament_id, "player_id": session.get("user_id")},
            room=room,
        )

        logger.info(
            f"Player left tournament: {tournament_id}",
            extra={"tournament_id": tournament_id, "player_id": session.get("user_id")},
        )

    except Exception:
        logger.error("Error handling leave_tournament", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error leaving tournament")
        emit("error", error)


@event_handler(EventTypes.START_TOURNAMENT, requires_auth=True)
@require_permissions(Permissions.START_TOURNAMENT)
def handle_start_tournament(data: Dict[str, Any]) -> None:
    """Handle tournament start event.

    Args:
        data: Tournament data
    """
    try:
        tournament_id = data.get("tournament_id")
        settings = data.get("settings", {})

        if not tournament_id:
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing tournament_id")
            emit("error", error)
            return

        # Emit tournament start to tournament room
        room = f"tournament_{tournament_id}"
        emit(
            "tournament_start",
            {
                "tournament_id": tournament_id,
                "settings": settings,
                "timestamp": datetime.now().isoformat(),
            },
            room=room,
        )

        logger.info(
            f"Tournament started: {tournament_id}",
            extra={"tournament_id": tournament_id, "settings": settings},
        )

    except Exception:
        logger.error("Error handling start_tournament", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error starting tournament")
        emit("error", error)


@event_handler(EventTypes.END_TOURNAMENT, requires_auth=True)
@require_permissions(Permissions.END_TOURNAMENT)
def handle_end_tournament(data: Dict[str, Any]) -> None:
    """Handle tournament end event.

    Args:
        data: Tournament data
    """
    try:
        tournament_id = data.get("tournament_id")
        reason = data.get("reason", "Tournament completed")

        if not tournament_id:
            error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Missing tournament_id")
            emit("error", error)
            return

        # Emit tournament end to tournament room
        room = f"tournament_{tournament_id}"
        emit(
            "tournament_end",
            {
                "tournament_id": tournament_id,
                "reason": reason,
                "timestamp": datetime.now().isoformat(),
            },
            room=room,
        )

        logger.info(
            f"Tournament ended: {tournament_id}",
            extra={"tournament_id": tournament_id, "reason": reason},
        )

    except Exception:
        logger.error("Error handling end_tournament", exc_info=True, extra={"data": data})
        error = format_error_response(ErrorCodes.SERVER_ERROR, "Error ending tournament")
        emit("error", error)
