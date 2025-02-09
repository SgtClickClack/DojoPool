"""Application factory with enhanced security configuration."""

import os
from pathlib import Path
from typing import Optional

import redis
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_talisman import Talisman

from config.security_config import SecurityConfig
from middleware.security import SecurityMiddleware
from middleware.input_validation import InputValidationMiddleware
from middleware.session import SessionSecurityMiddleware
from middleware.rate_limit import RateLimitMiddleware
from services.token_service import TokenService
from core.errors import setup_error_handlers
from utils.file_permissions import (
    PRIVATE_FILE_MODE,
    SECURE_DIR_MODE,
    create_secure_directory,
    create_secure_file,
    secure_directory_tree
)

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

# Configure rate limiting with Redis storage
def get_redis_storage_url():
    """Get Redis URL for rate limiting storage."""
    return os.getenv('REDIS_URL', 'redis://localhost:6379/0')

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=get_redis_storage_url(),
    strategy="fixed-window-elastic-expiry",
    default_limits=["200 per day", "50 per hour"]
)

# Define rate limits for different endpoint types
RATE_LIMITS = {
    "STRICT": "5 per minute",
    "NORMAL": "30 per minute",
    "LENIENT": "100 per minute"
}

def configure_rate_limits(app: Flask) -> None:
    """Configure rate limits for specific endpoints."""
    
    # Authentication endpoints (strict limits)
    limiter.limit(RATE_LIMITS["STRICT"])(app.view_functions.get("auth.login"))
    limiter.limit(RATE_LIMITS["STRICT"])(app.view_functions.get("auth.register"))
    limiter.limit(RATE_LIMITS["STRICT"])(app.view_functions.get("auth.reset_password"))
    
    # API endpoints (normal limits)
    for endpoint in ["game.create", "tournament.create", "venue.create"]:
        if endpoint in app.view_functions:
            limiter.limit(RATE_LIMITS["NORMAL"])(app.view_functions[endpoint])
    
    # Public endpoints (lenient limits)
    for endpoint in app.config.get("PUBLIC_ENDPOINTS", []):
        if endpoint in app.view_functions:
            limiter.limit(RATE_LIMITS["LENIENT"])(app.view_functions[endpoint])

def create_app(config: Optional[dict] = None) -> Flask:
    """Create and configure the Flask application.
    
    Args:
        config: Optional configuration dictionary
        
    Returns:
        Configured Flask application
    """
    app = Flask(__name__)
    
    # Secure instance directory
    instance_path = Path(app.instance_path)
    create_secure_directory(instance_path, mode=SECURE_DIR_MODE)
    
    # Secure sensitive directories
    sensitive_dirs = [
        instance_path / 'keys',
        instance_path / 'logs',
        instance_path / 'uploads'
    ]
    for directory in sensitive_dirs:
        create_secure_directory(directory, mode=SECURE_DIR_MODE)
    
    # Secure sensitive files
    if not app.config.get('SECRET_KEY'):
        secret_key_file = instance_path / 'secret_key'
        if not secret_key_file.exists():
            create_secure_file(secret_key_file, mode=PRIVATE_FILE_MODE)
            with open(secret_key_file, 'wb') as f:
                f.write(os.urandom(32))
        app.config['SECRET_KEY'] = secret_key_file.read_bytes()
    
    # Load configuration
    app.config.from_object('dojopool.config.default')
    if 'DOJOPOOL_CONFIG' in os.environ:
        app.config.from_envvar('DOJOPOOL_CONFIG')
    if config:
        app.config.update(config)
        
    # Ensure required configs are set
    required_configs = [
        'SECRET_KEY',
        'REDIS_URL',
        'SESSION_COOKIE_SECURE',
        'SESSION_COOKIE_HTTPONLY',
        'SESSION_COOKIE_SAMESITE',
    ]
    for config_key in required_configs:
        if not app.config.get(config_key):
            raise ValueError(f"Missing required config: {config_key}")
            
    # Initialize Redis
    redis_client = redis.from_url(app.config['REDIS_URL'])
    
    # Initialize security middleware
    session_middleware = SessionSecurityMiddleware(app, redis_client)
    input_validation = InputValidationMiddleware(app)
    rate_limit = RateLimitMiddleware(app, redis_client)
    
    # Configure rate limit excluded endpoints
    app.config['RATE_LIMIT_EXCLUDED_ENDPOINTS'] = {
        'static',
        'metrics',
        'health_check'
    }
    
    # Initialize Talisman for security headers
    Talisman(
        app,
        force_https=True,
        strict_transport_security=True,
        session_cookie_secure=True,
        content_security_policy={
            'default-src': "'self'",
            'img-src': ["'self'", 'data:', 'https:'],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'connect-src': ["'self'", 'https:'],
            'frame-ancestors': "'none'",
            'form-action': "'self'",
            'base-uri': "'self'",
            'object-src': "'none'"
        },
        content_security_policy_nonce_in=['script-src'],
        feature_policy={
            'geolocation': "'none'",
            'camera': "'none'",
            'microphone': "'none'",
            'payment': "'none'",
            'usb': "'none'"
        }
    )
    
    # Register error handlers
    setup_error_handlers(app)
    
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
    
    @app.before_request
    def before_request():
        """Global before request handler."""
        # Add additional security checks here
        pass
        
    @app.after_request
    def after_request(response):
        """Global after request handler."""
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response
        
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