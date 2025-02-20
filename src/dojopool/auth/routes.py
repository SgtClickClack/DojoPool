"""Authentication routes module."""

from typing import Any, Dict, List, Optional, Tuple, Union

from flask import (
    Blueprint,
    Response,
    current_app,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_login import current_user, login_required, login_user, logout_user
from flask_wtf import FlaskForm
from requests_oauthlib import OAuth2Session
from werkzeug.security import check_password_hash, generate_password_hash
from wtforms import BooleanField, PasswordField, StringField
from wtforms.validators import DataRequired, Email, Length

from ..core.extensions import db
from ..models.user import User
from .oauth import GoogleOAuth

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


class LoginForm(FlaskForm):
    """Login form."""

    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    remember_me = BooleanField("Remember Me")


class RegisterForm(FlaskForm):
    """Registration form."""

    username = StringField(
        "Username", validators=[DataRequired(), Length(min=3, max=64)]
    )
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=8)])
    confirm_password = PasswordField(
        "Confirm Password", validators=[DataRequired(), Length(min=8)]
    )


@auth_bp.route("/register", methods=["GET", "POST"])
def register() -> Union[str, Response]:
    """Handle registration requests."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    form = RegisterForm()
    if form.validate_on_submit():
        if form.password.data != form.confirm_password.data:
            flash("Passwords do not match", "error")
            return render_template("auth/register.html", form=form)

        if User.query.filter_by(email=form.email.data).first():
            flash("Email already registered", "error")
            return render_template("auth/register.html", form=form)

        if User.query.filter_by(username=form.username.data).first():
            flash("Username already taken", "error")
            return render_template("auth/register.html", form=form)

        user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=generate_password_hash(form.password.data),
        )
        db.session.add(user)
        db.session.commit()

        flash("Registration successful. Please log in.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/register.html", form=form)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """Handle login requests."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get("next")
            return redirect(next_page or url_for("main.index"))
        flash("Invalid email or password", "error")

    return render_template("auth/login.html", form=form)


@auth_bp.route("/logout")
@login_required
def logout():
    """Handle logout requests."""
    logout_user()
    flash("You have been logged out", "info")
    return redirect(url_for("main.index"))


@auth_bp.route("/google/login")
def google_login():
    """Handle Google login requests."""
    google = GoogleOAuth()
    auth_url = google.get_auth_url()
    if not auth_url:
        flash("Failed to get Google authorization URL", "error")
        return redirect(url_for("auth.login"))
    return redirect(auth_url)


@auth_bp.route("/google/callback")
def google_callback() -> Response:
    """Handle Google OAuth callback."""
    google = GoogleOAuth()
    code = request.args.get("code")
    if not code:
        flash("Failed to get authorization code from Google", "error")
        return redirect(url_for("auth.login"))

    try:
        token_url = google.get_token_url()
        if not token_url:
            raise ValueError("Failed to get token URL")

        token_response = google.prepare_token_request(
            request.url, redirect_url=url_for("auth.google_callback", _external=True)
        )
        google.parse_token_response(token_response)

        userinfo_response = google.prepare_userinfo_request()
        if not userinfo_response:
            raise ValueError("Failed to get user info")

        user = User.query.filter_by(email=userinfo_response["email"]).first()
        if not user:
            user = User(
                email=userinfo_response["email"],
                username=userinfo_response.get("name", "").replace(" ", "_").lower(),
                password_hash=generate_password_hash(os.urandom(24).hex()),
            )
            db.session.add(user)
            db.session.commit()

        login_user(user)
        return redirect(url_for("main.index"))

    except Exception as e:
        current_app.logger.error(f"Google OAuth error: {str(e)}")
        flash("Failed to authenticate with Google", "error")
        return redirect(url_for("auth.login"))


@auth_bp.route("/forgot-password", methods=["GET", "POST"])
def forgot_password() -> Union[str, Response]:
    """Handle forgot password requests."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        email = request.form.get("email")
        if not email:
            flash("Please enter your email address", "error")
            return render_template("auth/forgot_password.html")

        user = User.query.filter_by(email=email).first()
        if user:
            # TODO: Implement password reset email
            flash("Password reset instructions sent to your email", "info")
            return redirect(url_for("auth.login"))
        else:
            flash("Email address not found", "error")

    return render_template("auth/forgot_password.html")
