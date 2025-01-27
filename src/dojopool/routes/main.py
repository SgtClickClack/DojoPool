"""Main routes for the application."""

from flask import Blueprint, render_template, request
from flask_login import login_required, current_user

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    """Landing page."""
    return render_template("landing.html")


@main_bp.route("/dashboard")
@login_required
def dashboard():
    """User dashboard."""
    return render_template("dashboard.html", user=current_user)


@main_bp.route("/terms")
def terms():
    """Terms of service."""
    return render_template("terms.html")


@main_bp.route("/privacy")
def privacy():
    """Privacy policy."""
    return render_template("privacy.html")
