# try:
#     import eventlet
#     eventlet.monkey_patch()
# except ImportError:
#     print("[INFO] Eventlet not installed. Skipping monkey_patch.")

"""Main application module."""

import logging
import os
import sys

# --- Ensure eventlet monkey_patch is called before any other imports ---
# try:
#     import eventlet
#     eventlet.monkey_patch()
# except ImportError:
#     print("[INFO] Eventlet not installed. Skipping monkey_patch.")
# ---------------------------------------------------------------------

"""Main application module."""

import logging
from dotenv import load_dotenv
from flask import Flask
from flask_login import LoginManager

# Import the function to get the correct config class
from dojopool.core.config import get_config
# Import the main extensions initializer and instances
from dojopool.core.extensions import db, init_extensions, login_manager
from dojopool.core.sockets import init_socketio, socketio
from dojopool.routes.auth import auth_bp
from dojopool.routes.game import game_bp
from dojopool.routes.performance import bp as performance_bp
from dojopool.routes.venue import bp as venue_bp
from dojopool.core.health import health_bp

logger = logging.getLogger(__name__)

def create_app(config_name=None, test_config=None):
    """Application factory function."""
    app = Flask(__name__, instance_relative_config=True)

    # --- CORS MIDDLEWARE: Ensure CORS is enabled for all routes and blueprints ---
    from dojopool.core.monitoring.cors_middleware import init_cors
    init_cors(app)
    # ---------------------------------------------------------------------------

    # Import ALL models before initializing extensions (required for table registration)
    # import dojopool.models.achievement  # Removed duplicate, use achievements
    import dojopool.models.achievements
    import dojopool.models.activity
    import dojopool.models.analytics
    import dojopool.models.associations
    import dojopool.models.base
    import dojopool.models.cached_queries
    import dojopool.models.chat
    import dojopool.models.device
    import dojopool.models.event
    import dojopool.models.event_participant
    import dojopool.models.forum
    import dojopool.models.friend
    import dojopool.models.friendship
    import dojopool.models.game
    import dojopool.models.game_analysis
    import dojopool.models.inventory
    import dojopool.models.leaderboard
    import dojopool.models.location
    import dojopool.models.marketplace
    import dojopool.models.match
    import dojopool.models.notification
    import dojopool.models.notification_settings
    import dojopool.models.player
    import dojopool.models.player_ratings
    import dojopool.models.player_status
    import dojopool.models.player_titles
    import dojopool.models.ranking_history
    import dojopool.models.rankings
    import dojopool.models.rating
    import dojopool.models.review
    import dojopool.models.reward
    import dojopool.models.role
    import dojopool.models.session
    import dojopool.models.share
    import dojopool.models.shot
    import dojopool.models.social
    import dojopool.models.social_groups
    import dojopool.models.token
    import dojopool.models.tournament
    import dojopool.models.tournaments
    import dojopool.models.user
    import dojopool.models.user_roles
    import dojopool.models.venue
    import dojopool.models.venue_amenity
    import dojopool.models.venue_checkin
    import dojopool.models.venue_leaderboard
    import dojopool.models.venue_operating_hours

    # Determine which config class to use
    ConfigClass = get_config(config_name) # Use the provided function
    app.config.from_object(ConfigClass()) # Load config from the chosen class instance

    # Apply test config overrides BEFORE extensions are initialized
    if test_config:
        app.config.update(test_config)

    # Print selected config for debugging (optional)
    logger.info(f"Loading configuration: {ConfigClass.__name__}")

    # Print out the DB URI for debugging
    print(f"[DEBUG] SQLALCHEMY_DATABASE_URI: {app.config.get('SQLALCHEMY_DATABASE_URI')}")
    print(f"[DEBUG] Config class: {ConfigClass.__name__}")

    # Configure static and template folders explicitly
    # Note: These might be overridden by instance config if instance_relative_config=True
    static_folder = os.path.join(os.path.dirname(__file__), "static")
    template_folder = os.path.join(os.path.dirname(__file__), "templates")

    app.static_folder = static_folder
    app.template_folder = template_folder

    logger.debug(f"Static folder: {static_folder}")
    logger.debug(f"Template folder: {template_folder}")

    # Load environment variables from .env file
    load_dotenv(os.path.join(app.instance_path, '.env')) # Look for .env in instance folder
    load_dotenv() # Also load from project root if needed

    # Apply configuration loaded via from_object and potentially from .env
    # Example: Secret key might be set in ConfigClass or overridden by .env
    app.config.setdefault("SECRET_KEY", ConfigClass.SECRET_KEY) # Ensure a default if not set

    # Example: Set Google keys from env vars if not already set by ConfigClass
    app.config.setdefault("GOOGLE_MAPS_API_KEY", os.getenv("GOOGLE_MAPS_API_KEY", ""))
    app.config.setdefault("GOOGLE_CLIENT_ID", os.getenv("GOOGLE_CLIENT_ID", ""))
    app.config.setdefault("GOOGLE_CLIENT_SECRET", os.getenv("GOOGLE_CLIENT_SECRET", ""))

    # Patch: Prefer DATABASE_URL from environment if set
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        print(f"[PATCH] Overriding SQLALCHEMY_DATABASE_URI with DATABASE_URL from env: {db_url}")
        app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    else:
        print(f"[PATCH] Using SQLALCHEMY_DATABASE_URI from config: {app.config.get('SQLALCHEMY_DATABASE_URI')}")

    # Database configuration (Ensure URI is set correctly)
    # Option 1: Set directly in config classes (e.g., DevelopmentConfig)
    # Option 2: Set via environment variable (recommended)
    # Temporarily use an absolute path for testing
    default_db_path = os.path.join(app.instance_path, "dojopool.db") # Original default
    # Construct absolute URI correctly for Windows
    absolute_db_uri = f"sqlite:///{default_db_path.replace(os.sep, '/')}" # Use forward slashes
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    # Initialize extensions using the central function
    init_extensions(app)

    with app.app_context():
        # Ensure instance folder exists
        try:
            os.makedirs(app.instance_path)
        except OSError:
            pass
        # db.init_app(app) # No longer needed here, handled by init_extensions
        # db.create_all() # Keep disabled - workaround for startup issue

    @login_manager.user_loader
    def load_user(user_id):
        # Use the User model imported correctly earlier
        from dojopool.models.user import User
        return User.query.get(int(user_id))

    # === Flask-DebugToolbar ===
    from flask_debugtoolbar import DebugToolbarExtension
    app.debug = True
    app.config['SECRET_KEY'] = app.config.get('SECRET_KEY', 'dev')
    app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
    toolbar = DebugToolbarExtension(app)

    # === Register blueprints (force correct main_bp) ===
    from dojopool.routes.main import main_bp as correct_main_bp
    print(f"[DEBUG] main_bp imported from: {correct_main_bp.__module__}")
    print(f"[DEBUG] main_bp object: {correct_main_bp}")
    app.register_blueprint(correct_main_bp)
    # Remove/comment out any other main_bp registrations here

    # --- Register Tournament/Game Blueprint ---
    try:
        from dojopool.api.tournament import tournament_bp
        app.register_blueprint(tournament_bp, url_prefix="/api")
    except ImportError as e:
        print(f"[ERROR] Could not import tournament blueprint: {e}")
    except Exception as e:
        print(f"[ERROR] Could not register tournament blueprint: {e}")

    # Register blueprints
    from dojopool.api.v1 import api_v1_bp
    app.register_blueprint(api_v1_bp, url_prefix="/api/v1")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(performance_bp) # Adjust prefix if needed
    app.register_blueprint(game_bp, url_prefix="/game")
    app.register_blueprint(venue_bp) # Adjust prefix if needed

    # === DEBUG: Print all registered routes ===
    print("[ROUTES]")
    for rule in app.url_map.iter_rules():
        print(rule)

    # Initialize SocketIO
    init_socketio(app)

    return app


if __name__ == "__main__":
    app = create_app()
    # Use socketio.run for development server with WebSocket support
    # Host='0.0.0.0' makes it accessible on the network
    socketio.run(app, host='0.0.0.0', port=8000, debug=app.config.get("DEBUG", True), use_reloader=app.config.get("DEBUG", True))
    # Note: Uvicorn command might not be needed if running directly like this,
    # unless specific ASGI features beyond Flask-SocketIO are required.
    # If using uvicorn, the app instance passed should be 'app', not 'socketio'.
