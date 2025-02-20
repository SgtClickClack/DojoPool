"""Routes registration module."""

from flask import Blueprint, Flask

from .auth import auth_bp
from .game import game_bp
from .main import main_bp


def register_routes(app: Flask) -> None:
    """Register all application blueprints.

    Args:
        app: Flask application instance
    """
    # Register blueprints with their URL prefixes
    app.register_blueprint(main_bp)  # No prefix for main routes
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(game_bp, url_prefix="/game")
