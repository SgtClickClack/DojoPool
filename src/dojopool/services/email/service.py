"""Email service module."""

import time
from typing import Optional
from flask import current_app
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

# Constants
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds

class EmailError(Exception):
    """Custom exception for email-related errors."""
    pass

class EmailTemplate:
    """Email template management."""
    
    VERIFICATION = "verification"
    PASSWORD_RESET = "password_reset"
    WELCOME = "welcome"
    MATCH_CONFIRMATION = "match_confirmation"
    MATCH_REMINDER = "match_reminder"
    MATCH_CANCELLATION = "match_cancellation"
    CUSTOM = "custom"
    
    @staticmethod
    def render(template_type: str, **context) -> str:
        """Render email template with context."""
        if template_type == EmailTemplate.CUSTOM:
            template_html = context.get('template_html', '')
            return template_html.format(**context)
            
        templates = {
            EmailTemplate.VERIFICATION: """
                <h1>Welcome to DojoPool!</h1>
                <p>Hi {username},</p>
                <p>Please verify your email by clicking the link below:</p>
                <a href="{verification_link}">Verify Email</a>
            """,
            EmailTemplate.PASSWORD_RESET: """
                <h1>Reset Your Password</h1>
                <p>Hi {username},</p>
                <p>Click the link below to reset your password:</p>
                <a href="{reset_link}">Reset Password</a>
            """,
            EmailTemplate.WELCOME: """
                <h1>Welcome to DojoPool!</h1>
                <p>Hi {username},</p>
                <p>Thank you for joining DojoPool. Start exploring now!</p>
            """,
            EmailTemplate.MATCH_CONFIRMATION: """
                <h1>Match Confirmed</h1>
                <p>Your match at {location_name} has been confirmed.</p>
                <p>Date: {match_date}</p>
                <p>Time: {match_time}</p>
            """,
            EmailTemplate.MATCH_REMINDER: """
                <h1>Match Reminder</h1>
                <p>Don't forget about your upcoming match!</p>
                <p>Location: {location_name}</p>
                <p>Date: {match_date}</p>
                <p>Time: {match_time}</p>
            """,
            EmailTemplate.MATCH_CANCELLATION: """
                <h1>Match Cancelled</h1>
                <p>Unfortunately, your match has been cancelled.</p>
                <p>Reason: {reason}</p>
            """
        }
        
        template = templates.get(template_type)
        if not template:
            raise ValueError(f"Invalid template type: {template_type}")
            
        return template.format(**context)

