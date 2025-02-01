"""Session model module."""

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..extensions import db
from .base import BaseModel


class Session(BaseModel):
    """Session model for tracking user sessions."""

    __tablename__ = "sessions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    device_info = Column(JSON)  # Device and browser information
    ip_address = Column(String(45))
    last_activity = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(db.Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="sessions")

    def __repr__(self):
        return f"<Session {self.id} for User {self.user_id}>"

    def is_expired(self):
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at

    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()
        db.session.commit()

    def invalidate(self):
        """Invalidate the session."""
        self.is_active = False
        db.session.commit()

    def update_device_info(self, device_info):
        """Update device information.

        Args:
            device_info: New device information
        """
        self.device_info = device_info
        db.session.commit()

    @classmethod
    def get_active_session(cls, token):
        """Get active session by token.

        Args:
            token: Session token

        Returns:
            Session: Active session if found and valid
        """
        session = cls.query.filter_by(token=token, is_active=True).first()

        if session and not session.is_expired():
            return session

        return None

    @classmethod
    def cleanup_expired(cls):
        """Clean up expired sessions."""
        cls.query.filter(cls.expires_at < datetime.utcnow()).update({"is_active": False})
        db.session.commit()
