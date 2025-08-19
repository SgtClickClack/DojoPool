"""User loader module for Flask-Login."""

from ..models.user import User

def load_user(user_id):
    """Load a user by ID for Flask-Login."""
    return User.query.get(int(user_id)) 