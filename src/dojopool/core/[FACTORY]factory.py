"""Application factory module.

This module provides the application factory function.
"""

import os

from flask import Flask

from src.core.cli import init_app as init_cli
from src.core.config import config
from src.core.database import db
from src.core.database.migrations import init_migrations


def create_app(config_name=None):
    """Create Flask application.

    Args:
        config_name: Configuration name (default: from environment)

    Returns:
        Flask application instance
    """
    # Create Flask app
    app = Flask(__name__)

    # Load configuration
    config_name = config_name or os.getenv("FLASK_CONFIG", "default")
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)

    # Initialize migrations
    with app.app_context():
        init_migrations(app)

    # Initialize CLI
    init_cli(app)

    # Register blueprints
    from src.core.auth import bp as auth_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")

    from src.core.api import bp as api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    from src.core.admin import bp as admin_bp

    app.register_blueprint(admin_bp, url_prefix="/admin")

    # Create database tables
    with app.app_context():
        db.create_all()

    return app
