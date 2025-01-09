"""Email module initialization."""

from flask_mail import Mail
from .service import EmailService, EmailTemplate, EmailError

# Initialize Flask-Mail
mail = Mail()

# Create global email service instance
email_service = None

def init_app(app):
    """Initialize email module with Flask app."""
    global email_service
    
    mail.init_app(app)
    
    # Configure email service
    app.config.setdefault('SENDGRID_API_KEY', None)
    app.config.setdefault('MAIL_DEFAULT_SENDER', 'DojoPool <noreply@dojopool.com>')
    
    # Initialize email service
    email_service = EmailService(app)

def get_email_service():
    """Get the email service instance."""
    global email_service
    if email_service is None:
        email_service = EmailService()
    return email_service

def send_verification_email(user):
    """Send verification email to user."""
    return get_email_service().send_verification_email(user)

def send_password_reset_email(user, token):
    """Send password reset email to user."""
    return get_email_service().send_password_reset_email(user, token)

def send_welcome_email(user):
    """Send welcome email to user."""
    return get_email_service().send_welcome_email(user)

def send_match_confirmation_email(match):
    """Send match confirmation email."""
    return get_email_service().send_match_confirmation_email(match)

def send_match_reminder_email(match):
    """Send match reminder email."""
    return get_email_service().send_match_reminder_email(match)

def send_match_cancellation_email(match, reason):
    """Send match cancellation email."""
    return get_email_service().send_match_cancellation_email(match, reason)

__all__ = [
    'mail',
    'init_app',
    'get_email_service',
    'EmailService',
    'EmailTemplate',
    'EmailError',
    'send_verification_email',
    'send_password_reset_email',
    'send_welcome_email',
    'send_match_confirmation_email',
    'send_match_reminder_email',
    'send_match_cancellation_email'
] 