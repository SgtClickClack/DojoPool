from flask_caching import Cache
from flask_caching import Cache
"""Authentication views module."""

from typing import Any, Dict, Optional, Union

from flask import (
    Blueprint,
    Response,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import generate_password_hash

from ...models.user import User
from ..database import db_session
from ..email import send_password_reset_email, send_verification_email
from ..security import get_token, verify_token
from . import auth_service

bp = Blueprint("auth", __name__, url_prefix="/auth")


def wants_json_response() -> bool:
    """Check if JSON response is requested.

    Returns:
        True if JSON response is requested
    """
    return request.accept_mimetypes.best == "application/json"


@bp.route("/register", methods=["GET", "POST"])
def register():
    """Handle user registration.

    Returns:
        Registration response
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        data = request.form.to_dict()

        # Validate required fields
        required_fields = ["username", "email", "password"]
        for field in required_fields:
            if not data.get(field):
                flash(f"{field.title()} is required", "error")
                return render_template("auth/register.html")

        with db_session() as session:
            # Check if user exists
            if session.query(User).filter_by(email=data["email"]).first():
                flash("Email already registered", "error")
                return render_template("auth/register.html")

            if session.query(User).filter_by(username=data["username"]).first():
                flash("Username already taken", "error")
                return render_template("auth/register.html")

            # Create user
            user = User(
                email=data["email"],
                username=data["username"],
                password_hash=generate_password_hash(data["password"]),
            )

            try:
                session.add(user)
                session.commit()

                # Send verification email
                token = get_token(user.email)
                send_verification_email(user.email, token)

                flash(
                    "Registration successful. Please check your email to verify your account.",
                    "success",
                )
                return redirect(url_for("auth.login"))
            except Exception as e:
                session.rollback()
                flash("Registration failed. Please try again.", "error")
                return render_template("auth/register.html")

    return render_template("auth/register.html")


@bp.route("/login", methods=["GET", "POST"])
def login():
    """Handle user login.

    Returns:
        Login response
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        data = request.form.to_dict()
        email = data.get("email")
        password = data.get("password")
        remember = data.get("remember", False)

        if not email or not password:
            flash("Please enter both email and password", "error")
            return render_template("auth/login.html")

        with db_session() as session:
            user = session.query(User).filter_by(email=email).first()

            if user and user.check_password(password):
                if not user.is_active:
                    flash("Your account is not active", "error")
                    return render_template("auth/login.html")

                login_user(user, remember=remember)
                next_page = request.args.get("next")
                if next_page and url_for("static", filename="") not in next_page:
                    return redirect(next_page)
                return redirect(url_for("main.index"))

            flash("Invalid email or password", "error")
            return render_template("auth/login.html")

    return render_template("auth/login.html")


@bp.route("/logout")
@login_required
def logout():
    """Handle user logout.

    Returns:
        Logout response
    """
    logout_user()
    flash("You have been logged out", "info")
    return redirect(url_for("main.index"))


@bp.route("/reset-password", methods=["GET", "POST"])
def reset_password_request() -> Union[str, Response]:
    """Handle password reset request.

    Returns:
        Password reset request response
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        email = request.form.get("email")
        if not email:
            flash("Please enter your email address", "error")
            return render_template("auth/reset_password_request.html")

        with db_session() as session:
            user = session.query(User).filter_by(email=email).first()
            if user:
                token = get_token(user.email)
                send_password_reset_email(user.email, token)

            # Always show success to prevent email enumeration
            flash(
                "If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.",
                "info",
            )
            return redirect(url_for("auth.login"))

    return render_template("auth/reset_password_request.html")


@bp.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token: str) -> Union[str, Response]:
    """Handle password reset.

    Args:
        token: Reset token

    Returns:
        Password reset response
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    try:
        email = verify_token(token)
    except:
        flash("Your password reset link is invalid or has expired", "error")
        return redirect(url_for("main.index"))

    if request.method == "POST":
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        if not password or not confirm_password:
            flash("Please enter and confirm your new password", "error")
            return render_template("auth/reset_password.html")

        if password != confirm_password:
            flash("Passwords do not match", "error")
            return render_template("auth/reset_password.html")

        with db_session() as session:
            user = session.query(User).filter_by(email=email).first()
            if user:
                user.password_hash = generate_password_hash(password)
                session.commit()
                flash("Your password has been reset", "success")
                return redirect(url_for("auth.login"))

        flash("Error resetting your password", "error")
        return render_template("auth/reset_password.html")

    return render_template("auth/reset_password.html")
