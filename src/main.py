import eventlet

eventlet.monkey_patch()

from flask import Flask, request, redirect
from flask_login import LoginManager
from extensions import db, socketio
from models import User
from blueprints.google_auth import google_auth
from blueprints.auth import auth
from blueprints.umpire import umpire
from routes import routes_bp
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ReverseProxied(object):
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        scheme = environ.get("HTTP_X_FORWARDED_PROTO")
        if scheme:
            environ["wsgi.url_scheme"] = scheme
        return self.app(environ, start_response)


def create_app():
    app = Flask(__name__)

    # Configure Flask app
    app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Security configurations
    app.config.update(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        PREFERRED_URL_SCHEME="https",
        REMEMBER_COOKIE_SECURE=True,
        REMEMBER_COOKIE_HTTPONLY=True,
        REMEMBER_COOKIE_SAMESITE="Lax",
    )

    # Handle reverse proxy
    app.wsgi_app = ReverseProxied(app.wsgi_app)

    # Initialize extensions
    db.init_app(app)
    socketio.init_app(
        app,
        async_mode="eventlet",
        cors_allowed_origins="*",
        logger=True,
        engineio_logger=True,
        ping_timeout=60,
    )

    # Initialize Login Manager
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"
    login_manager.session_protection = "strong"

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints with correct URL prefixes
    app.register_blueprint(auth, url_prefix="/auth")
    app.register_blueprint(google_auth, url_prefix="/google_auth")
    app.register_blueprint(umpire)
    app.register_blueprint(routes_bp)

    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")

    # Redirect HTTP to HTTPS
    @app.before_request
    def before_request():
        if not request.is_secure and app.env != "development":
            url = request.url.replace("http://", "https://", 1)
            return redirect(url, code=301)

    logger.info("Application initialized successfully")
    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=True, use_reloader=False)
