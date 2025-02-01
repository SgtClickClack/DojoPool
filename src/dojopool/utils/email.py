"""Email utilities module.

This module provides utility functions for sending emails with proper
templates and error handling.
"""

from threading import Thread
from typing import Any, List, Union

from flask import current_app, render_template
from flask_mail import Message

from dojopool.core.extensions import mail


def send_async_email(app, msg: Message) -> None:
    """Send email asynchronously.

    Args:
        app: Flask application context.
        msg: Email message to send.
    """
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            current_app.logger.error(f"Failed to send email: {e}")


def send_email(to: Union[str, List[str]], subject: str, template: str, **kwargs: Any) -> None:
    """Send an email using a template.

    Args:
        to: Recipient email address(es).
        subject: Email subject.
        template: Template path without extension.
        **kwargs: Template variables.
    """
    app = current_app._get_current_object()

    # Create message
    msg = Message(
        subject=f'{app.config["MAIL_SUBJECT_PREFIX"]} {subject}',
        recipients=[to] if isinstance(to, str) else to,
        sender=app.config["MAIL_DEFAULT_SENDER"],
    )

    # Render templates
    msg.body = render_template(f"{template}.txt", **kwargs)
    msg.html = render_template(f"{template}.html", **kwargs)

    # Send asynchronously
    if not app.config["TESTING"]:
        Thread(target=send_async_email, args=(app, msg)).start()
    else:
        mail.send(msg)


def send_password_reset_email(user) -> None:
    """Send password reset email.

    Args:
        user: User to send email to.
    """
    token = user.generate_auth_token(expires_in=3600)
    send_email(
        to=user.email,
        subject="Reset Your Password",
        template="auth/email/reset_password",
        user=user,
        token=token,
    )


def send_email_change_email(user, new_email: str) -> None:
    """Send email change confirmation email.

    Args:
        user: User changing email.
        new_email: New email address.
    """
    token = user.generate_auth_token(expires_in=3600, new_email=new_email)
    send_email(
        to=new_email,
        subject="Confirm Your New Email",
        template="auth/email/change_email",
        user=user,
        token=token,
    )


def send_verification_email(user) -> None:
    """Send email verification email.

    Args:
        user: User to verify.
    """
    token = user.generate_auth_token(expires_in=86400)  # 24 hours
    send_email(
        to=user.email,
        subject="Verify Your Email",
        template="auth/email/verify_email",
        user=user,
        token=token,
    )


def send_welcome_email(user) -> None:
    """Send welcome email to new user.

    Args:
        user: New user.
    """
    send_email(
        to=user.email, subject="Welcome to DojoPool", template="auth/email/welcome", user=user
    )
