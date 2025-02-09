"""Session security middleware."""

from datetime import datetime, timedelta
from functools import wraps
from typing import Optional
from uuid import uuid4

from flask import Flask, Request, session, request, g
from werkzeug.useragents import UserAgent

from core.errors import SecurityError

class SessionSecurityMiddleware:
    """Middleware for enhanced session security."""
    
    def __init__(self, app: Optional[Flask] = None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask) -> None:
        """Initialize the middleware with a Flask app."""
        self.app = app
        
        # Session configuration
        app.config.setdefault('SESSION_COOKIE_SECURE', True)
        app.config.setdefault('SESSION_COOKIE_HTTPONLY', True)
        app.config.setdefault('SESSION_COOKIE_SAMESITE', 'Lax')
        app.config.setdefault('PERMANENT_SESSION_LIFETIME', timedelta(days=1))
        app.config.setdefault('SESSION_PROTECTION', 'strong')
        
        # Maximum number of sessions per user
        app.config.setdefault('MAX_SESSIONS_PER_USER', 5)
        
        # Session refresh settings
        app.config.setdefault('SESSION_REFRESH_EACH_REQUEST', True)
        app.config.setdefault('SESSION_REFRESH_INTERVAL', timedelta(minutes=5))
        
        self.setup_handlers()
    
    def setup_handlers(self) -> None:
        """Set up request handlers."""
        
        @self.app.before_request
        def validate_session() -> Optional[str]:
            """Validate and refresh session if needed."""
            if not session:
                return None
                
            # Check session expiry
            if self._is_session_expired():
                session.clear()
                raise SecurityError("Session expired", code=401)
            
            # Validate session fingerprint
            if not self._validate_fingerprint():
                session.clear()
                raise SecurityError("Invalid session", code=401)
            
            # Refresh session if needed
            if self._should_refresh_session():
                self._refresh_session()
            
            # Store session info in g for logging
            g.session_id = session.get('id')
            g.user_id = session.get('user_id')
    
    def _is_session_expired(self) -> bool:
        """Check if the current session has expired."""
        expiry = session.get('expiry')
        if not expiry:
            return True
        return datetime.utcnow() > datetime.fromisoformat(expiry)
    
    def _validate_fingerprint(self) -> bool:
        """Validate session fingerprint against current request."""
        stored = session.get('fingerprint')
        if not stored:
            return False
            
        current = self._generate_fingerprint()
        return stored == current
    
    def _should_refresh_session(self) -> bool:
        """Check if session should be refreshed."""
        if not self.app.config['SESSION_REFRESH_EACH_REQUEST']:
            last_refresh = session.get('last_refresh')
            if not last_refresh:
                return True
            
            refresh_interval = self.app.config['SESSION_REFRESH_INTERVAL']
            return (datetime.utcnow() - datetime.fromisoformat(last_refresh)) > refresh_interval
            
        return True
    
    def _refresh_session(self) -> None:
        """Refresh session data."""
        session['last_refresh'] = datetime.utcnow().isoformat()
        session['expiry'] = (
            datetime.utcnow() + self.app.config['PERMANENT_SESSION_LIFETIME']
        ).isoformat()
        
        # Rotate session ID periodically
        if not session.get('rotation_time') or \
           datetime.utcnow() - datetime.fromisoformat(session['rotation_time']) > timedelta(hours=1):
            session['id'] = str(uuid4())
            session['rotation_time'] = datetime.utcnow().isoformat()
    
    def _generate_fingerprint(self) -> str:
        """Generate a fingerprint for the current request."""
        user_agent: UserAgent = request.user_agent
        
        components = [
            user_agent.string,
            request.remote_addr,
            request.headers.get('Accept-Language', ''),
            request.headers.get('Sec-Ch-Ua', '')  # Browser details
        ]
        
        return ':'.join(components)
    
    @staticmethod
    def session_required(f):
        """Decorator to require a valid session."""
        @wraps(f)
        def decorated(*args, **kwargs):
            if not session:
                raise SecurityError("Session required", code=401)
            return f(*args, **kwargs)
        return decorated
    
    @staticmethod
    def enforce_max_sessions(redis_client):
        """Decorator to enforce maximum sessions per user."""
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                if 'user_id' in session:
                    user_id = session['user_id']
                    session_key = f"user_sessions:{user_id}"
                    
                    # Get current sessions
                    sessions = redis_client.smembers(session_key)
                    
                    # Clean up expired sessions
                    for s in sessions:
                        if redis_client.get(f"session:{s}") is None:
                            redis_client.srem(session_key, s)
                    
                    # Check session limit
                    if redis_client.scard(session_key) >= current_app.config['MAX_SESSIONS_PER_USER']:
                        raise SecurityError(
                            "Maximum number of sessions reached",
                            code=429,
                            details={"max_sessions": current_app.config['MAX_SESSIONS_PER_USER']}
                        )
                    
                    # Add current session
                    session_id = session.get('id', str(uuid4()))
                    redis_client.sadd(session_key, session_id)
                    redis_client.setex(
                        f"session:{session_id}",
                        int(current_app.config['PERMANENT_SESSION_LIFETIME'].total_seconds()),
                        user_id
                    )
                
                return f(*args, **kwargs)
            return decorated
        return decorator 