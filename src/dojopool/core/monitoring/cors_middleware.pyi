from typing import Any, Callable, Dict, List, Optional, Set, Union

from flask import Flask, Response, request
from flask.typing import ResponseReturnValue

def setup_cors(app: ...): ...
def cors_preflight_handler() -> Response: ...
