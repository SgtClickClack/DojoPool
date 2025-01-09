"""Security module for DojoPool."""

import time
import logging
import threading
from typing import Dict, List, Optional, Set, Tuple, Union, Any, Callable
from functools import wraps
from datetime import datetime, timedelta
import secrets
import hashlib
import hmac
from dataclasses import dataclass, field
from collections import defaultdict
import redis
from flask import current_app, request
from flask_login import current_user
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from dojopool.exceptions import AuthenticationError, AuthorizationError

logger = logging.getLogger(__name__)

def require_auth(f: Callable) -> Callable:
    """Decorator to require authentication.
    
    Args:
        f: Function to decorate
        
    Returns:
        Decorated function
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            raise AuthenticationError('Authentication required')
        return f(*args, **kwargs)
    return decorated

def require_roles(*roles: str) -> Callable:
    """Decorator to require specific roles.
    
    Args:
        *roles: Required roles
        
    Returns:
        Decorated function
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            if not current_user.is_authenticated:
                raise AuthenticationError('Authentication required')
            
            if not any(current_user.has_role(role) for role in roles):
                raise AuthorizationError('Insufficient permissions')
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def generate_password_hash_with_method(password: str, method: str = 'pbkdf2:sha256') -> str:
    """Generate password hash with specified method.
    
    Args:
        password: Password to hash
        method: Hashing method
        
    Returns:
        str: Password hash
    """
    return generate_password_hash(password, method=method)

def check_password(password_hash: str, password: str) -> bool:
    """Check if password matches hash.
    
    Args:
        password_hash: Stored password hash
        password: Password to check
        
    Returns:
        bool: True if password matches
    """
    return check_password_hash(password_hash, password)

def generate_reset_token(user_id: int, expires_in: int = 3600) -> str:
    """Generate password reset token.
    
    Args:
        user_id: User ID
        expires_in: Token expiry time in seconds
        
    Returns:
        str: Reset token
    """
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(user_id, salt='password-reset-salt')

def verify_reset_token(token: str, max_age: int = 3600) -> int:
    """Verify password reset token.
    
    Args:
        token: Reset token
        max_age: Maximum token age in seconds
        
    Returns:
        int: User ID
        
    Raises:
        AuthenticationError: If token is invalid or expired
    """
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_id = serializer.loads(token, salt='password-reset-salt', max_age=max_age)
        return user_id
    except (SignatureExpired, BadSignature):
        raise AuthenticationError('Invalid or expired reset token')

@dataclass
class RateLimitConfig:
    """Rate limit configuration."""
    requests: int  # Number of requests allowed
    window: int   # Time window in seconds
    block_time: Optional[int] = None  # Block duration after limit exceeded

@dataclass
class RateLimitState:
    """Rate limit state for a key."""
    requests: List[float] = field(default_factory=list)
    blocked_until: Optional[float] = None

class RateLimiter:
    """Rate limiting manager."""
    
    def __init__(
        self,
        config: Dict[str, RateLimitConfig],
        redis_client: Optional[redis.Redis] = None
    ):
        """Initialize rate limiter.
        
        Args:
            config: Rate limit configurations by endpoint/scope
            redis_client: Optional Redis client for distributed rate limiting
        """
        self.config = config
        self.redis = redis_client
        self.states: Dict[str, Dict[str, RateLimitState]] = defaultdict(dict)
        self.lock = threading.Lock()
    
    def is_allowed(
        self,
        key: str,
        scope: str = 'default'
    ) -> Tuple[bool, Optional[int]]:
        """Check if request is allowed.
        
        Args:
            key: Rate limit key (e.g., IP address)
            scope: Rate limit scope/endpoint
            
        Returns:
            Tuple of (allowed, retry_after)
        """
        if scope not in self.config:
            return True, None
        
        config = self.config[scope]
        now = time.time()
        
        # Use Redis if available
        if self.redis:
            return self._check_redis_limit(key, scope, config, now)
        
        # Use local state
        with self.lock:
            state = self.states[scope].get(key)
            if not state:
                state = RateLimitState()
                self.states[scope][key] = state
            
            # Check if blocked
            if state.blocked_until and now < state.blocked_until:
                return False, int(state.blocked_until - now)
            
            # Remove old requests
            window_start = now - config.window
            state.requests = [t for t in state.requests if t > window_start]
            
            # Check limit
            if len(state.requests) >= config.requests:
                if config.block_time:
                    state.blocked_until = now + config.block_time
                return False, config.window
            
            # Add request
            state.requests.append(now)
            return True, None
    
    def _check_redis_limit(
        self,
        key: str,
        scope: str,
        config: RateLimitConfig,
        now: float
    ) -> Tuple[bool, Optional[int]]:
        """Check rate limit using Redis.
        
        Args:
            key: Rate limit key
            scope: Rate limit scope
            config: Rate limit configuration
            now: Current timestamp
            
        Returns:
            Tuple of (allowed, retry_after)
        """
        redis_key = f"ratelimit:{scope}:{key}"
        block_key = f"ratelimit:block:{scope}:{key}"
        
        try:
            # Check if blocked
            blocked_until = self.redis.get(block_key)
            if blocked_until:
                blocked_until = float(blocked_until)
                if now < blocked_until:
                    return False, int(blocked_until - now)
            
            # Use sorted set to track requests
            window_start = now - config.window
            
            # Remove old requests
            self.redis.zremrangebyscore(redis_key, 0, window_start)
            
            # Count requests in window
            num_requests = self.redis.zcard(redis_key)
            
            if num_requests >= config.requests:
                if config.block_time:
                    blocked_until = now + config.block_time
                    self.redis.setex(
                        block_key,
                        config.block_time,
                        str(blocked_until)
                    )
                return False, config.window
            
            # Add request
            pipeline = self.redis.pipeline()
            pipeline.zadd(redis_key, {str(now): now})
            pipeline.expire(redis_key, config.window)
            pipeline.execute()
            
            return True, None
        
        except redis.RedisError as e:
            logger.error(f"Redis error in rate limiter: {e}")
            return True, None  # Fail open on Redis errors

