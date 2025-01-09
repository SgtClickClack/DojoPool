"""Unit tests for email service functionality."""
import pytest
from unittest.mock import patch, MagicMock
from dojopool.email.service import EmailService, EmailTemplate, EmailError
from dojopool.models import User

@pytest.fixture
def email_service():
    """Create an email service instance for testing."""
    service = EmailService(
        api_key="test_key",
        sender_email="test@example.com"
    )
    return service

@pytest.fixture
def test_user():
    """Create a test user instance."""
    return User(
        username="test_user",
        email="test@example.com"
    )

def test_email_service_initialization(email_service):
    """Test email service initialization."""
    assert email_service.api_key == "test_key"
    assert email_service.sender_email == "test@example.com"
    assert email_service.is_configured()

def test_email_template_rendering():
    """Test email template rendering."""
    # Test verification template
    context = {
        "username": "test_user",
        "verification_link": "http://test.com/verify"
    }
    content = EmailTemplate.render(EmailTemplate.VERIFICATION, **context)
    assert "test_user" in content
    assert "http://test.com/verify" in content
    
    # Test password reset template
    context = {
        "username": "test_user",
        "reset_link": "http://test.com/reset"
    }
    content = EmailTemplate.render(EmailTemplate.PASSWORD_RESET, **context)
    assert "test_user" in content
    assert "http://test.com/reset" in content

def test_email_validation(email_service):
    """Test email address validation."""
    # Valid email
    email_service._validate_email("test@example.com")
    
    # Invalid emails
    with pytest.raises(ValueError):
        email_service._validate_email("invalid_email")
    with pytest.raises(ValueError):
        email_service._validate_email("@example.com")
    with pytest.raises(ValueError):
        email_service._validate_email("test@.com")

def test_send_verification_email(email_service, test_user):
    """Test sending verification email."""
    with patch.object(email_service, '_send') as mock_send:
        mock_send.return_value = True
        assert email_service.send_verification_email(test_user)
        mock_send.assert_called_once()

def test_send_password_reset_email(email_service, test_user):
    """Test sending password reset email."""
    with patch.object(email_service, '_send') as mock_send:
        mock_send.return_value = True
        assert email_service.send_password_reset_email(test_user, "test_token")
        mock_send.assert_called_once()

def test_send_welcome_email(email_service, test_user):
    """Test sending welcome email."""
    with patch.object(email_service, '_send') as mock_send:
        mock_send.return_value = True
        assert email_service.send_welcome_email(test_user)
        mock_send.assert_called_once()

def test_send_match_confirmation_email(email_service):
    """Test sending match confirmation email."""
    match = MagicMock()
    match.location.name = "Test Location"
    match.scheduled_time.strftime.return_value = "2023-12-17"
    match.player1.email = "player1@example.com"
    match.player2.email = "player2@example.com"
    
    with patch.object(email_service, '_send') as mock_send:
        mock_send.return_value = True
        assert email_service.send_match_confirmation_email(match)
        assert mock_send.call_count == 2

def test_send_match_reminder_email(email_service):
    """Test sending match reminder email."""
    match = MagicMock()
    match.location.name = "Test Location"
    match.scheduled_time.strftime.return_value = "2023-12-17"
    match.player1.email = "player1@example.com"
    match.player2.email = "player2@example.com"
    
    with patch.object(email_service, '_send') as mock_send:
        mock_send.return_value = True
        assert email_service.send_match_reminder_email(match)
        assert mock_send.call_count == 2

def test_send_match_cancellation_email(email_service):
    """Test sending match cancellation email."""
    match = MagicMock()
    match.player1.email = "player1@example.com"
    match.player2.email = "player2@example.com"
    
    with patch.object(email_service, '_send') as mock_send:
        mock_send.return_value = True
        assert email_service.send_match_cancellation_email(match, "Test reason")
        assert mock_send.call_count == 2

def test_retry_mechanism(email_service, test_user):
    """Test email sending retry mechanism."""
    with patch.object(email_service, '_send') as mock_send:
        # Simulate failures then success
        mock_send.side_effect = [
            Exception("First attempt failed"),
            Exception("Second attempt failed"),
            True
        ]
        assert email_service.send_verification_email(test_user)
        assert mock_send.call_count == 3

def test_max_retries_exceeded(email_service, test_user):
    """Test maximum retries exceeded."""
    with patch.object(email_service, '_send') as mock_send:
        # Simulate all attempts failing
        mock_send.side_effect = Exception("Failed")
        with pytest.raises(EmailError):
            email_service.send_verification_email(test_user)
        assert mock_send.call_count == 3  # Default MAX_RETRIES is 3

def test_unconfigured_service():
    """Test using unconfigured email service."""
    service = EmailService()  # No API key or sender email
    with pytest.raises(EmailError):
        service._send("test@example.com", "Test", "Content") 