class EmailService:
    """Email service using SendGrid."""
    
    def __init__(self, api_key: Optional[str] = None, sender_email: Optional[str] = None):
        """Initialize email service."""
        self.api_key = api_key
        self.sender_email = sender_email
        self.client = None
        
    def init_app(self, app):
        """Initialize with Flask application."""
        self.api_key = self.api_key or app.config.get('SENDGRID_API_KEY')
        self.sender_email = self.sender_email or app.config.get('MAIL_DEFAULT_SENDER')
        if self.api_key:
            self.client = SendGridAPIClient(self.api_key)
    
    def is_configured(self) -> bool:
        """Check if email service is properly configured."""
        return bool(self.api_key and self.sender_email and self.client)
    
    def _validate_email(self, email: str) -> None:
        """Validate email address format."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError(f"Invalid email address: {email}")
    
    def _send(self, to_email: str, subject: str, content: str, retries: int = MAX_RETRIES) -> bool:
        """Send email with retry mechanism."""
        if not self.is_configured():
            raise EmailError("Email service not properly configured")
            
        self._validate_email(to_email)
        
        message = Mail(
            from_email=self.sender_email,
            to_emails=to_email,
            subject=subject,
            html_content=content
        )
        
        for attempt in range(retries):
            try:
                self.client.send(message)
                return True
            except Exception as e:
                if attempt == retries - 1:
                    raise EmailError(f"Failed to send email after {retries} attempts: {str(e)}")
                time.sleep(RETRY_DELAY)
        
        return False
    
    def send_verification_email(self, user) -> bool:
        """Send email verification link."""
        try:
            content = EmailTemplate.render(
                EmailTemplate.VERIFICATION,
                username=user.username,
                verification_link=f"http://localhost:5000/auth/verify/{user.get_verification_token()}"
            )
            return self._send(
                user.email,
                "Verify Your Email - DojoPool",
                content
            )
        except Exception as e:
            raise EmailError(f"Failed to send verification email: {str(e)}")
    
    def send_password_reset_email(self, user, token: str) -> bool:
        """Send password reset link."""
        try:
            content = EmailTemplate.render(
                EmailTemplate.PASSWORD_RESET,
                username=user.username,
                reset_link=f"http://localhost:5000/auth/reset-password/{token}"
            )
            return self._send(
                user.email,
                "Reset Your Password - DojoPool",
                content
            )
        except Exception as e:
            raise EmailError(f"Failed to send password reset email: {str(e)}")
    
    def send_welcome_email(self, user) -> bool:
        """Send welcome email to new user."""
        try:
            content = EmailTemplate.render(
                EmailTemplate.WELCOME,
                username=user.username
            )
            return self._send(
                user.email,
                "Welcome to DojoPool!",
                content
            )
        except Exception as e:
            raise EmailError(f"Failed to send welcome email: {str(e)}")
    
    def send_match_confirmation_email(self, match) -> bool:
        """Send match confirmation email to both players."""
        try:
            content = EmailTemplate.render(
                EmailTemplate.MATCH_CONFIRMATION,
                location_name=match.location.name,
                match_date=match.scheduled_time.strftime("%Y-%m-%d"),
                match_time=match.scheduled_time.strftime("%H:%M")
            )
            
            # Send to both players
            success = all([
                self._send(
                    match.player1.email,
                    "Match Confirmation - DojoPool",
                    content
                ),
                self._send(
                    match.player2.email,
                    "Match Confirmation - DojoPool",
                    content
                )
            ])
            return success
        except Exception as e:
            raise EmailError(f"Failed to send match confirmation email: {str(e)}")
    
    def send_match_reminder_email(self, match) -> bool:
        """Send match reminder email to both players."""
        try:
            content = EmailTemplate.render(
                EmailTemplate.MATCH_REMINDER,
                location_name=match.location.name,
                match_date=match.scheduled_time.strftime("%Y-%m-%d"),
                match_time=match.scheduled_time.strftime("%H:%M")
            )
            
            # Send to both players
            success = all([
                self._send(
                    match.player1.email,
                    "Match Reminder - DojoPool",
                    content
                ),
                self._send(
                    match.player2.email,
                    "Match Reminder - DojoPool",
                    content
                )
            ])
            return success
        except Exception as e:
            raise EmailError(f"Failed to send match reminder email: {str(e)}")
    
    def send_match_cancellation_email(self, match, reason: str) -> bool:
        """Send match cancellation email to both players."""
        try:
            content = EmailTemplate.render(
                EmailTemplate.MATCH_CANCELLATION,
                reason=reason
            )
            
            # Send to both players
            success = all([
                self._send(
                    match.player1.email,
                    "Match Cancelled - DojoPool",
                    content
                ),
                self._send(
                    match.player2.email,
                    "Match Cancelled - DojoPool",
                    content
                )
            ])
            return success
        except Exception as e:
            raise EmailError(f"Failed to send match cancellation email: {str(e)}")

def send_email(to_email, subject, html_content):
    """Send an email using SendGrid.
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        html_content (str): HTML content of the email
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        sg = SendGridAPIClient(current_app.config['SENDGRID_API_KEY'])
        message = Mail(
            from_email=current_app.config['MAIL_DEFAULT_SENDER'],
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
        return False

def send_verification_email(user, token):
    """Send email verification link to user.
    
    Args:
        user: User model instance
        token: Verification token
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    verification_url = f"{current_app.config['SITE_URL']}/verify/{token}"
    html_content = f"""
    <h1>Welcome to DojoPool!</h1>
    <p>Please click the link below to verify your email address:</p>
    <p><a href="{verification_url}">{verification_url}</a></p>
    <p>If you did not sign up for DojoPool, please ignore this email.</p>
    """
    return send_email(
        user.email,
        "Verify your DojoPool email",
        html_content
    )

def send_password_reset_email(user, token):
    """Send password reset link to user.
    
    Args:
        user: User model instance
        token: Reset token
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    reset_url = f"{current_app.config['SITE_URL']}/reset-password/{token}"
    html_content = f"""
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <p><a href="{reset_url}">{reset_url}</a></p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>This link will expire in 1 hour.</p>
    """
    return send_email(
        user.email,
        "Reset your DojoPool password",
        html_content
    )