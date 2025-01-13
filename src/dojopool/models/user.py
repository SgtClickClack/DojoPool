"""User model for the application."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from dojopool.core.extensions import db
from .user_roles import user_roles

class User(db.Model):
    """User model."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(255), nullable=True)  # Nullable for OAuth users
    google_id = Column(String(120), unique=True, nullable=True)
    profile_picture = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)

    # Relationships
    tournament_players = relationship("TournamentPlayer", back_populates="user")
    roles = relationship('Role', secondary=user_roles, lazy='subquery',
                        backref=db.backref('users', lazy=True))

    def __repr__(self):
        """String representation of the user."""
        return f'<User {self.username}>'

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
