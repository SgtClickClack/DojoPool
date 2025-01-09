"""Session model for the application."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from dojopool.extensions import db

class Session(db.Model):
    """Session model."""
    __tablename__ = 'sessions'

    id = Column(Integer, primary_key=True)
    token = Column(String(255), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 addresses can be up to 45 chars
    session_type = Column(String(20), nullable=False, default='auth')  # 'auth' or 'reset'

    # Relationships
    user = relationship("User", backref="sessions")

    def __repr__(self):
        """String representation of the session."""
        return f'<Session {self.token[:8]}... for user {self.user_id}>'

    def is_expired(self):
        """Check if the session is expired."""
        return datetime.utcnow() > self.expires_at

    @classmethod
    def get_user_sessions(cls, user_id):
        """Get all sessions for a user.
        
        Args:
            user_id (int): The ID of the user
        
        Returns:
            list: List of active sessions for the user
        """
        return cls.query.filter_by(
            user_id=user_id,
            session_type='auth'
        ).all()

    def to_dict(self):
        """Convert session to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'user_agent': self.user_agent,
            'ip_address': self.ip_address,
            'session_type': self.session_type
        }