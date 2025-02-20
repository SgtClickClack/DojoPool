import functools
import logging
import time
import traceback
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

from flask import current_app, has_request_context, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

def log_function_call(func: ...): ...
def setup_audit_log() -> None: ...
