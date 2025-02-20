"""API security monitoring module."""

from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Set, Union

from flask import g, make_response, request
from flask.typing import ResponseReturnValue
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.wrappers import Response

from ..database import db
from ..models.base import BaseModel


class SecurityException(Exception):
    """Security exception class."""

    def __init__(self, message: str, status_code: int = 400):
        """Initialize security exception."""
        super().__init__(message)
        self.status_code = status_code


def validate_api_key(api_key: str) -> bool:
    """Validate API key."""
    # TODO: Implement API key validation
    return True


def require_api_key(f: Callable):
    """Decorator to require API key for access."""

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any):
        try:
            api_key = request.headers.get("X-API-Key")
            if not api_key:
                raise SecurityException("API key is required", 401)

            # Validate API key
            if not validate_api_key(api_key):
                raise SecurityException("Invalid API key", 401)

            return f(*args, **kwargs)
        except SecurityException as e:
            return make_response({"error": str(e)}, e.status_code)

    return decorated


def log_api_request(
    request_data: Dict[str, Any], response: Response, user_id: Optional[int] = None
) -> None:
    """Log API request details."""
    api_request = APIRequest(
        endpoint=request.path,
        method=request.method,
        user_id=user_id,
        ip_address=request.remote_addr,
        user_agent=request.user_agent.string,
        request_data=request_data,
        response_code=response.status_code,
        response_time=getattr(g, "request_time", 0.0),
    )
    db.session.add(api_request)
    db.session.commit()


class APIRequest(BaseModel):
    """API request model for monitoring."""

    __tablename__: str = "api_requests"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    ip_address: Mapped[str] = mapped_column(String(45))
    user_agent: Mapped[str] = mapped_column(Text)
    request_data: Mapped[Dict[str, Any]] = mapped_column(JSON)
    response_code: Mapped[int] = mapped_column(Integer)
    response_time: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: relationship = relationship("User", backref="api_requests")

    def __repr__(self):
        return f"<APIRequest {self.method} {self.endpoint} at {self.timestamp}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "endpoint": self.endpoint,
            "method": self.method,
            "user_id": self.user_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "request_data": self.request_data,
            "response_code": self.response_code,
            "response_time": self.response_time,
            "timestamp": self.timestamp.isoformat(),
        }
