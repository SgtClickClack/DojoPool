from extensions import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import re


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    profile_pic = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        """Set hashed password."""
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check hashed password."""
        if not self.password_hash or not password:
            return False
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def validate_email(email):
        """Validate email format."""
        if not email:
            return False
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return re.match(pattern, email) is not None

    @staticmethod
    def validate_username(username):
        """Validate username format."""
        if not username or len(username) < 3:
            return False
        pattern = r"^[a-zA-Z0-9_-]{3,50}$"
        return re.match(pattern, username) is not None

    def to_dict(self):
        """Convert user to dictionary (exclude sensitive data)."""
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "profile_pic": self.profile_pic,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
