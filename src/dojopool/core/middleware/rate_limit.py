"""Rate limiting middleware.

This module provides rate limiting functionality.
"""

from functools import wraps
from flask import request, jsonify, current_app
from src.extensions import cache

def rate_limit(limit: int = 100, period: int = 3600):
    """Rate limiting decorator.
    
    Args:
        limit: Maximum number of requests allowed in period
        period: Time period in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            ip = request.remote_addr
            
            # Get current request count
            key = f'rate_limit:{ip}:{f.__name__}'
            count = cache.get(key) or 0
            
            if count >= limit:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Maximum {limit} requests per {period} seconds'
                }), 429
            
            # Increment count
            cache.set(key, count + 1, timeout=period)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def api_rate_limit(strict=False):
    """API-specific rate limit decorator with different tiers.
    
    Args:
        strict: Whether to use stricter limits
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Get user tier
            user = getattr(request, 'user', None)
            tier = getattr(user, 'tier', 'basic') if user else 'basic'
            
            # Define tier limits (requests per minute)
            limits = {
                'basic': 60,
                'premium': 300,
                'enterprise': 1000
            }
            
            # Apply stricter limits if specified
            if strict:
                limits = {k: v // 2 for k, v in limits.items()}
                
            # Get limit for user's tier
            limit = limits.get(tier, limits['basic'])
            
            # Apply rate limiting
            return rate_limit(requests=limit, window=60, by='user' if user else 'ip')(f)(*args, **kwargs)
            
        return wrapped
    return decorator
