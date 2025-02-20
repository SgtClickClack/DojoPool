"""Narrative views."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app, jsonify
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from . import narrative_bp


@narrative_bp.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})
