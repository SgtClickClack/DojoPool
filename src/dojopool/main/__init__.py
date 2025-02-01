"""Main blueprint."""

from flask import Blueprint

main_bp = Blueprint("main", __name__)

from . import routes  # noqa

__all__ = ["main_bp"]
