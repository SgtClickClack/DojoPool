# try:
#     import eventlet
#     eventlet.monkey_patch()
# except ImportError:
#     print("[INFO] Eventlet not installed. Skipping monkey_patch.")

"""Main application module."""

import logging
import os
import sys
from datetime import datetime
from flask import jsonify, request

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
from flask import Flask, render_template, request, redirect, url_for, flash, session, g
from flask_login import current_user, LoginManager
import flask_debugtoolbar
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from dojopool.extensions import migrate, socketio
from dojopool.core.sockets import init_socketio
from dojopool.core.config import get_config
# Import the main extensions initializer and instances
from dojopool.extensions import db, init_extensions, login_manager
from dojopool.routes.auth import auth_bp
from dojopool.routes.game import game_bp
from dojopool.routes.performance import bp as performance_bp
from dojopool.routes.venue import bp as venue_bp
from dojopool.routes.feed import bp as feed_bp
from dojopool.core.health import health_bp
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
from .models.user import User

logger = logging.getLogger(__name__)

def create_app(config_name=None, test_config=None, testing=False):
    """Application factory function."""
    app = Flask(__name__, instance_relative_config=True)

    # --- CORS Configuration ---
    # Remove Flask-CORS and use custom CORS middleware instead
    # This prevents conflicts with Flask-RESTful response handling
    from dojopool.core.monitoring.cors_middleware import init_cors
    init_cors(app)
    # -----------------------------------------

    # Trigger model discovery via models/__init__.py
    import dojopool.models

    # --- REMOVED REDUNDANT EXPLICIT MODEL IMPORTS ---
    # import dojopool.models.achievement # Removed duplicate, use achievements
    # import dojopool.models.achievements
    # import dojopool.models.activity
    # ... (many imports removed for brevity) ...
    # import dojopool.models.venue_operating_hours
    # --- END REMOVED IMPORTS ---

    # At the very top of create_app or before config is read
    if os.environ.get("FLASK_ENV") == "development":
        load_dotenv(".env.development")

    # Determine which config class to use
    ConfigClass = get_config(config_name) # Use the provided function
    app.config.from_object(ConfigClass()) # Load config from the chosen class instance

    # Apply test config overrides BEFORE extensions are initialized
    if test_config:
        app.config.update(test_config)
    if testing:
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    # --- Caching Configuration ---
    app.config["CACHE_TYPE"] = "SimpleCache"
    app.config["CACHE_DEFAULT_TIMEOUT"] = 300 # Default timeout 5 minutes
    # app.config["CACHE_REDIS_URL"] = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    # ---------------------------

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

    # Correct: Set Google keys from env vars if not already set by ConfigClass
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

    # === Flask-DebugToolbar ===
    if app.debug: # Only initialize toolbar in debug mode
        try:
            from flask_debugtoolbar import DebugToolbarExtension
            app.config['SECRET_KEY'] = app.config.get('SECRET_KEY', 'dev') # Ensure secret key is set
            app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
            toolbar = DebugToolbarExtension(app)
            print("[INFO] Flask-DebugToolbar initialized.")
        except ImportError:
            print("[WARNING] Flask-DebugToolbar not installed. Skipping initialization.")

    # === Register blueprints (force correct main_bp) ===
    from dojopool.routes.main import main_bp as correct_main_bp
    print(f"[DEBUG] main_bp imported from: {correct_main_bp.__module__}")
    print(f"[DEBUG] main_bp object: {correct_main_bp}")
    app.register_blueprint(correct_main_bp)
    # Remove/comment out any other main_bp registrations here

    # --- SPA Fallback Handler ---
    @app.errorhandler(404)
    def spa_fallback(e):
        """Serve SPA index.html for unmatched routes."""
        from flask import send_from_directory
        import os
        
        # Try to serve from public directory first
        public_path = os.path.join(app.root_path, '../../public')
        index_path = os.path.join(public_path, 'index.html')
        
        if os.path.exists(index_path):
            return send_from_directory(public_path, 'index.html')
        
        # Fallback to template rendering
        try:
            return render_template("index.html")
        except Exception as template_error:
            logger.error(f"Error sending SPA fallback file: {template_error}")
            return jsonify({"error": "Page not found"}), 404
    # ---------------------------

    # --- Register Tournament/Game Blueprint ---
    # try:
    #     from dojopool.api.tournament import tournament_bp
    #     app.register_blueprint(tournament_bp, url_prefix="/api")
    # except ImportError as e:
    #     print(f"[ERROR] Could not import tournament blueprint: {e}")
    # except Exception as e:
    #     print(f"[ERROR] Could not register tournament blueprint: {e}")

    # Register blueprints
    from dojopool.api.v1 import api_v1_bp
    app.register_blueprint(api_v1_bp, url_prefix="/api/v1")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(performance_bp) # Adjust prefix if needed
    app.register_blueprint(game_bp, url_prefix="/game")
    app.register_blueprint(venue_bp) # Adjust prefix if needed
    app.register_blueprint(feed_bp)
    app.register_blueprint(health_bp)

    # === DEBUG: Print all registered routes ===
    print("[ROUTES]")
    for rule in app.url_map.iter_rules():
        print(rule)

    # Initialize SocketIO
    init_socketio(app)

    @app.context_processor
    def inject_now():
        return {'now': datetime.now()}

    print("GOOGLE_CLIENT_ID:", app.config.get("GOOGLE_CLIENT_ID"))

    # Initialize Firebase Admin with project ID
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(options={
                'projectId': os.getenv('FIREBASE_PROJECT_ID')
            })
            logger.info("Firebase Admin SDK initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {str(e)}")
        # Continue without Firebase Admin - some features may not work
        pass

    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app


if __name__ == "__main__":
    app = create_app()
    # Use socketio.run for development server with WebSocket support
    # Host='0.0.0.0' makes it accessible on the network
    socketio.run(app, host='0.0.0.0', port=8000, debug=app.config.get("DEBUG", True), use_reloader=app.config.get("DEBUG", True))
    # Note: Uvicorn command might not be needed if running directly like this,
    # unless specific ASGI features beyond Flask-SocketIO are required.
    # If using uvicorn, the app instance passed should be 'app', not 'socketio'.
