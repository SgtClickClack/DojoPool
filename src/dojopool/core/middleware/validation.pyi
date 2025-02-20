from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

from flask import Request, Response, abort, current_app, request
from flask.typing import ResponseReturnValue
from marshmallow import ValidationError
from werkzeug.wrappers import Response as WerkzeugResponse

def validate_input(schema: ...): ...
def sanitize_input(fields=None) -> Union[Any, decorator, wrapped]: ...
def validate_file_upload(
    allowed_extensions=None, max_size=None
) -> Union[Any, decorator, wrapped]: ...
