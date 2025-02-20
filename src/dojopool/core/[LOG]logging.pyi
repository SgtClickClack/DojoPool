import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Flask, has_request_context, request
from flask.logging import default_handler
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

class RequestFormatter(logging.Formatter):
    pass

def create_logs_dir(app: ...): ...
def configure_logging(app: ...): ...
