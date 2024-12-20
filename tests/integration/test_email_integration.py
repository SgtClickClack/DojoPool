"""Integration tests for SendGrid email functionality."""
import pytest
from src.email.service import EmailService, EmailError
from src.models import User
from unittest.mock import patch

def test_email_service_integration(app):
    """Test the email service integration with SendGrid."""
    with app.app_context():
        email_service = EmailService()
        email_service.init_app(app)
        
        # Create test user
        user = User(
            username="test_user",
            email="test@example.com"
        )
        
        # Test verification email
        with patch('sendgrid.SendGridAPIClient.send') as mock_send:
            mock_send.return_value.status_code = 202
            assert email_service.send_verification_email(user)
            
        # Test password reset email
        with patch('sendgrid.SendGridAPIClient.send') as mock_send:
            mock_send.return_value.status_code = 202
            assert email_service.send_password_reset_email(user, "test_token")
            
        # Test welcome email
        with patch('sendgrid.SendGridAPIClient.send') as mock_send:
            mock_send.return_value.status_code = 202
            assert email_service.send_welcome_email(user)

def test_email_service_error_handling(app):
    """Test error handling in email service integration."""
    with app.app_context():
        email_service = EmailService()
        email_service.init_app(app)
        
        user = User(
            username="test_user",
            email="test@example.com"
        )
        
        # Test API error handling
        with patch('sendgrid.SendGridAPIClient.send') as mock_send:
            mock_send.side_effect = Exception("API Error")
            with pytest.raises(EmailError):
                email_service.send_verification_email(user)

def test_email_service_retry_mechanism(app):
    """Test the retry mechanism in email service."""
    with app.app_context():
        email_service = EmailService()
        email_service.init_app(app)
        
        user = User(
            username="test_user",
            email="test@example.com"
        )
        
        # Test successful retry
        with patch('sendgrid.SendGridAPIClient.send') as mock_send:
            mock_send.side_effect = [Exception("Temporary error"), None]
            assert email_service.send_verification_email(user)
            assert mock_send.call_count == 2 