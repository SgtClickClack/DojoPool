"""Authentication models.

This module provides the User and Role models for authentication.
"""

from datetime import datetime
from typing import Optional

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import pyotp

from src.core.extensions import db, login_manager

class Role(db.Model):
    """User role model."""
    
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    def __repr__(self):
        return f'<Role {self.name}>'

class User(UserMixin, db.Model):
    """User model."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Role relationship
    role_id = db.Column(
        db.Integer,
        db.ForeignKey('roles.id'),
        nullable=False
    )
    role = db.relationship('Role', backref=db.backref('users', lazy=True))
    
    # Account status
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    # 2FA
    totp_enabled = db.Column(db.Boolean, default=False)
    totp_secret = db.Column(db.String(32))
    
    # Profile
    first_name = db.Column(db.String(80))
    last_name = db.Column(db.String(80))
    avatar_url = db.Column(db.String(255))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    last_login = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password: str):
        """Set user's password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """Check if password is correct."""
        return check_password_hash(self.password_hash, password)
    
    def enable_2fa(self) -> str:
        """Enable 2FA for user.
        
        Returns:
            TOTP secret key
        """
        if not self.totp_secret:
            self.totp_secret = pyotp.random_base32()
        self.totp_enabled = True
        return self.totp_secret
    
    def disable_2fa(self):
        """Disable 2FA for user."""
        self.totp_enabled = False
        self.totp_secret = None
    
    def verify_totp(self, token: str) -> bool:
        """Verify TOTP token.
        
        Args:
            token: TOTP token
            
        Returns:
            True if token is valid
        """
        if not self.totp_enabled or not self.totp_secret:
            return False
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(token)
    
    def get_totp_uri(self) -> Optional[str]:
        """Get TOTP URI for QR code.
        
        Returns:
            TOTP URI if 2FA is enabled, None otherwise
        """
        if not self.totp_enabled or not self.totp_secret:
            return None
        totp = pyotp.TOTP(self.totp_secret)
        return totp.provisioning_uri(
            self.email,
            issuer_name='DojoPool'
        )
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f'{self.first_name} {self.last_name}'
        return self.username
    
    def has_role(self, role_name: str) -> bool:
        """Check if user has role.
        
        Args:
            role_name: Role name to check
            
        Returns:
            True if user has role
        """
        return self.role and self.role.name == role_name

@login_manager.user_loader
def load_user(user_id: str) -> Optional[User]:
    """Load user by ID.
    
    Args:
        user_id: User ID
        
    Returns:
        User if found, None otherwise
    """
    return User.query.get(int(user_id)) 