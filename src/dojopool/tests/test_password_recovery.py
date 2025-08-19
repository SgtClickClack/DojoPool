import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from dojopool.services.auth.password_recovery import PasswordRecoveryService

@pytest.fixture
def mock_mail():
    return Mock()

@pytest.fixture
def service(mock_mail):
    return PasswordRecoveryService(mock_mail)

def test_generate_recovery_token(service):
    email = "test@example.com"
    token = service.generate_recovery_token(email)
    
    assert token in service.recovery_tokens
    assert service.recovery_tokens[token]['email'] == email
    assert not service.recovery_tokens[token]['used']
    assert isinstance(service.recovery_tokens[token]['created_at'], datetime)

def test_validate_token(service):
    email = "test@example.com"
    token = service.generate_recovery_token(email)
    
    # Test valid token
    assert service.validate_token(token) == email
    
    # Test invalid token
    assert service.validate_token("invalid_token") is None
    
    # Test used token
    service.mark_token_used(token)
    assert service.validate_token(token) is None

def test_token_expiry(service):
    email = "test@example.com"
    token = service.generate_recovery_token(email)
    
    # Test expired token
    service.recovery_tokens[token]['created_at'] = datetime.utcnow() - timedelta(hours=25)
    assert service.validate_token(token) is None

def test_send_recovery_email(service, mock_mail):
    email = "test@example.com"
    token = service.generate_recovery_token(email)
    
    with patch('flask.current_app.config', {
        'FRONTEND_URL': 'http://localhost:3000',
        'MAIL_DEFAULT_SENDER': 'noreply@dojopool.com'
    }):
        service.send_recovery_email(email, token)
        
        # Verify email was sent
        mock_mail.send.assert_called_once()
        
        # Verify email content
        msg = mock_mail.send.call_args[0][0]
        assert msg.subject == "Password Recovery - DojoPool"
        assert msg.recipients == [email]
        assert token in msg.html
        assert token in msg.text

def test_reset_password(service):
    email = "test@example.com"
    token = service.generate_recovery_token(email)
    new_password = "NewSecurePassword123!"
    
    # Test successful password reset
    assert service.reset_password(token, new_password) is True
    
    # Test invalid token
    assert service.reset_password("invalid_token", new_password) is False
    
    # Test used token
    assert service.reset_password(token, new_password) is False

def test_rate_limiting(service):
    email = "test@example.com"
    
    # Generate multiple tokens
    tokens = [service.generate_recovery_token(email) for _ in range(3)]
    
    # All tokens should be valid
    assert all(service.validate_token(token) == email for token in tokens)
    
    # Mark tokens as used
    for token in tokens:
        service.mark_token_used(token)
    
    # All tokens should be invalid after use
    assert all(service.validate_token(token) is None for token in tokens) 