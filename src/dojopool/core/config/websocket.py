"""WebSocket configuration module."""

from typing import Any, Dict

# WebSocket configuration
WEBSOCKET_CONFIG: Dict[str, Any] = {
    "port": 8000,  # Match the port in app.py
    "host": "127.0.0.1",
    "ping_timeout": 120,  # Increased timeout
    "ping_interval": 30,  # Increased interval
    "cors_allowed_origins": "*",
    "async_mode": "eventlet",  # Consistently use eventlet
    "message_queue": None,  # Use Redis in production
    "websocket_path": "/socket.io",
    "always_connect": True,
    "transports": ["websocket"],  # Only use WebSocket, no polling
    "engineio_logger": True,
    "logger": True,
    "log_output": True,
    "allow_upgrades": True,
    "upgrade_logger": True,
    "reconnection": True,
    "reconnection_attempts": 5,
    "reconnection_delay": 1000,
    "reconnection_delay_max": 5000,
}

# Event types
EVENT_TYPES = [
    "match_found",
    "match_accepted",
    "match_declined",
    "match_cancelled",
    "match_started",
    "match_completed",
    "game_update",
    "chat_message",
    "notification",
]

# Room types
ROOM_TYPES = ["game", "tournament", "chat", "notification"]

# Rate limiting
RATE_LIMITS = {
    "connection": 60,  # connections per minute
    "message": 120,  # messages per minute
    "event": 180,  # events per minute
}

# Error messages
ERROR_MESSAGES = {
    "auth_failed": "Authentication failed",
    "rate_limited": "Rate limit exceeded",
    "invalid_message": "Invalid message format",
    "unknown_event": "Unknown event type",
    "connection_error": "Connection error",
}
