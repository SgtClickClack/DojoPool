"""Authentication views and routes."""

from typing import cast

from flask import Blueprint, flash, redirect, render_template, request, url_for, current_app
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

# Split import for clarity
from dojopool.core.security.tokens import generate_confirmation_token
from dojopool.core.security.tokens import verify_confirmation_token
from dojopool.core.extensions import db
from dojopool.models.user import User
from dojopool.utils.email import send_email
from dojopool.forms.auth import LoginForm
from requests_oauthlib import OAuth2Session
from dojopool.auth.oauth import GoogleOAuth

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

    form = LoginForm()
    if request.method == "POST" and form.validate_on_submit():
        email = form.email.data
        password = form.password.data
        remember = form.remember_me.data

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user, remember=remember)
            next_page = request.args.get("next")
            return redirect(next_page or url_for("main.index"))

        flash("Invalid email or password", "error")

    return render_template("auth/login.html", form=form)


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

            # --- ONBOARDING GLUE: Create wallet and redirect to avatar setup ---
            from dojopool.coins.dojo_coins import DojoCoinsManager
            wallet_manager = DojoCoinsManager()
            wallet_manager.create_wallet(user_id)

            flash(
                "Registration successful. Please create your avatar.",
                "success",
            )
            return redirect(url_for("features.avatar_view"))

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


@bp.route("/google-login")
def google_login():
    """Initiate Google OAuth login."""
    google = GoogleOAuth()
    auth_url = google.get_auth_url()
    if not auth_url:
        flash("Failed to get Google authorization URL. Please try again later.", "error")
        return redirect(url_for("auth.login"))
    return redirect(auth_url)


@bp.route("/google-callback")
def google_callback():
    """Google OAuth callback route."""
    google = GoogleOAuth()
    code = request.args.get("code")
    if not code:
        flash("Authentication failed. Please try again.", "error")
        return redirect(url_for("auth.login"))
    try:
        oauth = OAuth2Session(
            google.client_id,
            redirect_uri=url_for("auth.google_callback", _external=True),
            scope=["openid", "email", "profile"],
        )
        token_url = google.get_token_url()
        if not token_url:
            raise Exception("Failed to get token URL")
        oauth.fetch_token(
            token_url, client_secret=google.client_secret, authorization_response=request.url
        )
        userinfo_url = google.get_userinfo_url()
        if not userinfo_url:
            raise Exception("Failed to get user info URL")
        userinfo = oauth.get(userinfo_url).json()
        if not userinfo.get("email_verified"):
            flash("Google account email is not verified.", "error")
            return redirect(url_for("auth.login"))
        email = userinfo["email"]
        userinfo.get("given_name", "")
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                username=email.split("@")[0],
                email=email,
                password="",  # No password for Google users
            )
            db.session.add(user)
            db.session.commit()
        login_user(user, remember=True)
        return redirect(url_for("main.index"))
    except Exception as e:
        current_app.logger.error(f"Google OAuth error: {str(e)}")
        flash("Authentication failed. Please try again.", "error")
        return redirect(url_for("auth.login"))
