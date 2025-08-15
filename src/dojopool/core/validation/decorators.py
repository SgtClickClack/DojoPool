"""Validation decorators.

This module provides validation decorators for request data.
"""

from functools import wraps
from typing import Any, Callable, Optional, Type

from flask import jsonify, request
from marshmallow import Schema, ValidationError

from .base import BaseValidator


def validate_with(
    schema: Type[Schema],
    location: str = "json",
    error_status_code: int = 400,
    error_handler: Optional[Callable] = None,
) -> Callable:
    """Decorator to validate request data with a schema.

    Args:
        schema: Marshmallow schema class to validate with.
        location: Where to look for data ('json', 'form', 'args', 'files').
        error_status_code: HTTP status code to return on validation error.
        error_handler: Optional custom error handler function.

    Returns:
        Decorated function.
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            validator = BaseValidator(schema())

            try:
                if location == "json":
                    if not request.is_json:
                        raise ValidationError("Request must be JSON")
                    data = request.get_json()
                elif location == "form":
                    data = request.form.to_dict()
                elif location == "args":
                    data = request.args.to_dict()
                elif location == "files":
                    data = request.files.to_dict()
                else:
                    raise ValueError(f"Invalid location: {location}")

                result = validator.validate(data)
                if not result.is_valid:
                    if error_handler:
                        return error_handler(result.errors)
                    return (
                        jsonify({"error": "Validation failed", "errors": result.errors}),
                        error_status_code,
                    )

                kwargs["validated_data"] = result.data
                return f(*args, **kwargs)

            except ValidationError as e:
                if error_handler:
                    return error_handler(e.messages)
                return (
                    jsonify({"error": "Validation failed", "errors": e.messages}),
                    error_status_code,
                )
            except Exception as e:
                if error_handler:
                    return error_handler(str(e))
                return (
                    jsonify({"error": "Internal server error", "message": str(e)}),
                    500,
                )

        return wrapper

    return decorator
