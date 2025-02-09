"""Application factory module."""

import os
from typing import Optional

from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from redis import Redis

from config.security_config import SecurityConfig
from middleware.security import SecurityMiddleware
from middleware.input_validation import InputValidationMiddleware
from services.token_service import TokenService

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
limiter = Limiter(key_func=get_remote_address)


def create_app(config_name: Optional[str] = None) -> Flask:
    """Create Flask application.
    
    Args:
        config_name: Name of configuration to use
        
    Returns:
        Flask: Configured Flask application
    """
    app = Flask(__name__)
    
    # Load configuration
    config_module = f"config.{config_name}_config" if config_name else "config.default_config"
    app.config.from_object(config_module)
    
    # Load instance config if it exists
    instance_config = os.path.join(app.instance_path, "config.py")
    if os.path.exists(instance_config):
        app.config.from_pyfile(instance_config)
    
    # Initialize security configuration
    security_config = SecurityConfig(**app.config.get("SECURITY_CONFIG", {}))
    if not security_config.validate_configuration():
        raise ValueError("Invalid security configuration")
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    limiter.init_app(app)
    
    # Configure CORS
    CORS(
        app,
        resources={
            r"/*": {
                "origins": app.config.get("CORS_ORIGINS", []),
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": [
                    "Content-Type",
                    "Authorization",
                    "X-CSRF-Token",
                ],
                "expose_headers": [
                    "Content-Type",
                    "X-CSRF-Token",
                ],
                "supports_credentials": True,
            }
        },
    )
    
    # Initialize Redis
    app.redis = Redis.from_url(app.config["REDIS_URL"])
    
    # Initialize security middleware
    security_middleware = SecurityMiddleware(app, security_config)
    
    # Initialize input validation middleware
    input_validation_middleware = InputValidationMiddleware(app)
    
    # Initialize token service
    app.token_service = TokenService()
    
    # Register blueprints
    from routes import (
        admin_bp,
        auth_bp,
        game_bp,
        social_bp,
        tournament_bp,
        user_bp,
        venue_bp,
    )
    
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(game_bp, url_prefix="/games")
    app.register_blueprint(social_bp, url_prefix="/social")
    app.register_blueprint(tournament_bp, url_prefix="/tournaments")
    app.register_blueprint(user_bp, url_prefix="/users")
    app.register_blueprint(venue_bp, url_prefix="/venues")
    
    # Configure public endpoints
    app.config["PUBLIC_ENDPOINTS"] = {
        "auth.login",
        "auth.register",
        "auth.reset_password_request",
        "auth.reset_password",
        "auth.verify_email",
    }
    
    # Configure cacheable endpoints
    app.config["CACHEABLE_ENDPOINTS"] = {
        "venue.list",
        "tournament.list_public",
        "game.leaderboard",
    }
    
    # Configure login manager
    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"
    
    @login_manager.user_loader
    def load_user(user_id):
        """Load user by ID."""
        from models.user import User
        return User.query.get(int(user_id))
    
    # Register error handlers
    register_error_handlers(app)
    
    return app


def register_error_handlers(app: Flask) -> None:
    """Register error handlers for the application.
    
    Args:
        app: Flask application instance
    """
    
    @app.errorhandler(400)
    def bad_request(e):
        return {"error": "Bad request", "message": str(e)}, 400
    
    @app.errorhandler(401)
    def unauthorized(e):
        return {"error": "Unauthorized", "message": str(e)}, 401
    
    @app.errorhandler(403)
    def forbidden(e):
        return {"error": "Forbidden", "message": str(e)}, 403
    
    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Not found", "message": str(e)}, 404
    
    @app.errorhandler(429)
    def too_many_requests(e):
        return {"error": "Too many requests", "message": str(e)}, 429
    
    @app.errorhandler(500)
    def internal_server_error(e):
        return {"error": "Internal server error", "message": str(e)}, 500 