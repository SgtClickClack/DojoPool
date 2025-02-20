"""Application factory module."""

import os
from typing import Any, Dict, List, Optional

from flask import Flask, jsonify
from werkzeug.wrappers import Response

from dojopool.core.config import SecurityConfig
from dojopool.core.extensions import cache, db, mail
from dojopool.core.middleware import (
    RateLimitMiddleware,
    RequestLogging,
    SecurityMiddleware,
)


def configure_rate_limits(app: Flask) -> None:
    """Configure rate limiting for the application.

    Args:
        app: Flask application instance
    """
    rate_limiter = RateLimitMiddleware()
    rate_limiter.init_app(app)

    # Add public endpoints that don't require rate limiting
    for endpoint in app.config.get("PUBLIC_ENDPOINTS", []):
        rate_limiter.exempt(endpoint)


def create_app(config: Optional[Dict[str, Any]] = None):
    """Create and configure a Flask application instance.

    Args:
        config: Optional configuration dictionary

    Returns:
        Configured Flask application
    """
    app = Flask(__name__)

    # Load default configuration
    app.config.from_object("dojopool.config.default")

    # Load environment specific configuration
    if "DOJOPOOL_CONFIG" in os.environ:
        app.config.from_envvar("DOJOPOOL_CONFIG")

    # Update config with provided values
    if config:
        app.config.update(config)

    # Ensure required config values are set
    required_configs = [
        ("SECRET_KEY", "Secret key is required for secure operation"),
        ("DATABASE_URL", "Database URL is required"),
        ("REDIS_URL", "Redis URL is required for caching"),
        ("MAIL_SERVER", "Mail server configuration is required"),
    ]

    for config_key, message in required_configs:
        if not app.config.get(config_key):
            raise RuntimeError(message)

    # Initialize extensions
    db.init_app(app)
    cache.init_app(app)
    mail.init_app(app)

    # Initialize middleware
    SecurityMiddleware().init_app(app)
    configure_rate_limits(app)
    RequestLogging().init_app(app)

    # Register blueprints
    from dojopool.core.api import api_bp
    from dojopool.core.auth import auth_bp
    from dojopool.core.routes import core_bp

    app.register_blueprint(core_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp, url_prefix="/api")

    # Register error handlers
    register_error_handlers(app)

    return app


def register_error_handlers(app: Flask):
    """Register error handlers for the application.

    Args:
        app: Flask application instance
    """

    @app.errorhandler(400)
    def bad_request(e: Any):
        """Handle bad request errors."""
        return jsonify({"error": "Bad request", "message": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e: Any) -> Response:
        """Handle unauthorized errors."""
        return jsonify({"error": "Unauthorized", "message": str(e)}), 401

    @app.errorhandler(403)
    def forbidden(e: Any):
        """Handle forbidden errors."""
        return jsonify({"error": "Forbidden", "message": str(e)}), 403

    @app.errorhandler(404)
    def not_found(e: Any):
        """Handle not found errors."""
        return jsonify({"error": "Not found", "message": str(e)}), 404

    @app.errorhandler(429)
    def too_many_requests(e: Any):
        """Handle rate limit exceeded errors."""
        return jsonify({"error": "Too many requests", "message": str(e)}), 429
