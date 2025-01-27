"""User model for the application."""
from datetime import datetime
from typing import Optional
from flask_login import UserMixin
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from dojopool.core.extensions import db
from .user_roles import user_roles

class User(UserMixin, db.Model):
    """User model."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    _password = Column('password', String(255), nullable=True)  # Nullable for OAuth users
    google_id = Column(String(120), unique=True, nullable=True)
    profile_picture = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    _is_active = Column('is_active', Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)

    # Relationships
    tournament_players = relationship("TournamentPlayer", back_populates="user")
    roles = relationship('Role', secondary=user_roles, lazy='subquery',
                        backref=db.backref('users', lazy=True))

    def __repr__(self):
        """String representation of the user."""
        return f'<User {self.username}>'

    @property
    def password(self) -> str:
        """Get the user's password hash."""
        pwd = getattr(self, '_password', None)
        return str(pwd) if pwd is not None else ''

    @password.setter
    def password(self, value: str) -> None:
        """Set the user's password."""
        if value:
            self._password = generate_password_hash(value)
        else:
            self._password = None

    def check_password(self, password: str) -> bool:
        """Check if the provided password matches the user's password."""
        pwd = getattr(self, '_password', None)
        if not pwd:
            return False
        return check_password_hash(str(pwd), password)

    def get_id(self) -> str:
        """Return the user ID as a string."""
        return str(self.id)

    @property
    def is_active(self) -> bool:
        """Return True if the user is active."""
        active = getattr(self, '_is_active', True)
        return bool(active)

    @is_active.setter
    def is_active(self, value: bool) -> None:
        """Set the user's active status."""
        self._is_active = value

    def to_dict(self):
        """Convert user to dictionary."""
        created_at_str = self.created_at.isoformat() if hasattr(self.created_at, 'isoformat') else None
        last_login_str = self.last_login.isoformat() if hasattr(self.last_login, 'isoformat') else None
        
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'profile_picture': self.profile_picture,
            'created_at': created_at_str,
            'last_login': last_login_str,
            'is_verified': self.is_verified,
            'roles': [role.name for role in self.roles]
        }
