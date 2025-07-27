from extensions import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import re
from datetime import datetime
from sqlalchemy import Index

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    profile_pic = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), index=True)
    last_login = db.Column(db.DateTime, index=True)
    login_count = db.Column(db.Integer, default=0)
    
    # Add performance indexes
    __table_args__ = (
        Index('idx_user_active_created', 'is_active', 'created_at'),
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_last_login', 'last_login'),
    )
    
    def set_password(self, password):
        """Set hashed password with improved validation."""
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        # Additional password complexity validation
        if not re.search(r'[A-Z]', password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'\d', password):
            raise ValueError("Password must contain at least one digit")
        
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)
        
    def check_password(self, password):
        """Check hashed password with timing attack protection."""
        if not self.password_hash or not password:
            return False
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """Update last login timestamp and increment login count."""
        self.last_login = datetime.utcnow()
        self.login_count = (self.login_count or 0) + 1
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def validate_email(email):
        """Validate email format with improved regex."""
        if not email or len(email) > 254:  # RFC 5321 limit
            return False
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_username(username):
        """Validate username format with improved validation."""
        if not username or len(username) < 3 or len(username) > 50:
            return False
        # Allow letters, numbers, underscore, hyphen, but not starting with special chars
        pattern = r'^[a-zA-Z][a-zA-Z0-9_-]{2,49}$'
        return re.match(pattern, username) is not None
    
    @classmethod
    def find_by_email(cls, email):
        """Find user by email with case-insensitive search."""
        return cls.query.filter(db.func.lower(cls.email) == db.func.lower(email)).first()
    
    @classmethod
    def find_by_username(cls, username):
        """Find user by username with case-insensitive search."""
        return cls.query.filter(db.func.lower(cls.username) == db.func.lower(username)).first()
    
    @classmethod
    def get_active_users(cls, limit=100):
        """Get active users with pagination."""
        return cls.query.filter_by(is_active=True).order_by(cls.last_login.desc()).limit(limit).all()
    
    def to_dict(self):
        """Convert user to dictionary (exclude sensitive data) with caching consideration."""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'profile_pic': self.profile_pic,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_count': self.login_count or 0
        }
    
    def __repr__(self):
        return f'<User {self.username} ({self.email})>'
