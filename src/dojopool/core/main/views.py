from flask_caching import Cache
from flask_caching import Cache
"""Main views for DojoPool."""

from datetime import datetime
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import (
    Blueprint,
    Request,
    Response,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.models.tournament import Tournament
from dojopool.models.venue import Venue

from ..auth import current_user, login_required
from ..models import User, db

bp: Blueprint = Blueprint("main", __name__)


@bp.route("/")
def index() -> ResponseReturnValue:
    """Render index page with featured venues and tournaments."""
    # Get latest venues
    featured_venues = Venue.query.order_by(Venue.created_at.desc()).limit(3).all()

    # Get latest tournaments
    latest_tournaments: Any = (
        Tournament.query.order_by(Tournament.created_at.desc()).limit(2).all()
    )

    return render_template(
        "index.html",
        featured_venues=featured_venues or [],
        latest_tournaments=latest_tournaments or [],
    )


@bp.route("/dashboard")
@login_required
def dashboard():
    """Render dashboard page."""
    return render_template("dashboard.html")


@bp.route("/profile")
@login_required
def profile():
    """Render profile page."""
    return render_template("profile.html")


@bp.route("/sstrings")
@login_required
def sstrings():
    """Render sstrings page."""
    return render_template("sstrings.html")


@bp.route("/about")
def about() -> str:
    """Render abostrpage."""
    return render_template("about.html")


@bp.route("/contact")
def contact():
    """Render contact page."""
    return render_template("contact.html")
