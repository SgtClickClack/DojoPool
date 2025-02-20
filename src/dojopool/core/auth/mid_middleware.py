"""Authentication middleware for DojoPool."""

from typing import Any, Dict, List, Optional, Tuple, Union

from flask import Request, Response, current_app, g, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from .exceptions import AuthenticationError, SessionError, TokenError


def auth_middleware(app: Any) -> None:
    """Authentication middleware.

    Args:
        app: Flask application instance
    """

    @app.before_request
    def authenticate_request():
        """Authenticate request before processing."""
        # Skip authentication for public endpoints
        if request.endpoint in current_app.config.get("PUBLIC_ENDPOINTS", []):
            return None

        # Skip authentication for OPTIONS requests (CORS)
        if request.method == "OPTIONS":
            return None

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "No authorization header"}), 401

        try:
            token = auth_header.split()[1]
        except IndexError:
            return jsonify({"error": "Invalid authorization header"}), 401

        # Validate token
        auth_service = current_app.auth_service
        user_id = auth_service.validate_access(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Store user_id in request context
        request.user_id = user_id
        return None


def session_middleware(app: Any):
    """Session middleware.

    Args:
        app: Flask application instance
    """

    @app.before_request
    def validate_session():
        """Validate session before processing."""
        # Skip session validation for public endpoints
        if request.endpoint in current_app.config.get("PUBLIC_ENDPOINTS", []):
            return None

        # Skip session validation for OPTIONS requests (CORS)
        if request.method == "OPTIONS":
            return None

        session_id = request.headers.get("X-Session-ID")
        if not session_id:
            return jsonify({"error": "No session ID"}), 401

        # Validate session
        auth_service = current_app.auth_service
        session = auth_service.session_manager.get_session(session_id)
        if not session:
            return jsonify({"error": "Invalid or expired session"}), 401

        # Store session in request context
        request.session = session
        return None


def rate_limit_middleware(app: Any) -> None:
    """Rate limiting middleware.

    Args:
        app: Flask application instance
    """

    @app.before_request
    def check_rate_limit():
        """Check rate limit before processing."""
        # Skip rate limiting for whitelisted IPs
        client_ip = request.remote_addr
        if client_ip in current_app.config.get("RATE_LIMIT_WHITELIST", []):
            return None

        # Get rate limit configuration
        rate_limits = current_app.config.get(
            "RATE_LIMITS",
            {"default": {"limit": 100, "period": 60}},  # 100 requests per minute
        )

        # Get rate limit for endpoint
        endpoint = request.endpoint or "default"
        limit_config = rate_limits.get(endpoint, rate_limits["default"])

        # Check rate limit
        rate_limiter = current_app.rate_limiter
        if not rate_limiter.check_rate_limit(client_ip, limit_config):
            return jsonify({"error": "Rate limit exceeded"}), 429

        return None


def cors_middleware(app: Any):
    """CORS middleware.

    Args:
        app: Flask application instance
    """

    @app.after_request
    def add_cors_headers(response: Response):
        """Add CORS headers to response."""
        # Get CORS configuration
        cors_config = current_app.config.get("CORS_CONFIG", {})

        # Add CORS headers
        response.headers["Access-Control-Allow-Origin"] = cors_config.get(
            "ALLOW_ORIGIN", "*"
        )
        response.headers["Access-Control-Allow-Methods"] = cors_config.get(
            "ALLOW_METHODS", "GET, POST, PUT, DELETE, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = cors_config.get(
            "ALLOW_HEADERS",
            "Content-Type, Authorization, X-Session-ID",
        )
        response.headers["Access-Control-Max-Age"] = cors_config.get("MAX_AGE", "3600")

        return response


def error_middleware(app: Any) -> None:
    """Error handling middleware.

    Args:
        app: Flask application instance
    """

    @app.errorhandler(AuthenticationError)
    def handle_auth_error(error: AuthenticationError):
        """Handle authentication errors."""
        return jsonify({"error": str(error)}), 401

    @app.errorhandler(TokenError)
    def handle_token_error(error: TokenError):
        """Handle token errors."""
        return jsonify({"error": str(error)}), 401

    @app.errorhandler(SessionError)
    def handle_session_error(error: SessionError):
        """Handle session errors."""
        return jsonify({"error": str(error)}), 401


def security_headers_middleware(app: Any) -> None:
    """Security headers middleware.

    Args:
        app: Flask application instance
    """

    @app.after_request
    def add_security_headers(response: Response):
        """Add security headers to response."""
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'"
        )

        return response


def init_middleware(app: Any) -> None:
    """Initialize all middleware.

    Args:
        app: Flask application instance
    """
    auth_middleware(app)
    session_middleware(app)
    rate_limit_middleware(app)
    cors_middleware(app)
    error_middleware(app)
    security_headers_middleware(app)
