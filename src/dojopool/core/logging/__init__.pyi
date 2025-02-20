import json
import logging
import os
from logging import Formatter
from logging.handlers import RotatingFileHandler
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app, has_request_context, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

class RequestFormatter(Formatter):
    pass

def setup_logging(app) -> None: ...
