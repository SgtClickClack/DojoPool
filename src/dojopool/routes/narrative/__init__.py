"""Narrative routes."""
from flask import Blueprint

narrative_bp = Blueprint('narrative', __name__)

from . import views  # noqa 