"""Authentication blueprint for DojoPool."""
from flask import Blueprint

# Import routes after blueprint creation to avoid circular imports
from .routes import auth_bp

from .utils import verified_user_required
from .oauth import GoogleOAuth

__all__ = ['auth_bp', 'verified_user_required', 'GoogleOAuth']