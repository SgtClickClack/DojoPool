"""Main application module."""

import os
from pathlib import Path
from typing import Any, Dict, Optional

from flask import Flask
from flask_cors import CORS

from .core.extensions import db, login_manager, migrate
from .core.security.headers import apply_security_headers
from .core.security.rate_limiter import rate_limiter
from .core.security.audit import security_logger
from .models.user import User

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID."""
    return User.query.get(int(user_id))

def create_app(config: Optional[Dict[str, Any]] = None) -> Flask:
    """Create and configure the Flask application.

    Args:
        config: Optional configuration dictionary to override defaults

    Returns:
        Configured Flask application instance
    """
    # Create Flask app with explicit template and static folders
    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), "templates"),
        static_folder=os.path.join(os.path.dirname(__file__), "static"),
    )

    # Ensure data directory exists
    data_dir = Path(os.path.dirname(__file__)) / "data"
    data_dir.mkdir(exist_ok=True)

    # Default configuration
    app.config.update(
        {
            "SECRET_KEY": os.getenv("SECRET_KEY", "dev-key-please-change"),
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{data_dir}/dojopool.db",
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "TEMPLATES_AUTO_RELOAD": True,
            "DEBUG": os.getenv("FLASK_ENV", "development") == "development",
            # Security settings
            "SESSION_COOKIE_SECURE": True,
            "SESSION_COOKIE_HTTPONLY": True,
            "SESSION_COOKIE_SAMESITE": "Lax",
            "PERMANENT_SESSION_LIFETIME": 3600,  # 1 hour
            "REMEMBER_COOKIE_SECURE": True,
            "REMEMBER_COOKIE_HTTPONLY": True,
            "REMEMBER_COOKIE_DURATION": 2592000,  # 30 days
        }
    )

    # Override config if provided
    if config:
        app.config.update(config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    CORS(app)

    # Configure login manager
    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"
    login_manager.session_protection = "strong"

    # Apply security headers
    @app.after_request
    def add_security_headers(response):
        return apply_security_headers(response)

    # Log all requests
    @app.before_request
    def log_request():
        security_logger.log_event("http_request")

    with app.app_context():
        # Import routes here to avoid circular imports
        from .routes import register_routes

        register_routes(app)

        # Create database tables
        db.create_all()

    return app


# Create the application instance
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