class CSRFProtection:
    """CSRF protection manager."""
    
    def __init__(
        self,
        secret_key: str,
        token_expiry: int = 3600,  # 1 hour
        redis_client: Optional[redis.Redis] = None
    ):
        """Initialize CSRF protection.
        
        Args:
            secret_key: Secret key for token generation
            token_expiry: Token expiry time in seconds
            redis_client: Optional Redis client for token storage
        """
        self.secret_key = secret_key.encode('utf-8')
        self.token_expiry = token_expiry
        self.redis = redis_client
        self.tokens: Dict[str, float] = {}
        self.lock = threading.Lock()
    
    def generate_token(self, session_id: str) -> str:
        """Generate CSRF token.
        
        Args:
            session_id: Session identifier
            
        Returns:
            CSRF token
        """
        # Generate random token
        token = secrets.token_urlsafe(32)
        expires = time.time() + self.token_expiry
        
        # Sign token
        signature = self._sign_token(token, session_id)
        full_token = f"{token}.{signature}"
        
        # Store token
        if self.redis:
            try:
                self.redis.setex(
                    f"csrf:{session_id}:{token}",
                    self.token_expiry,
                    str(expires)
                )
            except redis.RedisError as e:
                logger.error(f"Redis error storing CSRF token: {e}")
        else:
            with self.lock:
                self.tokens[f"{session_id}:{token}"] = expires
        
        return full_token
    
    def validate_token(
        self,
        token: str,
        session_id: str
    ) -> bool:
        """Validate CSRF token.
        
        Args:
            token: CSRF token to validate
            session_id: Session identifier
            
        Returns:
            Whether token is valid
        """
        try:
            # Split token and signature
            token_value, signature = token.split('.')
            
            # Verify signature
            if not self._verify_token(token_value, signature, session_id):
                return False
            
            # Check if token exists and is not expired
            if self.redis:
                try:
                    key = f"csrf:{session_id}:{token_value}"
                    expires = self.redis.get(key)
                    if not expires:
                        return False
                    
                    expires = float(expires)
                    if time.time() > expires:
                        self.redis.delete(key)
                        return False
                    
                    # Delete token after use
                    self.redis.delete(key)
                    return True
                except redis.RedisError as e:
                    logger.error(f"Redis error validating CSRF token: {e}")
                    return False
            else:
                with self.lock:
                    key = f"{session_id}:{token_value}"
                    expires = self.tokens.get(key)
                    if not expires:
                        return False
                    
                    if time.time() > expires:
                        del self.tokens[key]
                        return False
                    
                    # Delete token after use
                    del self.tokens[key]
                    return True
        except Exception as e:
            logger.error(f"Error validating CSRF token: {e}")
            return False
    
    def _sign_token(self, token: str, session_id: str) -> str:
        """Sign token with HMAC.
        
        Args:
            token: Token to sign
            session_id: Session identifier
            
        Returns:
            str: Token signature
        """
        msg = f"{token}.{session_id}".encode('utf-8')
        signature = hmac.new(self.secret_key, msg, hashlib.sha256).hexdigest()
        return signature
    
    def _verify_token(self, token: str, signature: str, session_id: str) -> bool:
        """Verify token signature.
        
        Args:
            token: Token to verify
            signature: Token signature
            session_id: Session identifier
            
        Returns:
            bool: Whether signature is valid
        """
        expected = self._sign_token(token, session_id)
        return hmac.compare_digest(signature, expected)
    
    def cleanup_expired(self):
        """Clean up expired tokens."""
        now = time.time()
        
        if self.redis:
            # Redis handles expiration automatically
            pass
        else:
            with self.lock:
                expired = [
                    key for key, expires in self.tokens.items()
                    if now > expires
                ]
                for key in expired:
                    del self.tokens[key]

