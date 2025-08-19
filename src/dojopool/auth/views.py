"""Authentication views module.

This module contains views for user authentication, registration,
and account management.
"""

from datetime import datetime
from typing import Union

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.wrappers import Response

from dojopool.auth.decorators import verified_required
from dojopool.auth.forms import (
    ChangePasswordForm,
    EmailChangeForm,
    LoginForm,
    PasswordResetForm,
    PasswordResetRequestForm,
    RegistrationForm,
)
from dojopool.models.role import Role
from dojopool.models.user import User
from dojopool.utils.email import send_email
from dojopool.utils.security import generate_token, verify_token

# Create blueprint
auth = Blueprint("auth", __name__)


@auth.route("/login", methods=["GET", "POST"])
def login() -> Union[str, Response]:
    """Handle user login.

    Returns:
        Union[str, Response]: Response object or rendered template.
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    form = LoginForm()
    if form.validate_on_submit():
        # Check if input is email or username
        if "@" in form.username.data:
            user = User.get_by_email(form.username.data.lower())
        else:
            user = User.get_by_username(form.username.data.lower())

        if user is None or not user.check_password(form.password.data):
            flash("Invalid username/email or password", "error")
            return render_template("auth/login.html", form=form)

        if user.is_locked():
            flash("Your account is temporarily locked. Please try again later.", "error")
            return render_template("auth/login.html", form=form)

        # Log in user
        login_user(user, remember=form.remember_me.data)
        user.record_login(success=True)

        # Redirect to next page or index
        next_page = request.args.get("next")
        if not next_page or not next_page.startswith("/"):
            next_page = url_for("main.index")

        return redirect(next_page)

    return render_template("auth/login.html", form=form)


@auth.route("/logout")
@login_required
def logout() -> Response:
    """Handle user logout.

    Returns:
        Response: Redirect response.
    """
    current_user.update_last_seen()
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("main.index"))


@auth.route("/register", methods=["GET", "POST"])
def register() -> Union[str, Response]:
    """Handle user registration.

    Returns:
        Union[str, Response]: Response object or rendered template.
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data.lower(),
            email=form.email.data.lower(),
            is_active=True,
            is_verified=False,
        )
        user.password = form.password.data

        # Add default user role
        user_role = Role.get_by_name(Role.USER)
        if user_role:
            user.roles.append(user_role)

        user.save()

        # Send verification email
        token = generate_token(user.id, "verify_email")
        send_email(
            to=user.email,
            subject="Verify Your Email",
            template="auth/email/verify_email",
            user=user,
            token=token,
        )

        flash("A verification email has been sent to your email address.", "info")
        return redirect(url_for("auth.login"))

    return render_template("auth/register.html", form=form)


@auth.route("/verify-email/<token>")
def verify_email(token: str) -> Response:
    """Verify user's email address.

    Args:
        token: Verification token.

    Returns:
        Response: Redirect response.
    """
    if current_user.is_authenticated and current_user.is_verified:
        return redirect(url_for("main.index"))

    user_id = verify_token(token, "verify_email")
    if not user_id:
        flash("Invalid or expired verification link.", "error")
        return redirect(url_for("main.index"))

    user = User.get_by_id(user_id)
    if user is None:
        flash("Invalid verification link.", "error")
        return redirect(url_for("main.index"))

    if user.is_verified:
        flash("Email already verified.", "info")
        return redirect(url_for("auth.login"))

    user.is_verified = True
    user.email_verified_at = datetime.utcnow()
    user.save()

    flash("Your email has been verified. You can now log in.", "success")
    return redirect(url_for("auth.login"))


@auth.route("/reset-password", methods=["GET", "POST"])
def reset_password_request() -> Union[str, Response]:
    """Handle password reset request.

    Returns:
        Union[str, Response]: Response object or rendered template.
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    form = PasswordResetRequestForm()
    if form.validate_on_submit():
        user = User.get_by_email(form.email.data.lower())
        if user:
            token = generate_token(user.id, "reset_password")
            send_email(
                to=user.email,
                subject="Reset Your Password",
                template="auth/email/reset_password",
                user=user,
                token=token,
            )
        flash(
            "If an account exists with that email, a password reset link " "has been sent.", "info"
        )
        return redirect(url_for("auth.login"))

    return render_template("auth/reset_password_request.html", form=form)


@auth.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token: str) -> Union[str, Response]:
    """Handle password reset.

    Args:
        token: Reset token.

    Returns:
        Union[str, Response]: Response object or rendered template.
    """
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    user_id = verify_token(token, "reset_password")
    if not user_id:
        flash("Invalid or expired reset link.", "error")
        return redirect(url_for("main.index"))

    user = User.get_by_id(user_id)
    if user is None:
        flash("Invalid reset link.", "error")
        return redirect(url_for("main.index"))

    form = PasswordResetForm()
    if form.validate_on_submit():
        user.password = form.password.data
        user.save()
        flash("Your password has been reset.", "success")
        return redirect(url_for("auth.login"))

    return render_template("auth/reset_password.html", form=form)


@auth.route("/change-password", methods=["GET", "POST"])
@login_required
@verified_required
def change_password() -> Union[str, Response]:
    """Handle password change.

    Returns:
        Union[str, Response]: Response object or rendered template.
    """
    form = ChangePasswordForm()
    if form.validate_on_submit():
        if not current_user.check_password(form.old_password.data):
            flash("Invalid current password.", "error")
            return render_template("auth/change_password.html", form=form)

        current_user.password = form.password.data
        current_user.save()
        flash("Your password has been updated.", "success")
        return redirect(url_for("main.index"))

    return render_template("auth/change_password.html", form=form)


@auth.route("/change-email", methods=["GET", "POST"])
@login_required
@verified_required
def change_email_request() -> Union[str, Response]:
    """Handle email change request.

    Returns:
        Union[str, Response]: Response object or rendered template.
    """
    form = EmailChangeForm()
    if form.validate_on_submit():
        if not current_user.check_password(form.password.data):
            flash("Invalid password.", "error")
            return render_template("auth/change_email.html", form=form)

        token = generate_token(current_user.id, "change_email", new_email=form.email.data.lower())
        send_email(
            to=form.email.data.lower(),
            subject="Confirm Your New Email",
            template="auth/email/change_email",
            user=current_user,
            token=token,
        )
        flash("A confirmation link has been sent to your new email address.", "info")
        return redirect(url_for("main.index"))

    return render_template("auth/change_email.html", form=form)


@auth.route("/change-email/<token>")
@login_required
@verified_required
def change_email(token: str) -> Response:
    """Handle email change confirmation.

    Args:
        token: Confirmation token.

    Returns:
        Response: Redirect response.
    """
    result = verify_token(token, "change_email")
    if not result or "new_email" not in result:
        flash("Invalid or expired confirmation link.", "error")
        return redirect(url_for("main.index"))

    if User.get_by_email(result["new_email"]):
        flash("Email already registered.", "error")
        return redirect(url_for("main.index"))

    current_user.email = result["new_email"]
    current_user.save()
    flash("Your email address has been updated.", "success")
    return redirect(url_for("main.index"))
