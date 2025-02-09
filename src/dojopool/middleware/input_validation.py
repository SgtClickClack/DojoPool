from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union
import bleach
import json
from flask import Request, request
from marshmallow import Schema, ValidationError
import re

class InputValidationMiddleware:
    """Middleware for input validation and sanitization."""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
            
    def init_app(self, app):
        """Initialize the middleware with a Flask app."""
        self.app = app
        self.setup_request_handlers()
        
    def setup_request_handlers(self):
        """Set up request handlers for input validation and sanitization."""
        @self.app.before_request
        def sanitize_request_data():
            """Sanitize incoming request data."""
            if request.method in ['POST', 'PUT', 'PATCH']:
                self._sanitize_request_json()
                self._sanitize_request_form()
            self._sanitize_query_params()
            
    def validate_with_schema(self, schema: Schema) -> Callable:
        """Decorator to validate request data against a schema."""
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def wrapper(*args, **kwargs):
                try:
                    if request.is_json:
                        data = request.get_json()
                        validated_data = schema.load(data)
                        request.validated_data = validated_data
                    elif request.form:
                        validated_data = schema.load(request.form.to_dict())
                        request.validated_data = validated_data
                    else:
                        validated_data = schema.load(request.args.to_dict())
                        request.validated_data = validated_data
                except ValidationError as err:
                    return {'errors': err.messages}, 400
                return f(*args, **kwargs)
            return wrapper
        return decorator
        
    def _sanitize_request_json(self):
        """Sanitize JSON request data."""
        if request.is_json and request.get_json(silent=True):
            data = request.get_json()
            sanitized = self._sanitize_data(data)
            setattr(request, '_cached_json', sanitized)
            
    def _sanitize_request_form(self):
        """Sanitize form data."""
        if request.form:
            sanitized_form = {
                key: self._sanitize_string(value)
                for key, value in request.form.items()
            }
            request.form = sanitized_form
            
    def _sanitize_query_params(self):
        """Sanitize query parameters."""
        if request.args:
            sanitized_args = {
                key: self._sanitize_string(value)
                for key, value in request.args.items()
            }
            request.args = sanitized_args
            
    def _sanitize_data(self, data: Any) -> Any:
        """Recursively sanitize data structures."""
        if isinstance(data, dict):
            return {key: self._sanitize_data(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        elif isinstance(data, str):
            return self._sanitize_string(data)
        return data
        
    def _sanitize_string(self, value: str) -> str:
        """Sanitize a string value."""
        # Remove potential SQL injection patterns
        sql_patterns = r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)'
        value = re.sub(sql_patterns, '', value, flags=re.IGNORECASE)
        
        # Sanitize HTML/JavaScript
        allowed_tags = ['b', 'i', 'u', 'em', 'strong']
        allowed_attributes = {}
        value = bleach.clean(
            value,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True
        )
        
        # Remove potential command injection patterns
        cmd_patterns = r'[;&|`]'
        value = re.sub(cmd_patterns, '', value)
        
        return value.strip()
        
    @staticmethod
    def validate_content_type(allowed_types: List[str]) -> Callable:
        """Decorator to validate content type of requests."""
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def wrapper(*args, **kwargs):
                content_type = request.headers.get('Content-Type', '')
                if not any(allowed_type in content_type for allowed_type in allowed_types):
                    return {
                        'error': f'Invalid Content-Type. Allowed types: {", ".join(allowed_types)}'
                    }, 415
                return f(*args, **kwargs)
            return wrapper
        return decorator 