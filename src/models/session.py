"""Session model for user sessions."""
from datetime import datetime, timedelta
import secrets
from src.core.database import db
from src.core.mixins import TimestampMixin

class Session(TimestampMixin, db.Model):
    """Model for user sessions."""
    
    __tablename__ = 'sessions'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(64), unique=True, nullable=False)
    device_info = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked = db.Column(db.Boolean, default=False)
    
    # Relationships
    user = db.relationship('User', back_populates='sessions')
    
    def __repr__(self):
        """String representation of the session."""
        return f'<Session {self.session_id}>'
    
    def is_valid(self):
        """Check if session is valid."""
        return not self.revoked and self.expires_at > datetime.utcnow()
    
    def revoke(self):
        """Revoke the session."""
        self.revoked = True
        db.session.commit()
    
    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()
        db.session.commit()
    
    @staticmethod
    def _generate_session_id():
        """Generate a random session ID."""
        return secrets.token_urlsafe(32)
    
    def to_dict(self):
        """Convert session to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'device_info': self.device_info,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'last_activity': self.last_activity.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'revoked': self.revoked,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @classmethod
    def create_session(cls, user_id, device_info=None, ip_address=None, user_agent=None, expires_in=3600):
        """Create a new session.
        
        Args:
            user_id: ID of the user
            device_info: Optional device information
            ip_address: Optional IP address
            user_agent: Optional user agent string
            expires_in: Session expiration time in seconds (default: 1 hour)
            
        Returns:
            Session: The created session
        """
        session = cls(
            user_id=user_id,
            session_id=cls._generate_session_id(),
            device_info=device_info,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.utcnow() + timedelta(seconds=expires_in)
        )
        db.session.add(session)
        db.session.commit()
        return session