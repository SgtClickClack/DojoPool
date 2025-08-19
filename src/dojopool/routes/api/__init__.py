"""API routes."""

from flask import Blueprint

api_bp = Blueprint("api", __name__)

from . import views  # noqa
from .video_highlight import video_highlight_api
from .marketplace import marketplace
api_bp.register_blueprint(marketplace, url_prefix="/marketplace")
