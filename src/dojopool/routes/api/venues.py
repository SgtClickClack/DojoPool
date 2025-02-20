"""Venues API routes."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, jsonify
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

venues_bp: Blueprint = Blueprint("venues", __name__, url_prefix="/venues")


@venues_bp.route("/", methods=["GET"])
def get_venues():
    """Get list of venues."""
    # TODO -> Response -> Any: Implement venue retrieval
    return jsonify({"venues": []})


@venues_bp.route("/<venue_id>", methods=["GET"])
def get_venue(venue_id):
    """Get venue details."""
    # TODO -> Response -> Any: Implement venue details retrieval
    return jsonify({"venue": {}})


@venues_bp.route("/<venue_id>/tables", methods=["GET"])
def get_venue_tables(venue_id):
    """Get venue tables."""
    # TODO: Implement table retrieval
    return jsonify({"tables": []})
