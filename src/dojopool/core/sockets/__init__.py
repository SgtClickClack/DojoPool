"""WebSocket initialization module for DojoPool."""

from flask_socketio import SocketIO

socketio = SocketIO()


def init_socketio(app):
    """Initialize SocketIO with the Flask app."""
    socketio.init_app(
        app, cors_allowed_origins="*", async_mode="eventlet", logger=True, engineio_logger=True
    )

    # Import socket event handlers
    from . import events  # noqa
