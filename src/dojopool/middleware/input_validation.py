"""Input validation and sanitization middleware."""

import functools
from typing import (
    Any,
    Callable,
    Dict,
    List,
    NoReturn,
    Optional,
    Tuple,
    Type,
    TypeVar,
    Union,
    cast,
)

from flask import Flask, Request, Response, current_app, request
from flask.typing import ResponseReturnValue
from marshmallow import Schema, ValidationError
from werkzeug.wrappers import BadRequest
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.errors import InvalidInputError
from dojopool.schemas.validation import BaseSchema

F: TypeVar = TypeVar("F", bound=Callable[..., Any])


class InputValidationMiddleware:
    """Middleware for validating and sanitizing request input."""

    def __init__(self, app: Flask) -> None:
        """Initialize input validation middleware.

        Args:
            app: Flask application instance
        """
        self.app = app
        self.schemas: Dict[str, Schema] = {}

    def validate_request(self, schema_cls: Type[BaseSchema], location: str = "json"):
        """Decorator to validate request data against a schema.

        Args:
            schema_cls: Schema class to use for validation
            location: Request location to validate ('json', 'form', 'args', 'headers')

        Returns:
            Decorated function
        """

        def decorator(f: Callable):
            @functools.wraps(f)
            def decorated_function(*args: Any, **kwargs: Any):
                schema = schema_cls()

                # Get data from the specified location
                if location == "json":
                    data: Any = request.get_json(silent=True)
                elif location in ("form", "args", "headers"):
                    data: Any = getattr(request, location)
                else:
                    raise ValueError(f"Invalid location: {location}")

                if data is None:
                    raise BadRequest("No data provided")

                try:
                    # Validate and sanitize input
                    validated_data: Any = schema.load(data)

                    # Store validated data
                    setattr(request, f"validated_{location}", validated_data)

                    return f(*args, **kwargs)

                except ValidationError as e:
                    raise InvalidInputError(
                        message="Invalid input data", details=e.messages
                    )

            return decorated_function

        return decorator

    def sanitize_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize input data to prevent XSS and injection attacks.

        Args:
            data: Input data to sanitize

        Returns:
            Sanitized data
        """
        if not isinstance(data, dict):
            return data

        sanitized: Dict[Any, Any] = {}
        for key, value in data.items():
            if isinstance(value, str):
                # Remove potentially dangerous characters
                value: Any = self._sanitize_string(value)
            elif isinstance(value, dict):
                value: Any = self.sanitize_input(value)
            elif isinstance(value, list):
                value: Any = [
                    (
                        self.sanitize_input(item)
                        if isinstance(item, dict)
                        else (
                            self._sanitize_string(item)
                            if isinstance(item, str)
                            else item
                        )
                    )
                    for item in value
                ]
            sanitized[key] = value

        return sanitized

    def _sanitize_string(self, value: str):
        """Sanitize a string value.

        Args:
            value: String to sanitize

        Returns:
            Sanitized string
        """
        # Replace potentially dangerous characters
        replacements: Dict[Any, Any] = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "/": "&#x2F;",
            "\\": "&#x5C;",
            "\n": " ",
            "\r": " ",
        }

        for char, replacement in replacements.items():
            value: Any = value.replace(char, replacement)

        return value.strip()

    def validate_content_type(
        self, allowed_types: Optional[List[str]] = None
    ) -> Callable[[F], F]:
        """Decorator to validate request content type.

        Args:
            allowed_types: List of allowed content types

        Returns:
            Decorated function
        """
        if allowed_types is None:
            allowed_types = ["application/json"]

        def decorator(f: F):
            @functools.wraps(f)
            def decorated_function(*args: Any, **kwargs: Any):
                content_type: Any = request.content_type

                if not content_type:
                    raise BadRequest("Content-Type header is required")

                # Extract base content type without parameters
                base_content_type: Any = content_type.split(";")[0].lower()

                if base_content_type not in allowed_types:
                    raise BadRequest(
                        f'Invalid Content-Type. Must be one of: {", ".join(allowed_types)}'
                    )

                return f(*args, **kwargs)

            return cast(F, decorated_function)

        return decorator

    def validate_file_upload(
        self, allowed_extensions: Optional[list] = None, max_size: Optional[int] = None
    ) -> Callable:
        """Decorator to validate file uploads.

        Args:
            allowed_extensions: List of allowed file extensions
            max_size: Maximum file size in bytes

        Returns:
            Decorated function
        """
        if allowed_extensions is None:
            allowed_extensions = ["jpg", "jpeg", "png", "pdf"]

        def decorator(f: Callable):
            @functools.wraps(f)
            def decorated_function(*args: Any, **kwargs: Any):
                if "file" not in request.files:
                    raise BadRequest("No file uploaded")

                file: Any = request.files["file"]

                if not file.filename:
                    raise BadRequest("No file selected")

                # Check file extension
                extension = file.filename.rsplit(".", 1)[1].lower()
                if extension not in allowed_extensions:
                    raise BadRequest(
                        f'Invalid file type. Must be one of: {", ".join(allowed_extensions)}'
                    )

                # Check file size
                if max_size and file.content_length > max_size:
                    raise BadRequest(
                        f"File too large. Maximum size is {max_size} bytes"
                    )

                return f(*args, **kwargs)

            return decorated_function

        return decorator

    def validate_json_payload(
        self,
        required_fields: Optional[List[str]] = None,
        max_size: Optional[int] = None,
    ) -> Callable[[F], F]:
        """Decorator to validate JSON request payload.

        Args:
            required_fields: List of required JSON fields
            max_size: Maximum allowed size of JSON payload in bytes

        Returns:
            Decorated function
        """

        def decorator(f: F):
            @functools.wraps(f)
            def decorated_function(*args: Any, **kwargs: Any):
                if not request.is_json:
                    raise BadRequest("Request must be JSON")

                if (
                    max_size
                    and request.content_length
                    and request.content_length > max_size
                ):
                    raise BadRequest(
                        f"Request payload too large. Maximum size is {max_size} bytes"
                    )

                data: Any = request.get_json()

                if required_fields:
                    missing_fields: Any = [
                        field for field in required_fields if field not in data
                    ]
                    if missing_fields:
                        raise BadRequest(
                            f'Missing required fields: {", ".join(missing_fields)}'
                        )

                return f(*args, **kwargs)

            return cast(F, decorated_function)

        return decorator
