"""Mobile routes package."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Flask, Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse


def register_mobile_routes(app: Flask) -> None:
    """Register mobile routes with the application.

    Args:
        app: Flask application instance
    """
    mobile_bp: Blueprint = Blueprint("mobile", __name__, url_prefix="/mobile")

    # Register mobile blueprint with app
    app.register_blueprint(mobile_bp)
