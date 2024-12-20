"""Authentication service.

This module provides the main authentication service that integrates
JWT, TOTP, OAuth, and password management functionality.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from flask import current_app
from flask_login import login_user
from itsdangerous import URLSafeTimedSerializer

from src.core.extensions import db, mail
from src.core.auth.models import User, Role
from src.core.auth.exceptions import (
    AuthenticationError,
    RegistrationError,
    InvalidTokenError
)

class AuthService:
    """Authentication service."""
    
    def __init__(self):
        """Initialize service."""
        self.serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    
    def register(self, username: str, email: str, password: str) -> User:
        """Register a new user.
        
        Args:
            username: Username
            email: Email address
            password: Password
            
        Returns:
            Created user
            
        Raises:
            RegistrationError: If registration fails
        """
        # Check if username exists
        if User.query.filter_by(username=username).first():
            raise RegistrationError('Username already exists')
            
        # Check if email exists
        if User.query.filter_by(email=email).first():
            raise RegistrationError('Email already exists')
            
        # Get default role
        role = Role.query.filter_by(name='user').first()
        if not role:
            role = Role(name='user')
            db.session.add(role)
            db.session.commit()
        
        # Create user
        user = User(
            username=username,
            email=email,
            role=role
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Send verification email
        self.send_verification_email(user)
        
        return user
    
    def authenticate(
        self,
        email: str,
        password: str,
        totp_token: Optional[str] = None,
        remember: bool = False
    ) -> User:
        """Authenticate a user.
        
        Args:
            email: Email address
            password: Password
            totp_token: Optional TOTP token for 2FA
            remember: Whether to remember the user
            
        Returns:
            Authenticated user
            
        Raises:
            AuthenticationError: If authentication fails
        """
        user = User.query.filter_by(email=email).first()
        if not user:
            raise AuthenticationError('Invalid email or password')
            
        if not user.check_password(password):
            raise AuthenticationError('Invalid email or password')
            
        if not user.is_active:
            raise AuthenticationError('Account is not active')
            
        if not user.is_verified:
            raise AuthenticationError('Email not verified')
            
        if user.totp_enabled and not totp_token:
            raise AuthenticationError('2FA token required')
            
        if user.totp_enabled and not user.verify_totp(totp_token):
            raise AuthenticationError('Invalid 2FA token')
        
        return user
    
    def verify_email(self, token: str) -> User:
        """Verify user's email.
        
        Args:
            token: Verification token
            
        Returns:
            Verified user
            
        Raises:
            InvalidTokenError: If token is invalid
        """
        try:
            data = self.serializer.loads(
                token,
                salt='email-verify',
                max_age=86400  # 24 hours
            )
        except:
            raise InvalidTokenError('Invalid or expired token')
        
        user = User.query.get(data['user_id'])
        if not user:
            raise InvalidTokenError('User not found')
            
        user.is_verified = True
        db.session.commit()
        
        return user
    
    def send_verification_email(self, user: User):
        """Send verification email to user.
        
        Args:
            user: User to send email to
        """
        token = self.serializer.dumps(
            {'user_id': user.id},
            salt='email-verify'
        )
        
        verify_url = url_for(
            'auth.verify_email',
            token=token,
            _external=True
        )
        
        send_email(
            subject='Verify your email',
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user.email],
            text_body=render_template(
                'email/verify_email.txt',
                user=user,
                verify_url=verify_url
            ),
            html_body=render_template(
                'email/verify_email.html',
                user=user,
                verify_url=verify_url
            )
        )
    
    def send_password_reset(self, email: str):
        """Send password reset email.
        
        Args:
            email: Email address
        """
        user = User.query.filter_by(email=email).first()
        if not user:
            return
            
        token = self.serializer.dumps(
            {'user_id': user.id},
            salt='password-reset'
        )
        
        reset_url = url_for(
            'auth.reset_password',
            token=token,
            _external=True
        )
        
        send_email(
            subject='Reset your password',
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user.email],
            text_body=render_template(
                'email/reset_password.txt',
                user=user,
                reset_url=reset_url
            ),
            html_body=render_template(
                'email/reset_password.html',
                user=user,
                reset_url=reset_url
            )
        )
    
    def reset_password(self, token: str, password: str):
        """Reset user's password.
        
        Args:
            token: Reset token
            password: New password
            
        Raises:
            InvalidTokenError: If token is invalid
        """
        try:
            data = self.serializer.loads(
                token,
                salt='password-reset',
                max_age=3600  # 1 hour
            )
        except:
            raise InvalidTokenError('Invalid or expired token')
        
        user = User.query.get(data['user_id'])
        if not user:
            raise InvalidTokenError('User not found')
            
        user.set_password(password)
        db.session.commit()

# Global instance
auth_service = AuthService() 