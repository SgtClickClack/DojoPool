"""Main routes."""

import os
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import (
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
from flask_login import current_user, login_required
from src.core.database import db
from src.models.user import User
from werkzeug.security import check_password_hash
from werkzeug.wrappers import Response as WerkzeugResponse

from . import main_bp


@main_bp.route("/")
def index() -> ResponseReturnValue:
    """Render the index page."""
    return render_template("index.html")


@main_bp.route("/dashboard")
@login_required
def dashboard():
    """Render the dashboard page."""
    return render_template("dashboard.html")


@main_bp.route("/about")
def about():
    """Render the about page."""
    return render_template("about.html")


@main_bp.route("/contact", methods=["GET", "POST"])
def contact():
    """Handle contact form."""
    if request.method == "POST":
        # TODO: Implement contact form handling
        flash("Your message has been sent. We will get back to you soon!", "success")
        return redirect(url_for("main.contact"))
    return render_template("contact.html")


@main_bp.route("/profile", methods=["GET", "POST"])
@login_required
def profile() -> ResponseReturnValue:
    """Handle user profile."""
    if request.method == "POST":
        username: Any = request.form.get("username", type=str)
        email: Any = request.form.get("email", type=str)
        first_name: Any = request.form.get("first_name", type=str)
        last_name: Any = request.form.get("last_name", type=str)

        # Check if username is taken
        if (
            username != current_user.username
            and User.query.filter_by(username=username).first()
        ):
            flash("Username is already taken.", "error")
            return redirect(url_for("main.profile"))

        # Check if email is taken
        if email != current_user.email and User.query.filter_by(email=email).first():
            flash("Email is already taken.", "error")
            return redirect(url_for("main.profile"))

        # Update user
        current_user.username = username
        current_user.email = email
        current_user.first_name = first_name
        current_user.last_name = last_name

        db.session.commit()
        flash("Profile updated successfully.", "success")
        return redirect(url_for("main.profile"))

    return render_template("profile.html")


@main_bp.route("/settings")
@login_required
def settings():
    """Render the settings page."""
    return render_template("settings.html")


@main_bp.route("/change-password", methods=["POST"])
@login_required
def change_password() -> ResponseReturnValue:
    """Handle password change."""
    current_password = request.form.get("current_password", type=str)
    new_password: Any = request.form.get("new_password", type=str)
    confirm_password: Any = request.form.get("confirm_password", type=str)

    if not current_password or not new_password or not confirm_password:
        flash("All fields are required.", "error")
        return redirect(url_for("main.settings"))

    if not current_user.check_password(current_password):
        flash("Current password is incorrect.", "error")
        return redirect(url_for("main.settings"))

    if new_password != confirm_password:
        flash("New passwords do not match.", "error")
        return redirect(url_for("main.settings"))

    current_user.set_password(new_password)
    db.session.commit()
    flash("Password changed successfully.", "success")
    return redirect(url_for("main.settings"))


@main_bp.route("/update-notifications", methods=["POST"])
@login_required
def update_notifications() -> ResponseReturnValue:
    """Handle notification settings update."""
    current_user.email_notifications = bool(
        request.form.get("email_notifications", type=str)
    )
    current_user.tournament_updates = bool(
        request.form.get("tournament_updates", type=str)
    )
    current_user.achievement_notifications = bool(
        request.form.get("achievement_notifications", type=str)
    )

    db.session.commit()
    flash("Notification settings updated.", "success")
    return redirect(url_for("main.settings"))


@main_bp.route("/update-privacy", methods=["POST"])
@login_required
def update_privacy() -> ResponseReturnValue:
    """Handle privacy settings update."""
    current_user.profile_visible = bool(request.form.get("profile_visible", type=str))
    current_user.show_activity = bool(request.form.get("show_activity", type=str))

    db.session.commit()
    flash("Privacy settings updated successfully.", "success")
    return redirect(url_for("main.settings"))


@main_bp.route("/delete-account", methods=["POST"])
@login_required
def delete_account() -> ResponseReturnValue:
    """Handle account deletion."""
    password = request.form.get("password", type=str)

    if not password:
        flash("Password is required to delete your account.", "error")
        return redirect(url_for("main.settings"))

    if not current_user.check_password(password):
        flash("Password is incorrect.", "error")
        return redirect(url_for("main.settings"))

    db.session.delete(current_user)
    db.session.commit()
    flash("Your account has been deleted.", "success")
    return redirect(url_for("auth.login"))


# Corrected version:
config_value: Any = os.getenv("PASSWORD_44")
