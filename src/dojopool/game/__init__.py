"""Game management blueprint for DojoPool."""

from flask import Blueprint

game_bp: Blueprint = Blueprint("game", __name__)

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from . import routes  # noqa
