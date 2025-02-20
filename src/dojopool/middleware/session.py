"""Session security middleware with enhanced protections."""

import functools
import time
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

import redis
from flask import Flask, Request, Response, current_app, g, request, session
from flask.typing import ResponseReturnValue
from werkzeug.local import LocalProxy
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.errors import AuthenticationError, SecurityError
from dojopool.services.token_service import TokenService


class SessionSecurityMiddleware:
    """Middleware for enhancing session security."""

    def __init__(self, app: Flask, redis_client: redis.Redis):
        """Initialize session security middleware.

        Args:
            app: Flask application instance
            redis_client: Redis client for session storage
        """
        self.app = app
        self.redis = redis_client
        self.token_service = TokenService()

        # Configure secure session settings
        app.config.setdefault("SESSION_COOKIE_SECURE", True)
        app.config.setdefault("SESSION_COOKIE_HTTPONLY", True)
        app.config.setdefault("SESSION_COOKIE_SAMESITE", "Lax")
        app.config.setdefault("PERMANENT_SESSION_LIFETIME", timedelta(hours=1))
        app.config.setdefault("SESSION_PROTECTION", "strong")
        app.config.setdefault("MAX_SESSIONS_PER_USER", 5)

        # Register before_request handlers
        app.before_request(self._validate_session)
        app.before_request(self._check_session_expiry)
        app.before_request(self._validate_fingerprint)

        # Register after_request handlers
        app.after_request(self._refresh_session)

    def _validate_session(self):
        """Validate the current session."""
        if not session.get("user_id"):
            return

        session_id: Any = session.get("session_id")
        if not session_id:
            raise SecurityError("Invalid session")

        stored_session = self.redis.get(f"session:{session_id}")
        if not stored_session:
            raise SecurityError("Session not found")

    def _check_session_expiry(self) -> None:
        """Check if the current session has expired."""
        if not session.get("user_id"):
            return

        expiry: Any = session.get("expiry")
        if not expiry or datetime.fromtimestamp(expiry) < datetime.utcnow():
            raise SecurityError("Session expired")

    def _validate_fingerprint(self):
        """Validate the client fingerprint."""
        if not session.get("user_id"):
            return

        fingerprint: Any = request.headers.get("X-Client-Fingerprint")
        stored_fingerprint: Any = session.get("fingerprint")

        if not fingerprint or not stored_fingerprint:
            raise SecurityError("Missing client fingerprint")

        if fingerprint != stored_fingerprint:
            raise SecurityError("Invalid client fingerprint")

    def _refresh_session(self, response: Response) -> Response:
        """Refresh the session and update expiry."""
        if not session.get("user_id"):
            return response

        session["expiry"] = int(
            (
                datetime.utcnow()
                + current_app.config.get(
                    "PERMANENT_SESSION_LIFETIME", timedelta(hours=1)
                )
            ).timestamp()
        )
        return response

    def session_required(self, f: Callable):
        """Decorator to enforce session validation on routes."""

        @functools.wraps(f)
        def decorated(*args: Any, **kwargs: Any):
            if not session.get("user_id"):
                raise AuthenticationError("Authentication required")
            return f(*args, **kwargs)

        return decorated

    def enforce_max_sessions(self, user_id: Union[str, int]):
        """Enforce maximum number of active sessions per user.

        Args:
            user_id: User identifier
        """
        max_sessions: Any = current_app.config.get("MAX_SESSIONS_PER_USER", 5)
        user_sessions = self.redis.smembers(f"user_sessions:{user_id}")

        if len(user_sessions) >= max_sessions:
            oldest_session = min(
                user_sessions,
                key=lambda s: float(self.redis.hget(f"session:{s}", "created_at") or 0),
            )
            self.redis.delete(f"session:{oldest_session}")
            self.redis.srem(f"user_sessions:{user_id}", oldest_session)

    def create_session(
        self, user_id: Union[str, int], fingerprint: str
    ) -> Dict[str, Any]:
        """Create a new session for a user.

        Args:
            user_id: User identifier
            fingerprint: Client fingerprint

        Returns:
            Dict containing session information
        """
        self.enforce_max_sessions(user_id)

        session_id: Any = self.token_service.generate_session_token()
        created_at: Any = time.time()
        expiry: Any = int(
            (
                datetime.utcnow()
                + current_app.config.get(
                    "PERMANENT_SESSION_LIFETIME", timedelta(hours=1)
                )
            ).timestamp()
        )

        session_data: Dict[Any, Any] = {
            "session_id": session_id,
            "user_id": user_id,
            "fingerprint": fingerprint,
            "created_at": created_at,
            "expiry": expiry,
        }

        # Store session in Redis
        self.redis.hmset(f"session:{session_id}", session_data)
        self.redis.sadd(f"user_sessions:{user_id}", session_id)
        self.redis.expire(
            f"session:{session_id}",
            int(
                current_app.config.get(
                    "PERMANENT_SESSION_LIFETIME", timedelta(hours=1)
                ).total_seconds()
            ),
        )

        return session_data

    def destroy_session(self, session_id: Optional[str] = None):
        """Destroy a session.

        Args:
            session_id: Optional session ID to destroy (defaults to current session)
        """
        if session_id is None:
            session_id = session.get("session_id")

        if session_id:
            user_id = session.get("user_id")
            if user_id:
                self.redis.srem(f"user_sessions:{user_id}", session_id)
            self.redis.delete(f"session:{session_id}")

        session.clear()
