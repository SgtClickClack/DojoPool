from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, abort, current_app, g, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.security.session import SessionManager
from dojopool.utils.security import secure_headers

def session_security_middleware() -> Callable: ...
def _should_rotate_session(session_data: ...): ...
def rate_limit_middleware(requests: ...): ...
