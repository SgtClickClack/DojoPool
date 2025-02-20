import logging
from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

import jwt
from flask import Request, Response, current_app, g, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

def verify_token(token: ...): ...
def require_auth(f: ...): ...
def is_admin() -> bool: ...
