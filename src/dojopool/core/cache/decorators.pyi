from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

from flask import Response, current_app, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from . import cache

def cached_view(timeout: ...): ...
def invalidate_cache(key_pattern: ...): ...
