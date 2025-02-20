"""Main blueprint."""

from flask import Blueprint

main_bp: Blueprint = Blueprint("main", __name__)

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from . import routes  # noqa

__all__: List[Any] = ["main_bp"]
