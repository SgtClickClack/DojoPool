"""Token model module."""

import secrets
from datetime import datetime, timedelta

from dojopool.extensions import db


class Token(db.Model):
    """Token model class."""

    __tablename__ = "tokens"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    token_type = db.Column(db.String(20), nullable=False)  # access, refresh, reset
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = db.relationship("User", backref="tokens")

    def __init__(self, user_id, token_type, token=None, expires_at=None):
        """Initialize token."""
        self.user_id = user_id
        self.token_type = token_type
        self.token = token or secrets.token_urlsafe(32)
        self.expires_at = expires_at or datetime.utcnow() + timedelta(hours=1)

    def is_expired(self):
        """Check if token is expired."""
        return datetime.utcnow() > self.expires_at

    def revoke(self):
        """Revoke token by setting expiry to now."""
        self.expires_at = datetime.utcnow()

    @classmethod
    def generate_token(cls, user_id, token_type, expires_in=3600):
        """Generate a new token."""
        token = cls(
            user_id=user_id,
            token_type=token_type,
            expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
        )
        db.session.add(token)
        db.session.commit()
        return token

    def __repr__(self):
        """Represent token as string."""
        return f"<Token {self.token_type} for User {self.user_id}>"
