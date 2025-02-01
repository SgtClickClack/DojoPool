"""Main application module."""

import logging
import os

import eventlet
from dotenv import load_dotenv
from flask import Flask
from flask_login import LoginManager

from dojopool.core.extensions import db
from dojopool.core.main.views import bp as main_bp
from dojopool.core.models.auth import User
from dojopool.core.sockets import init_socketio, socketio
from dojopool.routes.auth import auth_bp
from dojopool.routes.game import game_bp
from dojopool.routes.performance import bp as performance_bp
from dojopool.routes.venue import bp as venue_bp

# Initialize eventlet for async operations
eventlet.monkey_patch()

logger = logging.getLogger(__name__)


def create_app(config_name=None):
    app = Flask(__name__)

    # Configure static and template folders explicitly
    static_folder = os.path.join(os.path.dirname(__file__), "static")
    template_folder = os.path.join(os.path.dirname(__file__), "templates")

    app.static_folder = static_folder
    app.template_folder = template_folder

    logger.debug(f"Static folder: {static_folder}")
    logger.debug(f"Template folder: {template_folder}")

    # Load environment variables
    load_dotenv()

    # Basic configuration
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0  # Disable cache during development
    app.config["GOOGLE_MAPS_API_KEY"] = os.getenv("GOOGLE_MAPS_API_KEY", "")
    app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID", "")
    app.config["GOOGLE_CLIENT_SECRET"] = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # Database configuration
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "instance", "dojopool.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    db.init_app(app)
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    from dojopool.core.health import health_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(performance_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(game_bp, url_prefix="/game")
    app.register_blueprint(venue_bp)

    # Initialize SocketIO
    init_socketio(app)

    return app


if __name__ == "__main__":
    app = create_app()
    socketio.run(app, debug=True, port=8000)
