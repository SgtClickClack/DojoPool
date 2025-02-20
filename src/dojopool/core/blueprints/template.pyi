from typing import Any, Dict, List, Optional, Tuple, Union

from flask import Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from . import BaseBlueprint, BlueprintConfig

class TemplateBlueprint(BaseBlueprint):
    pass
