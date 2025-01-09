"""Unit tests for authentication functionality."""

import pytest
from datetime import datetime, timedelta
from dojopool.services.auth_service import AuthService
from dojopool.models.user import User
from dojopool.extensions import jwt
from dojopool.exceptions import AuthError

@pytest.fixture
def auth_service():
    return AuthService()

@pytest.fixture
def sample_user():
    return User(
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password"
    )

@pytest.fixture
def sample_credentials():
    return {
        "username": "testuser",
        "password": "test_password",
        "email": "test@example.com"
    }

class TestAuth:
    def test_user_registration(self, auth_service, sample_credentials):
        """Test user registration process"""
        user = auth_service.register_user(
            username=sample_credentials["username"],
            password=sample_credentials["password"],
            email=sample_credentials["email"]
        )
        
        assert user.username == sample_credentials["username"]
        assert user.email == sample_credentials["email"]
        assert auth_service.verify_password(
            sample_credentials["password"],
            user.password_hash
        )

    def test_login(self, auth_service, sample_user, sample_credentials):
        """Test user login process"""
        # Set up user with proper password hash
        sample_user.password_hash = auth_service.hash_password(
            sample_credentials["password"]
        )
        
        # Test login
        tokens = auth_service.login(
            username=sample_credentials["username"],
            password=sample_credentials["password"]
        )
        
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert auth_service.verify_token(tokens["access_token"])

    def test_token_refresh(self, auth_service, sample_user):
        """Test token refresh functionality"""
        # Generate initial tokens
        tokens = auth_service.generate_tokens(sample_user)
        
        # Wait briefly to ensure new token has different timestamp
        import time
        time.sleep(1)
        
        # Refresh token
        new_tokens = auth_service.refresh_token(tokens["refresh_token"])
        
        assert new_tokens["access_token"] != tokens["access_token"]
        assert auth_service.verify_token(new_tokens["access_token"])

    def test_password_reset(self, auth_service, sample_user):
        """Test password reset flow"""
        # Request password reset
        reset_token = auth_service.generate_password_reset_token(sample_user)
        assert reset_token is not None
        
        # Verify reset token
        assert auth_service.verify_reset_token(reset_token)
        
        # Reset password
        new_password = "new_test_password"
        auth_service.reset_password(reset_token, new_password)
        
        # Verify new password works
        assert auth_service.verify_password(
            new_password,
            sample_user.password_hash
        )

    def test_oauth_integration(self, auth_service):
        """Test OAuth authentication flow"""
        # Mock OAuth provider response
        oauth_data = {
            "provider": "google",
            "token": "mock_oauth_token",
            "user_info": {
                "email": "oauth_user@example.com",
                "name": "OAuth User"
            }
        }
        
        # Authenticate with OAuth
        user = auth_service.authenticate_oauth(
            provider=oauth_data["provider"],
            token=oauth_data["token"]
        )
        
        assert user.email == oauth_data["user_info"]["email"]
        assert user.oauth_provider == oauth_data["provider"]

    def test_session_management(self, auth_service, sample_user):
        """Test session management"""
        # Create session
        session = auth_service.create_session(sample_user)
        assert session.is_active is True
        
        # Verify session
        assert auth_service.verify_session(session.id)
        
        # Invalidate session
        auth_service.invalidate_session(session.id)
        assert not auth_service.verify_session(session.id)

    def test_role_based_access(self, auth_service, sample_user):
        """Test role-based access control"""
        # Assign roles
        auth_service.assign_role(sample_user, "player")
        auth_service.assign_role(sample_user, "tournament_organizer")
        
        # Check permissions
        assert auth_service.has_permission(sample_user, "play_game")
        assert auth_service.has_permission(sample_user, "create_tournament")
        assert not auth_service.has_permission(sample_user, "admin_access")

    def test_token_validation(self, auth_service, sample_user):
        """Test token validation and verification"""
        # Generate token with custom claims
        token = auth_service.generate_token(
            user=sample_user,
            additional_claims={
                "custom_claim": "test_value"
            }
        )
        
        # Verify token and claims
        decoded = auth_service.decode_token(token)
        assert decoded["sub"] == str(sample_user.id)
        assert decoded["custom_claim"] == "test_value"
        
        # Test expired token
        expired_token = auth_service.generate_token(
            user=sample_user,
            expires_delta=timedelta(seconds=-1)
        )
        with pytest.raises(AuthError):
            auth_service.verify_token(expired_token)

    def test_security_measures(self, auth_service, sample_credentials):
        """Test security measures and protections"""
        # Test password complexity requirements
        with pytest.raises(AuthError):
            auth_service.validate_password("weak")
        
        # Test brute force protection
        for _ in range(10):
            try:
                auth_service.login(
                    username=sample_credentials["username"],
                    password="wrong_password"
                )
            except AuthError:
                pass
        
        # Should be locked out
        with pytest.raises(AuthError) as exc_info:
            auth_service.login(
                username=sample_credentials["username"],
                password=sample_credentials["password"]
            )
        assert "account locked" in str(exc_info.value)

    def test_audit_logging(self, auth_service, sample_user):
        """Test authentication audit logging"""
        # Perform some authentication actions
        auth_service.login(
            username=sample_user.username,
            password="test_password"
        )
        
        # Get audit logs
        logs = auth_service.get_audit_logs(sample_user)
        
        assert len(logs) > 0
        assert logs[0]["action"] == "login"
        assert logs[0]["user_id"] == sample_user.id
        assert "timestamp" in logs[0]
        assert "ip_address" in logs[0] 