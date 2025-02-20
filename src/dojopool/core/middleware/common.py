"""Common middleware for DojoPool."""

import time
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union

from flask import current_app, g, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Request
from werkzeug.wrappers import Response
from werkzeug.wrappers import Response as WerkzeugResponse

from ..logging import logger


class BaseMiddleware:
    """Base middleware class."""

    def __init__(self) -> None:
        """Initialize middleware."""
        self.get_response: Optional[Callable] = None

    def __call__(self, request: Request):
        """Process request and response."""
        try:
            response = self.get_response(request)
            return self.process_response(request, response)
        except Exception as e:
            original_path = getattr(g, "original_path", request.path)
            logger.error(
                f"Uncaught error in middleware chain: {e}",
                extra={"original_path": original_path},
            )
            return current_app.make_response(({"error": "Internal server error"}, 500))

    def process_request(self, request: Request):
        """Process request before view."""
        pass

    def process_response(self, request: Request, response: Response):
        """Process response after view."""
        return response


def request_logger(f: Callable) -> Callable:
    """Log request details."""

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any):
        logger.info(
            f"Request: {request.method} {request.url} from {request.remote_addr}"
        )
        return f(*args, **kwargs)

    return decorated


def response_logger(f: Callable):
    """Log response details."""

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any):
        response = f(*args, **kwargs)
        logger.info(
            f"Response: {response.status_code} for {request.method} {request.url}"
        )
        return response

    return decorated


class RequestIdMiddleware(BaseMiddleware):
    """Add unique request ID to each request."""

    def process_request(self, request: Request) -> None:
        """Add request ID to request context."""
        import uuid

        setattr(g, "request_id", str(uuid.uuid4()))
        return None

    def process_response(self, request: Request, response: Response):
        """Add request ID to response headers."""
        response.headers["X-Request-ID"] = getattr(g, "request_id", "unknown")
        return response


class RequestTimingMiddleware(BaseMiddleware):
    """Track request timing information."""

    def process_request(self, request: Request) -> None:
        """Store request start time."""
        setattr(g, "start_time", time.time())
        return None

    def process_response(self, request: Request, response: Response):
        """Add timing information to response headers."""
        if hasattr(g, "start_time"):
            duration: Any = time.time() - getattr(g, "start_time", 0)
            response.headers["X-Request-Time"] = f"{duration:.3f}s"
        return response


class SecurityHeadersMiddleware(BaseMiddleware):
    """Add security headers to responses."""

    def __init__(self, headers: Optional[Dict[str, str]] = None) -> None:
        """Initialize security headers.

        Args:
            headers: Optional custom security headers
        """
        super().__init__()
        self.headers = {
            "X-Frame-Options": "SAMEORIGIN",
            "X-XSS-Protection": "1; mode=block",
            "X-Content-Type-Options": "nosniff",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        }
        if headers:
            self.headers.update(headers)

    def process_response(self, request: Request, response: Response) -> Response:
        """Add security headers to response."""
        for header, value in self.headers.items():
            response.headers[header] = value
        return response


class CORSMiddleware(BaseMiddleware):
    """Handle CORS (Cross-Origin Resource Sharing)."""

    def __init__(
        self,
        allowed_origins: List[str],
        allowed_methods: Optional[List[str]] = None,
        allowed_headers: Optional[List[str]] = None,
        expose_headers: Optional[List[str]] = None,
        max_age: int = 600,
    ) -> None:
        """Initialize CORS settings.

        Args:
            allowed_origins: List of allowed origins
            allowed_methods: List of allowed HTTP methods
            allowed_headers: List of allowed headers
            expose_headers: List of exposed headers
            max_age: Max age for preflight requests
        """
        super().__init__()
        self.allowed_origins = allowed_origins
        self.allowed_methods = allowed_methods or [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
        ]
        self.allowed_headers = allowed_headers or ["Content-Type", "Authorization"]
        self.expose_headers = expose_headers or ["X-Request-ID"]
        self.max_age = max_age

    def process_response(self, request: Request, response: Response) -> Response:
        """Add CORS headers to response."""
        origin: Any = request.headers.get("Origin")

        if origin and origin in self.allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = ", ".join(
                self.allowed_methods
            )
            response.headers["Access-Control-Allow-Headers"] = ", ".join(
                self.allowed_headers
            )
            response.headers["Access-Control-Expose-Headers"] = ", ".join(
                self.expose_headers
            )
            response.headers["Access-Control-Max-Age"] = str(self.max_age)

            if request.method == "OPTIONS":
                return response

        return response


class RequestLoggingMiddleware(BaseMiddleware):
    """Log request and response information."""

    def process_request(self, request: Request) -> None:
        """Log request information."""
        setattr(g, "original_path", request.path)
        logger.info(
            "Request started",
            extra={
                "method": request.method,
                "path": request.path,
                "remote_addr": request.remote_addr,
            },
        )

    def process_response(self, request: Request, response: Response):
        """Log response information."""
        logger.info(
            "Request finished",
            extra={
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
            },
        )
        return response
