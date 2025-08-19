"""WebSocket middleware module.

This module provides middleware for WebSocket authentication and rate limiting.
"""

from datetime import datetime
from functools import wraps
from typing import Any, Callable, Optional

from flask import current_app
from flask_login import current_user
from flask_socketio import disconnect

from dojopool.extensions import cache


def authenticated_only(f: Callable) -> Callable:
    """Decorator to require authentication for WebSocket events.

    Args:
        f: Function to decorate.

    Returns:
        Callable: Decorated function.
    """

    @wraps(f)
    def wrapped(*args: Any, **kwargs: Any) -> Any:
        if not current_user.is_authenticated:
            disconnect()
            return False
        return f(*args, **kwargs)

    return wrapped


def rate_limit(limit: int, per: int = 60) -> Callable:
    """Decorator to apply rate limiting to WebSocket events.

    Args:
        limit: Maximum number of events.
        per: Time period in seconds.

    Returns:
        Callable: Decorator function.
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            if not current_user.is_authenticated:
                return False

            key = f"ws_rate_limit:{current_user.id}:{f.__name__}"
            current = cache.get(key) or 0

            if current >= limit:
                return False

            cache.inc(key)
            if current == 0:
                cache.expire(key, per)

            return f(*args, **kwargs)

        return wrapped

    return decorator


def validate_room_access(room_type: str) -> Callable:
    """Decorator to validate room access for WebSocket events.

    Args:
        room_type: Type of room ('game' or 'tournament').

    Returns:
        Callable: Decorator function.
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            if not current_user.is_authenticated:
                return False

            data = args[0] if args else {}
            room_id = data.get("room_id")

            if not room_id:
                return False

            # Verify room access based on type
            if room_type == "game":
                game = Game.query.get(room_id)
                if not game or current_user.id not in [game.player1.user_id, game.player2.user_id]:
                    return False
            elif room_type == "tournament":
                tournament = Tournament.query.get(room_id)
                if not tournament or current_user not in tournament.players:
                    return False

            return f(*args, **kwargs)

        return wrapped

    return decorator


def log_event(f: Callable) -> Callable:
    """Decorator to log WebSocket events.

    Args:
        f: Function to decorate.

    Returns:
        Callable: Decorated function.
    """

    @wraps(f)
    def wrapped(*args: Any, **kwargs: Any) -> Any:
        event = f.__name__
        user_id = current_user.id if current_user.is_authenticated else None
        data = args[0] if args else {}

        current_app.logger.info(
            f"WebSocket event: {event}",
            extra={"user_id": user_id, "data": data, "timestamp": datetime.utcnow().isoformat()},
        )

        return f(*args, **kwargs)

    return wrapped


def error_handler(f: Callable) -> Callable:
    """Decorator to handle WebSocket event errors.

    Args:
        f: Function to decorate.

    Returns:
        Callable: Decorated function.
    """

    @wraps(f)
    def wrapped(*args: Any, **kwargs: Any) -> Any:
        try:
            return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.error(f"WebSocket error in {f.__name__}: {str(e)}", exc_info=True)
            return False

    return wrapped


def validate_data(required_fields: Optional[list] = None) -> Callable:
    """Decorator to validate WebSocket event data.

    Args:
        required_fields: List of required fields in event data.

    Returns:
        Callable: Decorator function.
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            if not args:
                return False

            data = args[0]
            if not isinstance(data, dict):
                return False

            if required_fields:
                missing = [field for field in required_fields if field not in data]
                if missing:
                    return False

            return f(*args, **kwargs)

        return wrapped

    return decorator
