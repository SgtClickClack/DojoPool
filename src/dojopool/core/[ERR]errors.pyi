from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union, cast

from flask import Flask, Response, jsonify, render_template, request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import HTTPException
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.extensions import db

class DojoPoolError(Exception):
    pass

class ValidationError(DojoPoolError):
    pass

class AuthenticationError(DojoPoolError):
    pass

class AuthorizationError(DojoPoolError):
    pass

class ResourceNotFoundError(DojoPoolError):
    pass

class APIError(DojoPoolError):
    pass

def register_error_handlers(app: ...): ...
