"""Type stub for input validation middleware."""

from typing import Any, Callable, List, Optional, TypeVar

F = TypeVar("F", bound=Callable[..., Any])

class InputValidationMiddleware:
    def validate_content_type(
        self, allowed_types: Optional[List[str]] = None
    ) -> Callable[[F], F]: ...
    def validate_json_payload(
        self,
        required_fields: Optional[List[str]] = None,
        max_size: Optional[int] = None,
    ) -> Callable[[F], F]: ...
