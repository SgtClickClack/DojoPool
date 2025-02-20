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
    pass

def validate_api_key(api_key: ...): ...
def require_api_key(f: ...): ...
def log_api_request(request_data: ...): ...

class APIRequest(BaseModel):
    pass
