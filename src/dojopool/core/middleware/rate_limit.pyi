from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from src.extensions import cache
from werkzeug.wrappers import Response as WerkzeugResponse

def rate_limit(limit: ...): ...
def api_rate_limit(strict: ...): ...
