"""Routes registration module."""

from flask import Blueprint

from .api import api_bp
from .auth import auth_bp
from .chat_routes import chat_bp
from .game import game_bp
from .main import main_bp
from .message_routes import message_bp
from .narrative import narrative_bp
from .ranking import ranking_bp
from .spectator import spectator_bp
from .api.error_tracking_routes import error_tracking_bp


def register_routes(app):
    """Register Flask blueprints."""
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(error_tracking_bp)
    app.register_blueprint(main_bp, url_prefix="/")
    app.register_blueprint(game_bp, url_prefix="/game")
    app.register_blueprint(ranking_bp, url_prefix="/ranking")
    app.register_blueprint(spectator_bp, url_prefix="/spectator")
    app.register_blueprint(narrative_bp, url_prefix="/narrative")
    app.register_blueprint(message_bp, url_prefix="/message")
    app.register_blueprint(chat_bp, url_prefix="/chat")
