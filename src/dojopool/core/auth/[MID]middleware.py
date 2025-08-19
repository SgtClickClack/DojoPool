"""Authentication middleware for DojoPool."""

from flask import current_app, jsonify, request

from .exceptions import AuthenticationError, SessionError, TokenError


def auth_middleware(app):
    """Authentication middleware.

    Args:
        app: Flask application instance
    """

    @app.before_request
    def authenticate_request():
        """Authenticate request before processing."""
        # Skip authentication for public endpoints
        if request.endpoint in app.config.get("PUBLIC_ENDPOINTS", []):
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


def session_middleware(app):
    """Session middleware.

    Args:
        app: Flask application instance
    """

    @app.before_request
    def validate_session():
        """Validate session before processing."""
        # Skip session validation for public endpoints
        if request.endpoint in app.config.get("PUBLIC_ENDPOINTS", []):
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


def rate_limit_middleware(app):
    """Rate limiting middleware.

    Args:
        app: Flask application instance
    """

    @app.before_request
    def check_rate_limit():
        """Check rate limit before processing."""
        # Skip rate limiting for whitelisted IPs
        client_ip = request.remote_addr
        if client_ip in app.config.get("RATE_LIMIT_WHITELIST", []):
            return None

        # Get rate limit configuration
        rate_limits = app.config.get(
            "RATE_LIMITS", {"default": {"limit": 100, "period": 60}}  # 100 requests per minute
        )

        # Get endpoint-specific rate limit or default
        endpoint = request.endpoint or "default"
        limit_config = rate_limits.get(endpoint, rate_limits["default"])

        # Check rate limit using Redis
        redis_client = current_app.redis
        if not redis_client:
            return None

        key = f"rate_limit:{client_ip}:{endpoint}"
        current = redis_client.get(key)

        if current is None:
            # First request, set counter
            redis_client.setex(key, limit_config["period"], 1)
        elif int(current) >= limit_config["limit"]:
            # Rate limit exceeded
            return jsonify({"error": "Rate limit exceeded"}), 429
        else:
            # Increment counter
            redis_client.incr(key)


def cors_middleware(app):
    """CORS middleware.

    Args:
        app: Flask application instance
    """

    @app.after_request
    def add_cors_headers(response):
        """Add CORS headers to response."""
        # Allow requests from configured origins
        origin = request.headers.get("Origin")
        if origin in app.config.get("CORS_ORIGINS", []):
            response.headers["Access-Control-Allow-Origin"] = origin

        # Allow configured methods
        response.headers["Access-Control-Allow-Methods"] = ", ".join(
            app.config.get("CORS_METHODS", ["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        )

        # Allow configured headers
        response.headers["Access-Control-Allow-Headers"] = ", ".join(
            app.config.get(
                "CORS_HEADERS", ["Content-Type", "Authorization", "X-Session-ID", "X-TOTP-Token"]
            )
        )

        # Allow credentials
        response.headers["Access-Control-Allow-Credentials"] = "true"

        return response


def error_middleware(app):
    """Error handling middleware.

    Args:
        app: Flask application instance
    """

    @app.errorhandler(AuthenticationError)
    def handle_auth_error(error):
        """Handle authentication errors."""
        return jsonify({"error": "Authentication error", "message": str(error)}), 401

    @app.errorhandler(TokenError)
    def handle_token_error(error):
        """Handle token errors."""
        return jsonify({"error": "Token error", "message": str(error)}), 401

    @app.errorhandler(SessionError)
    def handle_session_error(error):
        """Handle session errors."""
        return jsonify({"error": "Session error", "message": str(error)}), 401


def security_headers_middleware(app):
    """Security headers middleware.

    Args:
        app: Flask application instance
    """

    @app.after_request
    def add_security_headers(response):
        """Add security headers to response."""
        # Content Security Policy
        response.headers["Content-Security-Policy"] = app.config.get(
            "CONTENT_SECURITY_POLICY",
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
        )

        # HTTP Strict Transport Security
        if not app.debug:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # X-Content-Type-Options
        response.headers["X-Content-Type-Options"] = "nosniff"

        # X-Frame-Options
        response.headers["X-Frame-Options"] = "SAMEORIGIN"

        # X-XSS-Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        return response


def init_middleware(app):
    """Initialize all middleware.

    Args:
        app: Flask application instance
    """
    auth_middleware(app)
    session_middleware(app)
    rate_limit_middleware(app)
    cors_middleware(app)
    security_headers_middleware(app)
    error_middleware(app)
