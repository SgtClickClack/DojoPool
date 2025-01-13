"""User model module."""
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    """User model for authentication."""
    
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True)

    def __init__(self, username, email, password_hash, is_active=True):
        """Initialize user."""
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.is_active = is_active

    def save(self):
        """Save the user to the database."""
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active
        }

class Role(db.Model):
    """Role model for user permissions."""
    
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))

    def __init__(self, name, description=None):
        """Initialize role."""
        self.name = name
        self.description = description

    def to_dict(self):
        """Convert role to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

class UserRole(db.Model):
    """Association model between users and roles."""
    
    __tablename__ = 'user_roles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)

    def __init__(self, user_id, role_id):
        """Initialize user role."""
        self.user_id = user_id
        self.role_id = role_id

    def to_dict(self):
        """Convert user role to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role_id': self.role_id
        } 