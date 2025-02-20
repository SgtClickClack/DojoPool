import time
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union

from flask import current_app, g, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Request
from werkzeug.wrappers import Response
from werkzeug.wrappers import Response as WerkzeugResponse

from ..logging import logger

class BaseMiddleware:
    pass

def request_logger(f: ...): ...
def response_logger(f: ...): ...

class RequestIdMiddleware(BaseMiddleware):
    pass

class RequestTimingMiddleware(BaseMiddleware):
    pass

class SecurityHeadersMiddleware(BaseMiddleware):
    pass

class CORSMiddleware(BaseMiddleware):
    pass

class RequestLoggingMiddleware(BaseMiddleware):
    pass
