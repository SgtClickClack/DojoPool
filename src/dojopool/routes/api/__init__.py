"""API routes."""

from flask import Blueprint

api_bp: Blueprint = Blueprint("api", __name__)

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from . import views  # noqa
