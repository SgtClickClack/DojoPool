"""Authentication routes."""
from flask import Blueprint

auth_bp = Blueprint('auth', __name__)

from .views import init_oauth  # noqa
from . import views  # noqa 