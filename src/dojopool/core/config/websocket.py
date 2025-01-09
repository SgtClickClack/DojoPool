"""WebSocket configuration module."""

from typing import Dict, Any

# WebSocket configuration
WEBSOCKET_CONFIG: Dict[str, Any] = {
    'port': 5000,
    'host': '127.0.0.1',
    'ping_timeout': 60,
    'ping_interval': 25,
    'cors_allowed_origins': '*',
    'async_mode': 'gevent',  # Use gevent for better performance
    'message_queue': None,  # Use Redis in production
    'websocket_path': '/socket.io',
    'always_connect': True,
    'transports': ['websocket', 'polling'],  # Support both WebSocket and polling
    'engineio_logger': True,  # Enable Engine.IO logging
    'logger': True,  # Enable Socket.IO logging
    'log_output': True,  # Enable output logging
    'allow_upgrades': True,  # Allow transport upgrades
    'upgrade_logger': True  # Enable upgrade logging
}

# Event types
EVENT_TYPES = [
    'match_found',
    'match_accepted',
    'match_declined',
    'match_cancelled',
    'match_started',
    'match_completed',
    'game_update',
    'chat_message',
    'notification'
]

# Room types
ROOM_TYPES = [
    'game',
    'tournament',
    'chat',
    'notification'
]

# Rate limiting
RATE_LIMITS = {
    'connection': 60,  # connections per minute
    'message': 120,   # messages per minute
    'event': 180      # events per minute
}

# Error messages
ERROR_MESSAGES = {
    'auth_failed': 'Authentication failed',
    'rate_limited': 'Rate limit exceeded',
    'invalid_message': 'Invalid message format',
    'unknown_event': 'Unknown event type',
    'connection_error': 'Connection error'
}