class SecurityHeaders:
    """Security headers manager."""
    
    def __init__(
        self,
        csp_config: Optional[Dict[str, Union[str, List[str]]]] = None,
        hsts_config: Optional[Dict[str, Union[bool, int]]] = None
    ):
        """Initialize security headers.
        
        Args:
            csp_config: Content Security Policy configuration
            hsts_config: HTTP Strict Transport Security configuration
        """
        self.csp_config = csp_config or self.default_csp_config()
        self.hsts_config = hsts_config or self.default_hsts_config()
    
    def default_csp_config(self) -> Dict[str, Union[str, List[str]]]:
        """Get default CSP configuration.
        
        Returns:
            Default CSP directives
        """
        return {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'font-src': ["'self'"],
            'connect-src': ["'self'"],
            'frame-ancestors': ["'none'"],
            'form-action': ["'self'"],
            'base-uri': ["'self'"],
            'object-src': ["'none'"]
        }
    
    def default_hsts_config(self) -> Dict[str, Union[bool, int]]:
        """Get default HSTS configuration.
        
        Returns:
            Default HSTS settings
        """
        return {
            'max_age': 31536000,  # 1 year
            'include_subdomains': True,
            'preload': False
        }
    
    def get_headers(self) -> Dict[str, str]:
        """Get security headers.
        
        Returns:
            Dict of security headers
        """
        headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'Content-Security-Policy': self._build_csp_header(),
            'Strict-Transport-Security': self._build_hsts_header()
        }
        return headers
    
    def _build_csp_header(self) -> str:
        """Build Content Security Policy header.
        
        Returns:
            CSP header value
        """
        directives = []
        
        for directive, sources in self.csp_config.items():
            if isinstance(sources, str):
                sources = [sources]
            directives.append(f"{directive} {' '.join(sources)}")
        
        return '; '.join(directives)
    
    def _build_hsts_header(self) -> str:
        """Build HSTS header.
        
        Returns:
            HSTS header value
        """
        parts = [f"max-age={self.hsts_config['max_age']}"]
        
        if self.hsts_config.get('include_subdomains'):
            parts.append('includeSubDomains')
        
        if self.hsts_config.get('preload'):
            parts.append('preload')
        
        return '; '.join(parts)

def rate_limit(scope: str = 'default'):
    """Decorator for rate limiting.
    
    Args:
        scope: Rate limit scope/endpoint
        
    Returns:
        Decorated function
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get rate limiter instance
            limiter = RateLimiter({})  # You might want to use a singleton pattern
            
            # Get client identifier (e.g., IP address)
            # This should be implemented based on your web framework
            client_id = "127.0.0.1"  # Example
            
            allowed, retry_after = limiter.is_allowed(client_id, scope)
            if not allowed:
                # Handle rate limit exceeded
                # This should be implemented based on your web framework
                raise Exception(f"Rate limit exceeded. Retry after {retry_after} seconds")
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def csrf_protect():
    """Decorator for CSRF protection.
    
    Returns:
        Decorated function
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get CSRF protection instance
            csrf = CSRFProtection("your-secret-key")  # You might want to use a singleton pattern
            
            # Get session ID and token
            # This should be implemented based on your web framework
            session_id = "example-session"
            token = "example-token"
            
            if not csrf.validate_token(token, session_id):
                # Handle invalid CSRF token
                # This should be implemented based on your web framework
                raise Exception("Invalid CSRF token")
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def add_security_headers(headers: SecurityHeaders):
    """Decorator for adding security headers.
    
    Args:
        headers: SecurityHeaders instance
        
    Returns:
        Decorated function
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            response = func(*args, **kwargs)
            
            # Add security headers to response
            if hasattr(response, 'headers'):
                response.headers.update(headers.get_headers())
            
            return response
        return wrapper
    return decorator