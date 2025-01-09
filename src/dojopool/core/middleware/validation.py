"""Input validation middleware.

This module provides input validation for request data.
"""

from functools import wraps
from flask import request, abort, current_app
from marshmallow import Schema, ValidationError

def validate_input(schema):
    """Validate request data against schema.
    
    Args:
        schema: Marshmallow schema class to validate against
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Create schema instance
            schema_instance = schema() if isinstance(schema, type) else schema
            
            try:
                # Get request data based on content type
                if request.is_json:
                    data = request.get_json()
                elif request.form:
                    data = request.form.to_dict()
                else:
                    data = request.args.to_dict()
                    
                # Validate data
                validated_data = schema_instance.load(data)
                
                # Add validated data to request
                request.validated_data = validated_data
                
                return f(*args, **kwargs)
                
            except ValidationError as e:
                # Return validation errors
                return {
                    'error': 'Validation failed',
                    'messages': e.messages
                }, 400
                
            except Exception as e:
                # Log unexpected errors
                current_app.logger.error(f'Validation error: {str(e)}')
                abort(400, "Invalid request data")
                
        return wrapped
    return decorator

def sanitize_input(fields=None):
    """Sanitize request input fields.
    
    Args:
        fields: List of fields to sanitize, or None for all
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Get request data
            if request.is_json:
                data = request.get_json()
            elif request.form:
                data = request.form.to_dict()
            else:
                data = request.args.to_dict()
                
            # Sanitize specified or all fields
            sanitized = {}
            for key, value in data.items():
                if fields is None or key in fields:
                    # Basic sanitization
                    if isinstance(value, str):
                        # Remove potentially dangerous characters
                        value = value.replace('<', '&lt;').replace('>', '&gt;')
                        # Limit length
                        value = value[:1000]
                sanitized[key] = value
                
            # Add sanitized data to request
            request.sanitized_data = sanitized
            
            return f(*args, **kwargs)
        return wrapped
    return decorator

def validate_file_upload(allowed_extensions=None, max_size=None):
    """Validate file uploads.
    
    Args:
        allowed_extensions: List of allowed file extensions
        max_size: Maximum file size in bytes
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if 'file' not in request.files:
                abort(400, "No file uploaded")
                
            file = request.files['file']
            
            if not file.filename:
                abort(400, "No file selected")
                
            # Check file extension
            if allowed_extensions:
                ext = file.filename.rsplit('.', 1)[1].lower()
                if ext not in allowed_extensions:
                    abort(400, f"File extension not allowed. Allowed types: {', '.join(allowed_extensions)}")
                    
            # Check file size
            if max_size and file.content_length > max_size:
                abort(400, f"File too large. Maximum size: {max_size} bytes")
                
            return f(*args, **kwargs)
        return wrapped
    return decorator
