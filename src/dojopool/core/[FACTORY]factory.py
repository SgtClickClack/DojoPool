"""Application factory module.

This module provides the application factory function.
"""

import os
from typing import Optional

from flask import Flask

from dojopool.core.admin import bp as admin_bp
from dojopool.core.api import bp as api_bp
from dojopool.core.auth import bp as auth_bp
from dojopool.core.cli import init_app as init_cli
from dojopool.core.config import config
from dojopool.core.database import db
from dojopool.core.database.migrations import init_migrations


def create_app(config_name: Optional[str] = None) -> Flask:
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
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/admin")

    # Create database tables
    with app.app_context():
        db.create_all()

    return app
