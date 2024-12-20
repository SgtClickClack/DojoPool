"""Validation module."""
from functools import wraps
from flask import request, jsonify
from marshmallow import ValidationError as MarshmallowError
from ..exceptions import ValidationError

def validate_request(schema_cls):
    """Validate request data against schema."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            schema = schema_cls()
            try:
                if request.is_json:
                    data = schema.load(request.get_json())
                else:
                    data = schema.load(request.form.to_dict())
                return f(*args, data=data, **kwargs)
            except MarshmallowError as e:
                raise ValidationError(message="Invalid request data", details=e.messages)
        return decorated_function
    return decorator

def validate_with(schema_cls):
    """Validate data with schema."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            schema = schema_cls()
            try:
                if 'data' in kwargs:
                    data = schema.load(kwargs['data'])
                    kwargs['data'] = data
                return f(*args, **kwargs)
            except MarshmallowError as e:
                raise ValidationError(message="Invalid data", details=e.messages)
        return decorated_function
    return decorator

__all__ = ['validate_request', 'validate_with', 'ValidationError'] 