"""
Two-factor authentication module.

This module provides TOTP-based two-factor authentication functionality.
"""

import pyotp
from typing import Tuple
from flask import current_app
from .models import User
from ..extensions import db

class TOTPService:
    """Service for handling TOTP-based 2FA."""
    
    @staticmethod
    def setup_2fa(user: User) -> Tuple[str, str]:
        """Set up 2FA for a user.
        
        Args:
            user: User to set up 2FA for
            
        Returns:
            Tuple of (secret, provisioning_uri)
        """
        # Generate secret
        secret = pyotp.random_base32()
        
        # Create TOTP object
        totp = pyotp.TOTP(secret)
        
        # Generate provisioning URI for QR code
        uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=current_app.config['TOTP_ISSUER']
        )
        
        # Update user
        user.totp_secret = secret
        db.session.commit()
        
        return secret, uri
    
    @staticmethod
    def verify_2fa(user: User, token: str) -> bool:
        """Verify a 2FA token.
        
        Args:
            user: User to verify token for
            token: Token to verify
            
        Returns:
            True if token is valid
        """
        if not user.totp_secret:
            return False
            
        totp = pyotp.TOTP(user.totp_secret)
        return totp.verify(token)
    
    @staticmethod
    def enable_2fa(user: User, token: str) -> bool:
        """Enable 2FA after verification.
        
        Args:
            user: User to enable 2FA for
            token: Token to verify before enabling
            
        Returns:
            True if 2FA was enabled
        """
        if TOTPService.verify_2fa(user, token):
            user.totp_enabled = True
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def disable_2fa(user: User) -> None:
        """Disable 2FA for a user.
        
        Args:
            user: User to disable 2FA for
        """
        user.totp_enabled = False
        user.totp_secret = None
        db.session.commit() 