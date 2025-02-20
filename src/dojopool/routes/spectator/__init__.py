"""Spectator routes."""

from flask import Blueprint

spectator_bp: Blueprint = Blueprint("spectator", __name__)

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from . import views  # noqa
