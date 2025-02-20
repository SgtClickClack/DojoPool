"""Email functionality for the application."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import current_app, render_template
from flask.typing import ResponseReturnValue
from flask_mail import Message
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.extensions import mail


def send_email(
    subject: str, recipients: List[str], template: str, **kwargs: Any
) -> None:
    """Send an email using Flask-Mail.

    Args:
        subject (str): The subject of the email
        recipients (list): List of recipient email addresses
        template (str): The template to use for the email body
        **kwargs: Additional arguments to pass to the template
    """
    msg: Message = Message(
        subject=subject,
        recipients=recipients,
        sender=current_app.config["MAIL_DEFAULT_SENDER"],
    )
    msg.html = render_template(f"email/{template}.html", **kwargs)
    msg.body = render_template(f"email/{template}.txt", **kwargs)
    mail.send(msg)


def send_reset_email(user_email: str, reset_url: str) -> None:
    """Send a password reset email.

    Args:
        user_email (str): The user's email address
        reset_url (str): The password reset URL
    """
    send_email(
        subject="Reset Your Password",
        recipients=[user_email],
        template="reset_password",
        reset_url=reset_url,
    )
