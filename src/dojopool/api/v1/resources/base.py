"""Base API resource module.

This module provides base classes for API resources with common functionality.
"""

from typing import Any, Dict, Optional, Tuple, Union

from flask import request
from flask_restful import Resource
from marshmallow import Schema, ValidationError

from dojopool.core.exceptions import APIError, AuthenticationError, AuthorizationError, NotFoundError


class BaseResource(Resource):
    """Base resource class with common functionality."""

    schema: Optional[Schema] = None

    def dispatch_request(self, *args: Any, **kwargs: Any) -> Any:
        """Dispatch the request.

        Args:
            *args: Positional arguments.
            **kwargs: Keyword arguments.

        Returns:
            Any: Response data.

        Raises:
            APIError: If an error occurs.
        """
        try:
            return super().dispatch_request(*args, **kwargs)
        except ValidationError as e:
            return {"message": "Validation error", "errors": e.messages}, 400
        except AuthenticationError as e:
            return {"message": str(e)}, 401
        except AuthorizationError as e:
            return {"message": str(e)}, 403
        except NotFoundError as e:
            return {"message": str(e)}, 404
        except APIError as e:
            return {"message": str(e)}, e.status_code
        except Exception:
            return {"message": "Internal server error"}, 500

    def get_json_data(self) -> Dict[str, Any]:
        """Get and validate JSON data from request.

        Returns:
            Dict[str, Any]: Validated data.

        Raises:
            ValidationError: If validation fails.
        """
        if not request.is_json:
            raise ValidationError("Content-Type must be application/json")

        data = request.get_json()

        if self.schema:
            return self.schema.load(data)

        return data

    def paginate(self, query, schema: Optional[Schema] = None) -> Dict[str, Any]:
        """Paginate query results.

        Args:
            query: SQLAlchemy query.
            schema: Schema for serialization.

        Returns:
            Dict[str, Any]: Paginated response.
        """
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        schema = schema or self.schema
        items = schema.dump(pagination.items, many=True) if schema else pagination.items

        return {
            "items": items,
            "page": page,
            "per_page": per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
            "next_page": pagination.next_num,
            "prev_page": pagination.prev_num,
        }

    def success_response(
        self,
        data: Optional[Union[Dict[str, Any], list]] = None,
        message: Optional[str] = None,
        status_code: int = 200,
    ) -> Tuple[Dict[str, Any], int]:
        """Create a success response.

        Args:
            data: Response data.
            message: Success message.
            status_code: HTTP status code.

        Returns:
            Tuple[Dict[str, Any], int]: Response tuple.
        """
        response = {}

        if data is not None:
            response["data"] = data

        if message is not None:
            response["message"] = message

        return response, status_code

    def error_response(
        self, message: str, errors: Optional[Dict[str, Any]] = None, status_code: int = 400
    ) -> Tuple[Dict[str, Any], int]:
        """Create an error response.

        Args:
            message: Error message.
            errors: Detailed errors.
            status_code: HTTP status code.

        Returns:
            Tuple[Dict[str, Any], int]: Response tuple.
        """
        response = {"message": message}

        if errors is not None:
            response["errors"] = errors

        return response, status_code
