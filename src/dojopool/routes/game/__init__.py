"""Game routes blueprint."""

from flask import Blueprint

# Create the game blueprint
game_bp = Blueprint("game", __name__)

# Import all views to register routes
from . import routes  # noqa
