"""Authentication package."""

from flask_login import current_user, login_required, login_user, logout_user

from ..models.user import User
from ..models.role import Role

# Re-export commonly used items
__all__ = ["current_user", "login_required", "login_user", "logout_user", "User", "Role"]
