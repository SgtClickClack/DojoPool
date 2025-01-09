"""Auth models module.

This module provides authentication-related models.
"""

from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from src.core.database import db
from .base import BaseModel

class Role(BaseModel):
    """Role model."""
    
    __tablename__ = 'roles'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    permissions = db.Column(db.JSON)  # List of permissions
    is_active = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<Role {self.name}>'
    
    def deactivate(self):
        """Deactivate role."""
        self.is_active = False
        db.session.commit()
    
    def activate(self):
        """Activate role."""
        self.is_active = True
        db.session.commit()
    
    def add_permission(self, permission):
        """Add permission to role.
        
        Args:
            permission: Permission to add
        """
        if not self.permissions:
            self.permissions = []
        if permission not in self.permissions:
            self.permissions.append(permission)
            db.session.commit()
    
    def remove_permission(self, permission):
        """Remove permission from role.
        
        Args:
            permission: Permission to remove
        """
        if self.permissions and permission in self.permissions:
            self.permissions.remove(permission)
            db.session.commit()

class User(BaseModel):
    """User model."""
    
    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    avatar_url = db.Column(db.String(255))
    bio = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    preferences = db.Column(db.JSON)  # User preferences
    stats = db.Column(db.JSON)  # User statistics
    
    @property
    def password(self):
        """Password property."""
        raise AttributeError('password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        """Set password hash.
        
        Args:
            password: Password to hash
        """
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        """Verify password.
        
        Args:
            password: Password to verify
        
        Returns:
            bool: True if password matches
        """
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def deactivate(self):
        """Deactivate user."""
        self.is_active = False
        db.session.commit()
    
    def activate(self):
        """Activate user."""
        self.is_active = True
        db.session.commit()
    
    def verify(self):
        """Verify user."""
        self.is_verified = True
        db.session.commit()
    
    def update_last_login(self):
        """Update last login timestamp."""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def update_stats(self, stats_data):
        """Update user statistics.
        
        Args:
            stats_data: Statistics data to update
        """
        self.stats = stats_data
        db.session.commit()
    
    def update_preferences(self, preferences_data):
        """Update user preferences.
        
        Args:
            preferences_data: Preferences data to update
        """
        self.preferences = preferences_data
        db.session.commit()

class UserRole(BaseModel):
    """User role model."""
    
    __tablename__ = 'user_roles'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('user_roles', lazy='dynamic'))
    role = db.relationship('Role', backref=db.backref('user_roles', lazy='dynamic'))
    
    def __repr__(self):
        return f'<UserRole {self.user_id}:{self.role_id}>'
    
    def deactivate(self):
        """Deactivate user role."""
        self.is_active = False
        db.session.commit()
    
    def activate(self):
        """Activate user role."""
        self.is_active = True
        db.session.commit()
    
    def set_expiry(self, expires_at):
        """Set role expiry date.
        
        Args:
            expires_at: Expiry date
        """
        self.expires_at = expires_at
        db.session.commit()
    
    def is_expired(self):
        """Check if role is expired.
        
        Returns:
            bool: True if role is expired
        """
        return self.expires_at and self.expires_at < datetime.utcnow()
