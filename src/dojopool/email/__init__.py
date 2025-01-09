"""Email module.

This module provides email functionality.
"""

from flask_mail import Mail, Message
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import jinja2
import os

mail = Mail()


@dataclass
class EmailTemplate:
    """Email template data."""

    name: str
    subject: str
    html: str
    text: str = None


class EmailError(Exception):
    """Email service error."""

    pass


class EmailService:
    """Email service for sending emails."""

    def __init__(self):
        """Initialize email service."""
        self.templates_dir = os.path.join(os.path.dirname(__file__), "templates")
        self.template_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(self.templates_dir), autoescape=True
        )
        self.templates: Dict[str, EmailTemplate] = {}
        self._load_templates()

    def _load_templates(self) -> None:
        """Load email templates."""
        for template_name in os.listdir(self.templates_dir):
            if template_name.endswith(".html"):
                name = template_name[:-5]  # Remove .html extension
                html_template = self.template_env.get_template(template_name)
                text_template = None

                # Try to load text version
                text_path = os.path.join(self.templates_dir, f"{name}.txt")
                if os.path.exists(text_path):
                    text_template = self.template_env.get_template(f"{name}.txt")

                self.templates[name] = EmailTemplate(
                    name=name,
                    subject=name.replace("_", " ").title(),
                    html=html_template.render,
                    text=text_template.render if text_template else None,
                )

    def send_email(
        self,
        to: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        """Send an email.

        Args:
            to: Recipient email address
            subject: Email subject
            template_name: Template name
            context: Template context
            cc: CC recipients
            bcc: BCC recipients
            attachments: List of attachments

        Raises:
            EmailError: If email cannot be sent
        """
        if template_name not in self.templates:
            raise EmailError(f"Template {template_name} not found")

        template = self.templates[template_name]

        try:
            msg = Message(subject=subject, recipients=[to], cc=cc, bcc=bcc)

            # Render templates
            msg.html = template.html(**context)
            if template.text:
                msg.body = template.text(**context)

            # Add attachments
            if attachments:
                for attachment in attachments:
                    msg.attach(**attachment)

            mail.send(msg)
        except Exception as e:
            raise EmailError(f"Failed to send email: {str(e)}")

    def send_welcome_email(self, to: str, username: str) -> None:
        """Send welcome email.

        Args:
            to: Recipient email address
            username: Username

        Raises:
            EmailError: If email cannot be sent
        """
        self.send_email(
            to=to,
            subject="Welcome to DojoPool!",
            template_name="welcome",
            context={"username": username},
        )

    def send_password_reset_email(self, to: str, reset_token: str) -> None:
        """Send password reset email.

        Args:
            to: Recipient email address
            reset_token: Password reset token

        Raises:
            EmailError: If email cannot be sent
        """
        self.send_email(
            to=to,
            subject="Password Reset Request",
            template_name="password_reset",
            context={"reset_token": reset_token},
        )

    def send_verification_email(self, to: str, verification_token: str) -> None:
        """Send email verification email.

        Args:
            to: Recipient email address
            verification_token: Email verification token

        Raises:
            EmailError: If email cannot be sent
        """
        self.send_email(
            to=to,
            subject="Verify Your Email",
            template_name="email_verification",
            context={"verification_token": verification_token},
        )


email_service = EmailService()

__all__ = ["mail", "email_service", "EmailService", "EmailTemplate", "EmailError"]
