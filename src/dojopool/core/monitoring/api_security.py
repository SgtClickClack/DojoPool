"""
API security middleware for Flask application.
Handles API-specific security measures like HTTPS enforcement, API key validation,
token validation, and rate limiting.
"""

import hashlib
import time
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, Optional

import jwt
from flask import current_app, make_response, request

from . import security_config as config
from .security_monitor import SecurityEventType, SecuritySeverity, security_monitor


class APISecurityError(Exception):
    """Custom exception for API security errors."""

    def __init__(self, message: str, status_code: int = 403):
        super().__init__(message)
        self.status_code = status_code


class APIRateLimiter:
    """Rate limiter for API endpoints."""

    def __init__(self):
        self.ip_limits: Dict[str, list] = {}
        self.user_limits: Dict[str, list] = {}
        self.api_key_limits: Dict[str, list] = {}

    def _clean_old_requests(self, requests: list, window: int = 60) -> list:
        """Remove requests older than the window."""
        current_time = time.time()
        return [t for t in requests if current_time - t < window]

    def check_rate_limit(
        self, ip: Optional[str] = None, user_id: Optional[str] = None, api_key: Optional[str] = None
    ) -> bool:
        """Check if request should be rate limited."""
        current_time = time.time()

        # Check IP-based rate limit
        if ip and config.API_SECURITY["rate_limit_by_ip"]:
            self.ip_limits[ip] = self._clean_old_requests(self.ip_limits.get(ip, []))
            self.ip_limits[ip].append(current_time)
            if len(self.ip_limits[ip]) > config.RATE_LIMIT_CONFIG["api"]["requests_per_minute"]:
                return True

        # Check user-based rate limit
        if user_id and config.API_SECURITY["rate_limit_by_user"]:
            self.user_limits[user_id] = self._clean_old_requests(self.user_limits.get(user_id, []))
            self.user_limits[user_id].append(current_time)
            if (
                len(self.user_limits[user_id])
                > config.RATE_LIMIT_CONFIG["api"]["requests_per_minute"]
            ):
                return True

        # Check API key-based rate limit
        if api_key and config.API_SECURITY["rate_limit_by_api_key"]:
            self.api_key_limits[api_key] = self._clean_old_requests(
                self.api_key_limits.get(api_key, [])
            )
            self.api_key_limits[api_key].append(current_time)
            if (
                len(self.api_key_limits[api_key])
                > config.RATE_LIMIT_CONFIG["api"]["requests_per_minute"]
            ):
                return True

        return False


# Global rate limiter instance
rate_limiter = APIRateLimiter()


def require_https():
    """Decorator to enforce HTTPS."""

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            if config.API_SECURITY["require_https"] and not request.is_secure:
                raise APISecurityError("HTTPS is required for this endpoint", 403)
            return f(*args, **kwargs)

        return wrapped

    return decorator


def require_api_key():
    """Decorator to require valid API key."""

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            api_key = request.headers.get(config.API_SECURITY["api_key_header"])
            if not api_key:
                raise APISecurityError("API key is required", 401)

            # Validate API key (implement your validation logic here)
            if not _validate_api_key(api_key):
                raise APISecurityError("Invalid API key", 401)

            # Check rate limit
            if rate_limiter.check_rate_limit(api_key=api_key):
                raise APISecurityError("API rate limit exceeded", 429)

            return f(*args, **kwargs)

        return wrapped

    return decorator


def require_auth_token():
    """Decorator to require valid authentication token."""

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            auth_header = request.headers.get(config.API_SECURITY["token_header"])
            if not auth_header:
                raise APISecurityError("Authentication token is required", 401)

            # Extract token
            try:
                token_prefix = config.API_SECURITY["token_prefix"]
                if not auth_header.startswith(f"{token_prefix} "):
                    raise APISecurityError("Invalid token format", 401)

                token = auth_header[len(token_prefix) + 1 :]
            except Exception:
                raise APISecurityError("Invalid token format", 401)

            try:
                # Validate token
                payload = jwt.decode(
                    token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
                )

                # Check token expiration
                exp = datetime.fromtimestamp(payload["exp"])
                if exp < datetime.utcnow():
                    raise APISecurityError("Token has expired", 401)

                # Add user info to request
                request.user_id = payload.get("sub")
                request.user_roles = payload.get("roles", [])

                # Check rate limit
                if rate_limiter.check_rate_limit(user_id=request.user_id):
                    raise APISecurityError("API rate limit exceeded", 429)

            except jwt.InvalidTokenError:
                raise APISecurityError("Invalid token", 401)

            return f(*args, **kwargs)

        return wrapped

    return decorator


def api_security_middleware() -> Callable:
    """Middleware for API security."""

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            try:
                # Enforce HTTPS if required
                if config.API_SECURITY["require_https"] and not request.is_secure:
                    raise APISecurityError("HTTPS is required", 403)

                # Check IP-based rate limit
                if rate_limiter.check_rate_limit(ip=request.remote_addr):
                    raise APISecurityError("API rate limit exceeded", 429)

                # Execute request
                response = f(*args, **kwargs)

                return response

            except APISecurityError as e:
                # Log security event
                security_monitor.monitor_request(
                    SecurityEventType.UNAUTHORIZED_ACCESS,
                    SecuritySeverity.HIGH,
                    request.remote_addr,
                    {
                        "error": str(e),
                        "status_code": e.status_code,
                        "path": request.path,
                        "method": request.method,
                    },
                )

                return make_response({"error": str(e)}, e.status_code)

            except Exception as e:
                # Log unexpected errors
                security_monitor.monitor_request(
                    SecurityEventType.ABNORMAL_BEHAVIOR,
                    SecuritySeverity.HIGH,
                    request.remote_addr,
                    {"error": str(e), "path": request.path, "method": request.method},
                )

                raise

        return wrapped

    return decorator


def _validate_api_key(api_key: str) -> bool:
    """Validate API key."""
    # Implement your API key validation logic here
    # This is a placeholder implementation
    try:
        # Hash the API key
        hashlib.sha256(api_key.encode()).hexdigest()

        # Compare with stored keys
        # In a real implementation, you would check against a database of valid keys
        return True

    except Exception:
        return False


def init_api_security(app):
    """Initialize API security for the Flask application."""

    @app.before_request
    def api_security_check():
        """Check API security requirements."""
        try:
            # Skip security checks for non-API routes
            if not request.path.startswith("/api"):
                return

            # Enforce HTTPS if required
            if config.API_SECURITY["require_https"] and not request.is_secure:
                raise APISecurityError("HTTPS is required", 403)

            # Check IP-based rate limit
            if rate_limiter.check_rate_limit(ip=request.remote_addr):
                raise APISecurityError("API rate limit exceeded", 429)

        except APISecurityError as e:
            # Log security event
            security_monitor.monitor_request(
                SecurityEventType.UNAUTHORIZED_ACCESS,
                SecuritySeverity.HIGH,
                request.remote_addr,
                {
                    "error": str(e),
                    "status_code": e.status_code,
                    "path": request.path,
                    "method": request.method,
                },
            )

            return make_response({"error": str(e)}, e.status_code)
