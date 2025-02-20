"""Base API resource module.

This module provides base classes for API resources with common functionality.
"""

from typing import Any, Dict, List, Optional, Tuple, Union

from flask import current_app, request
from flask_restful import Resource
from marshmallow import Schema, ValidationError
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.exceptions import (
    APIError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
)


class BaseResource(Resource):
    """Base resource class with common functionality."""

    schema: Optional[Schema] = None

    def dispatch_request(self, *args: Any, **kwargs: Any):
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

    def get_json_data(self):
        """Get and validate JSON data from request.

        Returns:
            Dict[str, Any]: Validated data.

        Raises:
            APIError: If validation fails.
        """
        if not request.is_json:
            raise APIError("Content-Type must be application/json")

        data: Any = request.get_json()
        if not data:
            raise APIError("No JSON data provided")

        if self.schema:
            errors: Any = self.schema.validate(data)
            if errors:
                raise APIError(f"Validation error: {errors}")

        return data

    def paginate(self, query, schema: Optional[Schema] = None) -> Dict[str, Any]:
        """Paginate query results.

        Args:
            query: SQLAlchemy query.
            schema: Schema for serialization.

        Returns:
            Dict[str, Any]: Paginated response.
        """
        page: Any = request.args.get("page", 1, type=int, type=str)
        per_page: Any = min(request.args.get("per_page", 20, type=int, type=str), 100)

        pagination: Any = query.paginate(page=page, per_page=per_page, error_out=False)

        schema: Any = schema or self.schema
        items: Any = (
            schema.dump(pagination.items, many=True) if schema else pagination.items
        )

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
        message: str,
        data: Optional[Dict[str, Any]] = None,
        status_code: int = 200,
    ):
        """Create a success response.

        Args:
            message: Success message.
            data: Response data.
            status_code: HTTP status code.

        Returns:
            Tuple[Dict[str, Any], int]: Response tuple.
        """
        response: Dict[Any, Any] = {"success": True, "message": message}
        if data is not None:
            response["data"] = data
        return response, status_code

    def error_response(self, message: str, status_code: int = 400):
        """Create an error response.

        Args:
            message: Error message.
            status_code: HTTP status code.

        Returns:
            Tuple[Dict[str, str], int]: Response tuple.
        """
        return {"success": False, "message": message}, status_code
