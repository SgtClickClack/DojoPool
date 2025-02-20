import logging
import re
import time
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Tuple, Union, cast
from urllib.parse import urlparse

from flask import abort, current_app, g, request
from flask_login import current_user
from jsonschema import ValidationError, validate
from werkzeug.wrappers import Response

from .exceptions import RateLimitExceeded
from .extensions import cache
from .security import is_ip_blocked

def get_rate_limit_key(endpoint: ...): ...
def check_rate_limit(endpoint: ...): ...
def rate_limit(endpoint: ...): ...
def is_admin() -> bool: ...

class RateLimitMiddleware:
    pass

class SecurityMiddleware:
    pass

def require_https() -> Callable: ...
def validate_host() -> Callable: ...
def validate_origin() -> Callable: ...
def validate_referrer() -> Callable: ...
def login_required_for_api(f: ...): ...

class InputValidation:
    pass

def validate_input(validator: ...): ...

class ErrorHandling:
    pass

class RequestLogging:
    pass

def with_error_handling(func: ...): ...
def with_logging(func: ...): ...
