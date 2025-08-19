"""WebSocket decorators module.

This module provides function decorators for common WebSocket operations.
"""

import functools
import time
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, Optional

from .constants import ErrorCodes
from .log_config import logger
from .utils import format_error_response, get_room_config, validate_event_data


def event_handler(event_type: str, requires_auth: bool = False) -> Callable:
    """Decorator to handle WebSocket events.

    Args:
        event_type: Type of event to handle
        requires_auth: Whether authentication is required

    Returns:
        Callable: Decorator function
    """

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        async def wrapper(socket, data: Dict[str, Any], *args, **kwargs):
            try:
                # Check authentication if required
                if requires_auth:
                    if not hasattr(socket, "authenticated") or not socket.authenticated:
                        error = format_error_response(
                            ErrorCodes.AUTH_REQUIRED, "Authentication required for this operation"
                        )
                        await socket.emit("error", error)
                        return

                # Validate event data
                validation_error = validate_event_data(event_type, data)
                if validation_error:
                    error = format_error_response(ErrorCodes.VALIDATION_ERROR, validation_error)
                    await socket.emit("error", error)
                    return

                # Call the handler
                return await f(socket, data, *args, **kwargs)

            except Exception as e:
                logger.error(
                    f"Error handling event {event_type}", exc_info=True, extra={"data": data}
                )
                error = format_error_response(
                    ErrorCodes.SERVER_ERROR,
                    "Error handling event",
                    {"message": str(e)} if socket.debug else None,
                )
                await socket.emit("error", error)

        return wrapper

    return decorator


def require_auth(f: Callable) -> Callable:
    """Decorator to require authentication for WebSocket events.

    Args:
        f: Function to decorate

    Returns:
        Callable: Decorated function
    """

    @functools.wraps(f)
    def wrapper(socket, *args, **kwargs):
        if not hasattr(socket, "authenticated") or not socket.authenticated:
            error = format_error_response(
                ErrorCodes.AUTH_REQUIRED, "Authentication required for this operation"
            )
            return socket.emit("error", error)
        return f(socket, *args, **kwargs)

    return wrapper


def validate_event(event_type: str) -> Callable:
    """Decorator to validate WebSocket event data.

    Args:
        event_type: Type of event to validate

    Returns:
        Callable: Decorator function
    """

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def wrapper(socket, data: Dict[str, Any], *args, **kwargs):
            # Validate event data
            validation_error = validate_event_data(event_type, data)
            if validation_error:
                error = format_error_response(
                    validation_error["code"],
                    validation_error["message"],
                    validation_error.get("details"),
                )
                return socket.emit("error", error)
            return f(socket, data, *args, **kwargs)

        return wrapper

    return decorator


def rate_limit(
    max_requests: int, time_window: timedelta, error_message: Optional[str] = None
) -> Callable:
    """Decorator to apply rate limiting to WebSocket events.

    Args:
        max_requests: Maximum number of requests allowed
        time_window: Time window for rate limiting
        error_message: Optional error message

    Returns:
        Callable: Decorator function
    """

    def decorator(f: Callable) -> Callable:
        # Store request timestamps per client
        request_history: Dict[str, list] = {}

        @functools.wraps(f)
        def wrapper(socket, *args, **kwargs):
            client_id = str(socket.id)
            current_time = time.time()

            # Initialize request history for client
            if client_id not in request_history:
                request_history[client_id] = []

            # Remove old requests outside time window
            window_start = current_time - time_window.total_seconds()
            request_history[client_id] = [
                ts for ts in request_history[client_id] if ts > window_start
            ]

            # Check rate limit
            if len(request_history[client_id]) >= max_requests:
                error = format_error_response(
                    ErrorCodes.RATE_LIMIT_ERROR,
                    error_message or "Rate limit exceeded",
                    {
                        "max_requests": max_requests,
                        "time_window": time_window.total_seconds(),
                        "retry_after": window_start + time_window.total_seconds() - current_time,
                    },
                )
                return socket.emit("error", error)

            # Add current request timestamp
            request_history[client_id].append(current_time)

            return f(socket, *args, **kwargs)

        return wrapper

    return decorator


def validate_room_access(room_type: str) -> Callable:
    """Decorator to validate room access for WebSocket events.

    Args:
        room_type: Type of room to validate

    Returns:
        Callable: Decorator function
    """

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def wrapper(socket, data: Dict[str, Any], *args, **kwargs):
            room_id = data.get("room_id")
            if not room_id:
                error = format_error_response(ErrorCodes.VALIDATION_ERROR, "Room ID is required")
                return socket.emit("error", error)

            # Get room configuration
            room_config = get_room_config(room_type)

            # Check if room exists
            if not hasattr(socket, "rooms") or room_id not in socket.rooms:
                error = format_error_response(ErrorCodes.ROOM_NOT_FOUND, "Room not found")
                return socket.emit("error", error)

            # Check room capacity
            room = socket.rooms[room_id]
            if len(room.members) >= room_config["max_members"]:
                error = format_error_response(ErrorCodes.ROOM_FULL, "Room is at maximum capacity")
                return socket.emit("error", error)

            # Check authentication if required
            if room_config["requires_auth"]:
                if not hasattr(socket, "authenticated") or not socket.authenticated:
                    error = format_error_response(
                        ErrorCodes.AUTH_REQUIRED, "Authentication required for room access"
                    )
                    return socket.emit("error", error)

            return f(socket, data, *args, **kwargs)

        return wrapper

    return decorator


def log_event(event_type: str) -> Callable:
    """Decorator to log WebSocket events.

    Args:
        event_type: Type of event to log

    Returns:
        Callable: Decorator function
    """

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def wrapper(socket, *args, **kwargs):
            start_time = time.time()
            result = f(socket, *args, **kwargs)
            end_time = time.time()

            # Log event details
            logger.info(
                f"WebSocket event: {event_type}",
                extra={
                    "event_type": event_type,
                    "client_id": str(socket.id),
                    "args": args,
                    "kwargs": kwargs,
                    "duration": end_time - start_time,
                    "timestamp": datetime.now().isoformat(),
                },
            )

            return result

        return wrapper

    return decorator


def handle_errors(f: Callable) -> Callable:
    """Decorator to handle WebSocket event errors.

    Args:
        f: Function to decorate

    Returns:
        Callable: Decorated function
    """

    @functools.wraps(f)
    def wrapper(socket, *args, **kwargs):
        try:
            return f(socket, *args, **kwargs)
        except Exception as e:
            # Log the error
            logger.error(
                f"WebSocket error: {str(e)}",
                exc_info=True,
                extra={
                    "client_id": str(socket.id),
                    "args": args,
                    "kwargs": kwargs,
                    "timestamp": datetime.now().isoformat(),
                },
            )

            # Send error response to client
            error = format_error_response(
                ErrorCodes.SERVER_ERROR,
                "An unexpected error occurred",
                {"message": str(e)} if socket.debug else None,
            )
            socket.emit("error", error)

    return wrapper


def measure_latency(f: Callable) -> Callable:
    """Decorator to measure WebSocket event latency.

    Args:
        f: Function to decorate

    Returns:
        Callable: Decorated function
    """

    @functools.wraps(f)
    def wrapper(socket, *args, **kwargs):
        start_time = time.time()
        result = f(socket, *args, **kwargs)
        end_time = time.time()

        # Record latency metric
        latency = (end_time - start_time) * 1000  # Convert to milliseconds
        if hasattr(socket, "metrics"):
            socket.metrics.record_latency(latency)

        return result

    return wrapper
