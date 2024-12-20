"""Token model for authentication."""
from datetime import datetime, timedelta
import secrets
from src.core.database import db

class Token(db.Model):
    """Token model for authentication."""
    
    __tablename__ = 'tokens'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    token_type = db.Column(db.String(50), nullable=False)  # access, refresh, reset, verify
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    revoked = db.Column(db.Boolean, default=False)
    device_info = db.Column(db.JSON)
    
    # Relationships
    user = db.relationship('User', back_populates='tokens')
    
    def __init__(self, user_id, token_type, token=None, expires_at=None, device_info=None):
        """Initialize token."""
        self.user_id = user_id
        self.token_type = token_type
        self.token = token or secrets.token_urlsafe(32)
        self.expires_at = expires_at or (datetime.utcnow() + timedelta(hours=24))
        self.device_info = device_info
    
    def __repr__(self):
        """String representation of token."""
        return f'<Token {self.token_type}:{self.token[:8]}...>'
    
    def is_valid(self):
        """Check if token is valid."""
        return not self.revoked and self.expires_at > datetime.utcnow()
    
    def revoke(self):
        """Revoke the token."""
        self.revoked = True
        db.session.commit()
    
    def to_dict(self):
        """Convert token to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'token_type': self.token_type,
            'expires_at': self.expires_at.isoformat(),
            'created_at': self.created_at.isoformat(),
            'revoked': self.revoked,
            'device_info': self.device_info
        }
    
    @staticmethod
    def generate_token(user_id, token_type='access', expires_in=3600, device_info=None):
        """Generate a new token."""
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        token = Token(
            user_id=user_id,
            token_type=token_type,
            expires_at=expires_at,
            device_info=device_info
        )
        db.session.add(token)
        db.session.commit()
        return token
    
    @staticmethod
    def verify_token(token_string, token_type=None):
        """Verify a token."""
        token = Token.query.filter_by(token=token_string).first()
        if not token:
            return None
        if token_type and token.token_type != token_type:
            return None
        if not token.is_valid():
            return None
        return token