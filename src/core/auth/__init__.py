"""Authentication module for DojoPool."""

from flask_login import LoginManager, current_user
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

login_manager = LoginManager()
limiter = Limiter(key_func=get_remote_address)

# Import views to register routes
from .views import bp as auth_bp

__all__ = ['login_manager', 'limiter', 'current_user', 'auth_bp'] 