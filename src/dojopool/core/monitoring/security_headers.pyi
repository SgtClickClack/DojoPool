from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union

from flask import Flask, Response, make_response, request
from flask.typing import ResponseReturnValue

from . import security_config as config

def security_headers_middleware() -> Callable: ...
def init_security_headers(app: ...): ...
