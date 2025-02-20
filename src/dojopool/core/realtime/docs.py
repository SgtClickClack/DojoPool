import gc
import gc
"""WebSocket documentation module.

This module provides documentation for WebSocket events and protocols.
"""

from typing import Any, Dict, List

# Event documentation
EVENTS = {
    "connect": {
        "description": "Fired when client connects to server",
        "authentication_required": True,
        "response": {"type": "boolean", "description": "True if connection successful"},
    },
    "disconnect": {
        "description": "Fired when client disconnects from server",
        "authentication_required": False,
        "response": None,
    },
    "join_game": {
        "description": "Join a game room",
        "authentication_required": True,
        "parameters": {
            "game_id": {
                "type": "integer",
                "description": "ID of the game to join",
                "required": True,
            }
        },
        "response": {"type": "boolean", "description": "True if successfully joined"},
        "emits": [
            {
                "event": "player_joined",
                "data": {"user_id": "integer", "username": "string"},
            }
        ],
    },
    "leave_game": {
        "description": "Leave a game room",
        "authentication_required": True,
        "parameters": {
            "game_id": {
                "type": "integer",
                "description": "ID of the game to leave",
                "required": True,
            }
        },
        "response": {"type": "boolean", "description": "True if successfully left"},
        "emits": [
            {
                "event": "player_left",
                "data": {"user_id": "integer", "username": "string"},
            }
        ],
    },
    "update_score": {
        "description": "Update game scores",
        "authentication_required": True,
        "parameters": {
            "game_id": {
                "type": "integer",
                "description": "ID of the game",
                "required": True,
            },
            "player1_score": {
                "type": "integer",
                "description": "Score for player 1",
                "required": True,
            },
            "player2_score": {
                "type": "integer",
                "description": "Score for player 2",
                "required": True,
            },
        },
        "response": {"type": "boolean", "description": "True if successfully updated"},
        "emits": [
            {
                "event": "score_updated",
                "data": {
                    "game_id": "integer",
                    "player1_score": "integer",
                    "player2_score": "integer",
                    "updated_by": "integer",
                },
            }
        ],
    },
    "end_game": {
        "description": "End a game",
        "authentication_required": True,
        "parameters": {
            "game_id": {
                "type": "integer",
                "description": "ID of the game to end",
                "required": True,
            }
        },
        "response": {"type": "boolean", "description": "True if successfully ended"},
        "emits": [
            {
                "event": "game_ended",
                "data": {
                    "game_id": "integer",
                    "winner_id": "integer",
                    "final_scores": {"player1": "integer", "player2": "integer"},
                },
            }
        ],
    },
    "join_tournament": {
        "description": "Join a tournament room",
        "authentication_required": True,
        "parameters": {
            "tournament_id": {
                "type": "integer",
                "description": "ID of the tournament to join",
                "required": True,
            }
        },
        "response": {"type": "boolean", "description": "True if successfully joined"},
        "emits": [
            {
                "event": "participant_joined",
                "data": {"user_id": "integer", "username": "string"},
            }
        ],
    },
    "leave_tournament": {
        "description": "Leave a tournament room",
        "authentication_required": True,
        "parameters": {
            "tournament_id": {
                "type": "integer",
                "description": "ID of the tournament to leave",
                "required": True,
            }
        },
        "response": {"type": "boolean", "description": "True if successfully left"},
        "emits": [
            {
                "event": "participant_left",
                "data": {"user_id": "integer", "username": "string"},
            }
        ],
    },
    "chat_message": {
        "description": "Send chat message",
        "authentication_required": True,
        "parameters": {
            "room_id": {
                "type": "integer",
                "description": "ID of the room",
                "required": True,
            },
            "message": {
                "type": "string",
                "description": "Message content",
                "required": True,
            },
            "room_type": {
                "type": "string",
                "description": "Type of room (game or tournament)",
                "required": True,
                "enum": ["game", "tournament"],
            },
        },
        "response": {"type": "boolean", "description": "True if successfully sent"},
        "emits": [
            {
                "event": "chat_message",
                "data": {
                    "user_id": "integer",
                    "username": "string",
                    "message": "string",
                    "timestamp": "string",
                },
            }
        ],
    },
}


def get_event_docs(event_name: str) -> Dict[str, Any]:
    """Get documentation for specific event.

    Args:
        event_name: Name of the event.

    Returns:
        Dict[str, Any]: Event documentation.
    """
    return EVENTS.get(event_name, {})


def get_all_events():
    """Get list of all documented events.

    Returns:
        List[str]: List of event names.
    """
    return list(EVENTS.keys())


def get_authenticated_events():
    """Get list of events requiring authentication.

    Returns:
        List[str]: List of event names.
    """
    return [
        event
        for event, docs in EVENTS.items()
        if docs.get("authentication_required", False)
    ]


def get_event_parameters(event_name: str):
    """Get parameters for specific event.

    Args:
        event_name: Name of the event.

    Returns:
        Dict[str, Any]: Event parameters.
    """
    event = EVENTS.get(event_name, {})
    return event.get("parameters", {})


def get_event_response(event_name: str) -> Dict[str, Any]:
    """Get response format for specific event.

    Args:
        event_name: Name of the event.

    Returns:
        Dict[str, Any]: Event response format.
    """
    event = EVENTS.get(event_name, {})
    return event.get("response", {})
