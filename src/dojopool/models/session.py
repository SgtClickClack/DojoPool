from datetime import datetime
from ..extensions import db

class Session(db.Model):
    """Model for storing user sessions."""

    __tablename__ = 'sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    device_info = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', backref=db.backref('sessions', lazy=True))

    def __repr__(self):
        return f'<Session {self.id} for User {self.user_id}>'

    def to_dict(self):
        """Convert session to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'device_info': self.device_info,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_active': self.is_active,
            'last_activity': self.last_activity.isoformat()
        } 