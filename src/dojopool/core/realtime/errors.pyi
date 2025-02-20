from typing import Any, Dict, Optional, Type, TypeVar, Union

T = TypeVar("T", bound="WebSocketError")

class WebSocketError(Exception):
    code: str
    message: str
    data: Optional[Dict[str, Any]]

    def __init__(
        self, code: str, message: str, data: Optional[Dict[str, Any]] = None
    ) -> None: ...
    def to_dict(self) -> Dict[str, Any]: ...

class AuthenticationError(WebSocketError):
    def __init__(
        self,
        message: str = "Authentication failed",
        data: Optional[Dict[str, Any]] = None,
    ) -> None: ...

class RateLimitError(WebSocketError):
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        data: Optional[Dict[str, Any]] = None,
    ) -> None: ...

class RoomAccessError(WebSocketError):
    def __init__(
        self, message: str = "Room access denied", data: Optional[Dict[str, Any]] = None
    ) -> None: ...

class ValidationError(WebSocketError):
    def __init__(
        self, message: str = "Validation failed", data: Optional[Dict[str, Any]] = None
    ) -> None: ...

class GameError(WebSocketError):
    def __init__(
        self,
        message: str = "Game error occurred",
        data: Optional[Dict[str, Any]] = None,
    ) -> None: ...

class TournamentError(WebSocketError):
    def __init__(
        self,
        message: str = "Tournament error occurred",
        data: Optional[Dict[str, Any]] = None,
    ) -> None: ...

def format_error_response(
    error: Union[WebSocketError, Exception],
) -> Dict[str, Any]: ...
def handle_websocket_error(
    error: Union[WebSocketError, Exception],
) -> Dict[str, Any]: ...
def validate_event_data(
    event_name: str,
    data: Dict[str, Any],
    required_fields: Optional[Dict[str, Type[Any]]] = None,
) -> None: ...
