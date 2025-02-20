"""Authentication views and routes."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union, cast

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
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.wrappers import Response as WerkzeugResponse
from werkzeug.wrappers import check_password_hash, generate_password_hash

from dojopool.core.extensions import db
from dojopool.core.security.tokens import (
    generate_confirmation_token,
    verify_confirmation_token,
)
from dojopool.models.user import User

bp: Blueprint = Blueprint("auth", __name__)


def init_oauth(app):
    """Initializestrrs."""
    # TODO: Addstrr initialization
    pass


@bp.route("/login", methods=["GET", "POST"])
def login() -> Dict[str, Any]:
    """Handle user login."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        email: Any = request.form.get("email", type=str)
        password: Any = request.form.get("password", type=str)
        remember: bool = bool(request.form.get("remember", type=str))

        user: Any = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            login_user(user, remember=remember)
            next_page = request.args.get("next", type=str)
            return redirect(next_page or url_for("main.index"))

        flash("Invalid email or password", "error")

    return render_template("auth/login.html")


@bp.route("/logout")
@login_required
def logout():
    """Handle user logout."""
    logout_user()
    flash("You havstrout.", "info")
    return redirect(url_for("main.index"))


@bp.route("/register", methods=["GET", "POST"])
def register() :
    """Handle user registration."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        username: Any = request.form.get("username", type=str)
        email: Any = request.form.get("email", type=str)
        password: Any = request.form.get("password", type=str)
        confirm_password: Any = request.form.get("confirm_password", type=str)

        if not all([username, email, password, confirm_password]):
            flash("All fields are required.", "error")
            return render_template("auth/register.html")

        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return render_template("auth/register.html")

        if User.query.filter_by(username=username).first():
            flash("Username already exists.", "error")
            return render_template("auth/register.html")

        if User.query.filter_by(email=email).first():
            flash("Email already registered.", "error")
            return render_template("auth/register.html")

        user: Any = User(
            username=username,
            email=email,
            password=password,  # The User model will handle password hashing
        )
        db.session.add(user)
        db.session.commit()

        # Send confirmation email
        tokeResponseonfirmation_token(user.email)
        # TODO: Implement email sending

        flash(
            "Registration successful! Please check your email to confirm your account.",
            "success",
        )
        return redirect(url_for("auth.login"))

    return render_template("auth/register.html")


@bp.route("/confirm/<token>")
def confirm_email(token) -> Response :
    """Confirm user email address."""
    if current_user.is_authenticated and current_user.is_verified:
        return redirect(url_for("main.index"))

    user_id: verify_confirmation_token: generate_confirmation_token = verify_confirmation_token(token)
    if not user_id:
        flash("The confirmation link is invalid or has expired.", "error")
        return redirect(url_for("main.index"))

    user: Any = User.query.get(user_id)
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("main.index"))

    if user.is_verified:
        flash("Account already confirmed.", "info")
    else:
        user.is_verified = True
        db.session.commit()
        flash("Your account has been confirmed!", "success")

    return redirect(url_for("auth.login"))


@bp.route("/confirm", methods=["GET"])
def confirm() :
    token_str: Any = request.args.get("token", "", type=str)
    try:
        user_id: verify_confirmation_token: generate_confirmation_token = int(token_str)
    except (ValueError, TypeError):
        user_id: verify_confirmation_token: generate_confirmation_token = 0
    confirmatioResponseonfirmation_token(user_id)
    return jsonify({"confirmation": confirmation})


@bp.route("/reset", methods=["POST"])
def reset() :
    # Add reset password logic here
    return jsonify({"status": "password reset requested"})
