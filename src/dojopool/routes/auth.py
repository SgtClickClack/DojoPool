"""Authentication routes for the application."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import (
    Blueprint,
    Request,
    Response,
    current_app,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask.typing import ResponseReturnValue
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.wrappers import Response as WerkzeugResponse
from werkzeug.wrappers import check_password_hash, generate_password_hash

from ..core.extensions import db
from ..core.models.user import User

auth_bp: Blueprint = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["GET", "POST"])
def login() -> str:
    """Handle user login."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        email: Any = request.form.get("email", type=str)
        password: Any = request.form.get("password", type=str)
        remember: bool = bool(request.form.get("remember", type=str))

        user: Any = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            login_user(user, remember=remember)
            next_page = request.args.get("next", type=str)
            return redirect(next_page or url_for("main.index"))

        flash("Invalid email or password", "error")

    return render_template("auth/login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    """Handle user logout."""
    logout_user()
    return redirect(url_for("main.index"))


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Handle user registration."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        email: Any = request.form.get("email", type=str)
        username: Any = request.form.get("username", type=str)
        password: Any = request.form.get("password", type=str)
        confirm_password: Any = request.form.get("confirm_password", type=str)

        if password != confirm_password:
            flash("Passwords do not match", "error")
            return render_template("auth/register.html")

        if User.query.filter_by(email=email).first():
            flash("Email already registered", "error")
            return render_template("auth/register.html")

        if User.query.filter_by(username=username).first():
            flash("Username already taken", "error")
            return render_template("auth/register.html")

        user: Any = User(
            email=email, username=username, password=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()

        login_user(user)
        return redirect(url_for("main.index"))

    return render_template("auth/register.html")
