"""Spectator routes."""
from flask import Blueprint

spectator_bp = Blueprint('spectator', __name__)

from . import views  # noqa 