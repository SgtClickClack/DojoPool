"""Game management blueprint for DojoPool."""

from flask import Blueprint

game_bp = Blueprint('game', __name__)

from . import routes  # noqa 