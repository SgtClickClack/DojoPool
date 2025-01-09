"""Tests for email integration functionality."""
import pytest
from dojopool.email.service import EmailService, EmailError
from dojopool.models import User
from dojopool.core.db import db

def test_email_sending():
    """Test email sending functionality."""
    # Create test user
    user = User(
        username="testuser",
        email="test@example.com"
    )
    db.session.add(user)
    db.session.commit()
    
    # Create email service
    email_service = EmailService()
    
    # Send test email
    result = email_service.send_email(
        to_email=user.email,
        subject="Test Email",
        body="This is a test email."
    )
    assert result is None
    
    # Check email stats
    stats = email_service.get_email_stats()
    assert stats["total_emails"] == 1
    assert stats["successful_emails"] == 1

def test_email_template_rendering():
    """Test email template rendering."""
    # Create test user
    user = User(
        username="testuser",
        email="test@example.com"
    )
    db.session.add(user)
    db.session.commit()
    
    # Create email service
    email_service = EmailService()
    
    # Send templated email
    template_data = {
        "username": user.username,
        "action_url": "http://example.com/verify",
        "action_text": "Verify Email"
    }
    result = email_service.send_template_email(
        to_email=user.email,
        template_name="verification",
        template_data=template_data
    )
    assert result is None
    
    # Check email stats
    stats = email_service.get_email_stats()
    assert stats["total_emails"] == 1
    assert stats["successful_emails"] == 1

def test_email_error_handling():
    """Test email error handling."""
    # Create email service
    email_service = EmailService()
    
    # Test invalid email address
    with pytest.raises(EmailError):
        email_service.send_email(
            to_email="invalid-email",
            subject="Test Email",
            body="This is a test email."
        )
    
    # Test missing template
    with pytest.raises(EmailError):
        email_service.send_template_email(
            to_email="test@example.com",
            template_name="nonexistent",
            template_data={}
        )
    
    # Check email stats
    stats = email_service.get_email_stats()
    assert stats["failed_emails"] == 2 