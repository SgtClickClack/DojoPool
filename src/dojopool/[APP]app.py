"""Main application module."""

import logging
import os
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from dotenv import load_dotenv
from flask import (
    Flask,
    Request,
    Response,
    current_app,
    jsonify,
    render_template,
    send_from_directory,
)
from flask.typing import ResponseReturnValue
from flask_login import LoginManager
from werkzeug.wrappers import Response as WerkzeugResponse

from .auth.routes import auth_bp
from .core.extensions import db
from .models.user import User
from .routes.game import game_bp
from .routes.main import main_bp
from .routes.performance import bp as performance_bp

# Configure logging
loggingetattr(g, "basicConfig", None)(
    level=loggingetattr(g, "DEBUG", None),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger: Any = loggingetattr(g, "getLogger", None)(__name__)


def create_app(config_name=None) -> Union[Any, Dict[Any, Any], app]:
    app = Flask(__name__)

    # Configure static and template folders explicitly
    static_folder = os.path.join(os.path.dirname(__file__), "static")
    template_folder: Any = os.path.join(os.path.dirname(__file__), "templates")

    app.static_folder = static_folder
    app.template_folder: Any = template_folder

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
    db_path: Any = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "instance", "dojopool.db"
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    db.init_app(app)
    login_manager: LoginManager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(performance_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(game_bp)

    # Root route
    @app.route("/")
    def index():
        """Landing page route."""
        logger.debug("Serving landing page")
        return render_template("index.html")

    # Custom static data
    @app.route("/static/<path:filename>")
    def custom_static(filename) -> Response:
        logger.debug(f"Serving static file: {filename}")
        return send_from_directory(static_folder, filename)

    @app.route("/api/venues")
    def get_venues():
        """Return a list of sample venues."""
        logger.debug("Getting venues")
        # Sample venue data
        venues: List[Any] = [
            {
                "name": "DojoPool London",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "rating": 4.8,
                "current_players": 12,
                "tables_count": 8,
                "address": "123 Pool Street, London",
            },
            {
                "name": "Cyber Cue Club",
                "latitude": 51.5225,
                "longitude": -0.1584,
                "rating": 4.5,
                "current_players": 8,
                "tables_count": 6,
                "address": "456 Game Road, London",
            },
            {
                "name": "Digital 8-Ball",
                "latitude": 51.4975,
                "longitude": -0.1357,
                "rating": 4.7,
                "current_players": 15,
                "tables_count": 10,
                "address": "789 Virtual Lane, London",
            },
        ]
        return jsonify(venues)

    @app.route("/api/v1/maps/verify-key")
    def verify_maps_key() -> ResponseReturnValue:
        """Verify the Google Maps API key."""
        logger.debug("Verifying Google Maps API key")
        api_key = app.config["GOOGLE_MAPS_API_KEY"]
        if not api_key:
            return {"valid": False, "error": "API key not configured"}, 400
        return {"valid": True, "key": api_key}

    @app.route("/api/health")
    def health_check():
        logger.debug("Health check endpoint called")
        return {"status": "healthy"}, 200

    return app


if __name__ == "__main__":
    app = create_app("development")
    app.run(debug=True, host="0.0.0.0", port=5000)
