"""Authentication models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

from ..database import db, reference_col

class Role(db.Model):
    """User role model."""

    __tablename__ = 'roles'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    name = Column(String(80), unique=True, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship('User', secondary='user_roles', back_populates='roles')

    def __repr__(self):
        """String representation."""
        return f'<Role {self.name}>'

class User(db.Model):
    """User model."""

    __tablename__ = 'users'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255))
    active = Column(Boolean(), default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roles = relationship('Role', secondary='user_roles', back_populates='users')

    def __init__(self, username, email, password=None, **kwargs):
        """Create instance."""
        super(User, self).__init__(username=username, email=email, **kwargs)
        if password:
            self.set_password(password)

    def set_password(self, password):
        """Set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check password."""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        """String representation."""
        return f'<User {self.username}>'

class UserRole(db.Model):
    """User-Role association model."""

    __tablename__ = 'user_roles'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    user_id = reference_col('users', nullable=False)
    role_id = reference_col('roles', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        """String representation."""
        return f'<UserRole {self.user_id}:{self.role_id}>' 