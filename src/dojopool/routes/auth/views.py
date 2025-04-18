"""Authentication views and routes."""

from typing import cast

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

# Split import for clarity
from dojopool.core.security.tokens import generate_confirmation_token
from dojopool.core.security.tokens import verify_confirmation_token
from dojopool.extensions import db, mail
from dojopool.models.user import User
from dojopool.utils.email import send_email

bp = Blueprint("auth", __name__)


def init_oauth(app):
    """Initialize OAuth providers."""
    # TODO: Add OAuth provider initialization
    pass


@bp.route("/login", methods=["GET", "POST"])
def login():
    """Handle user login."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        email = request.form.get("email", "")
        password = request.form.get("password", "")
        remember = bool(request.form.get("remember"))

        if not email or not password:
            flash("Email and password are required", "error")
            return render_template("auth/login.html")

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user, remember=remember)
            next_page = request.args.get("next")
            return redirect(next_page or url_for("main.index"))

        flash("Invalid email or password", "error")

    return render_template("auth/login.html")


@bp.route("/logout")
@login_required
def logout():
    """Handle user logout."""
    logout_user()
    return redirect(url_for("main.index"))


@bp.route("/register", methods=["GET", "POST"])
def register():
    """Handle user registration."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        email = request.form.get("email", "")
        password = request.form.get("password", "")
        username = request.form.get("username", "")

        if not email or not password or not username:
            flash("All fields are required", "error")
            return render_template("auth/register.html")

        if User.query.filter_by(email=email).first():
            flash("Email already registered", "error")
            return render_template("auth/register.html")

        user = User()
        user.email = email  # type: ignore
        user.username = username  # type: ignore
        user.password = password  # type: ignore
        db.session.add(user)
        db.session.commit()

        # Ensure we have a valid user ID
        if user is not None and user.id is not None:
            # Cast the Column[int] to int
            user_id = cast(int, user.id)
            generate_confirmation_token(user_id)
            # TODO: Send confirmation email

            flash(
                "Registration successful. Please check your email to confirm your account.",
                "success",
            )
            return redirect(url_for("auth.login"))

        flash("Error creating user account", "error")
        return render_template("auth/register.html")

    return render_template("auth/register.html")


@bp.route("/confirm/<token>")
def confirm_email(token):
    """Confirm user email address."""
    if current_user.is_authenticated and current_user.is_verified:
        return redirect(url_for("main.index"))

    user_id = verify_confirmation_token(token)
    if not user_id:
        flash("The confirmation link is invalid or has expired.", "error")
        return redirect(url_for("main.index"))

    user = User.query.get(user_id)
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("main.index"))

    if user.is_verified:
        flash("Account already confirmed.", "info")
    else:
        user.is_verified = True  # type: ignore
        db.session.commit()
        flash("Your account has been confirmed!", "success")

    return redirect(url_for("auth.login"))
