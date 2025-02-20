"""Input validation middleware.

This module provides input validation for request data.
"""

from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

from flask import Request, Response, abort, current_app, request
from flask.typing import ResponseReturnValue
from marshmallow import ValidationError
from werkzeug.wrappers import Response as WerkzeugResponse


def validate_input(schema: Any) -> Callable:
    """Validate request data against schema.

    Args:
        schema: Marshmallow schema class to validate against

    Returns:
        Callable: Decorated function
    """

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any):
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
                setattr(request, "validated_data", validated_data)

                return f(*args, **kwargs)

            except ValidationError as e:
                # Return validation errors
                return {"error": "Validation failed", "messages": e.messages}, 400

        return wrapped

    return decorator


def sanitize_input(fields=None):
    """Sanitize request input fields.

    Args -> Union[Any, wrapped]:
        fields -> Any: List of fields to sanitize, or None for all
    """

    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Get request data
            if request.is_json:
                data: Any = request.get_json()
            elif request.form:
                data: Any = request.form.to_dict()
            else:
                data: Any = request.args.to_dict()

            # Sanitize specified or all fields
            sanitized: Dict[Any, Any] = {}
            for key, value in data.items():
                if fields is None or key in fields:
                    # Basic sanitization
                    if isinstance(value, str):
                        # Remove potentially dangerous characters
                        value: Any = value.replace("<", "&lt;").replace(">", "&gt;")
                        # Limit length
                        value: Any = value[:1000]
                sanitized[key] = value

            # Add sanitized data to request
            request.sanitized_data: Any = sanitized

            return f(*args, **kwargs)

        return wrapped

    return decorator


def validate_file_upload(
    allowed_extensions=None, max_size=None
) -> Union[Any, decorator, wrapped]:
    """Validate file uploads.

    Args :
        allowed_extensions: List of allowed file extensions
        max_size : Maximum file size in bytes
    """

    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if "file" not in request.files:
                abort(400, "No file uploaded")

            file: Any = request.files["file"]

            if not file.filename:
                abort(400, "No file selected")

            # Check file extension
            if allowed_extensions:
                ext: Any = file.filename.rsplit(".", 1)[1].lower()
                if ext not in allowed_extensions:
                    abort(
                        400,
                        f"File extension not allowed. Allowed types: {', '.join(allowed_extensions)}",
                    )

            # Check file size
            if max_size and file.content_length > max_size:
                abort(400, f"File too large. Maximum size: {max_size} bytes")

            return f(*args, **kwargs)

        return wrapped

    return decorator
