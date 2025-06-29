"""
Extensions Module

This module initializes and configures various Flask extensions such as caching,
CORS, login, mail, migration, socketio, and SQLAlchemy. It includes type annotations
and docstrings for clarity.
"""

from typing import Any

from flask_caching import Cache  # type: ignore
from flask_cors import CORS  # type: ignore
from flask_login import LoginManager  # type: ignore
from flask_mail import Mail  # type: ignore
from flask_marshmallow import Marshmallow  # type: ignore
from flask_migrate import Migrate  # type: ignore
from flask_socketio import SocketIO  # type: ignore
from flask_sqlalchemy import SQLAlchemy  # type: ignore

# Initialize extensions
db: SQLAlchemy = SQLAlchemy()  # type: ignore
ma: Marshmallow = Marshmallow()  # type: ignore
cache: Cache = Cache()  # type: ignore
cors: CORS = CORS()  # type: ignore
login_manager: LoginManager = LoginManager()  # type: ignore
mail: Mail = Mail()  # type: ignore
migrate: Migrate = Migrate()  # type: ignore
socketio: SocketIO = SocketIO()  # type: ignore

# Import services
from .services.cache_service import cache_service
from .services.db_service import db_service


# Add handler for unauthorized API access
@login_manager.unauthorized_handler
def unauthorized():
    # Return a 401 Unauthorized JSON response for API requests
    # Check if request expects JSON or is targeting an API endpoint
    # Simple check: if path starts with /api
    from flask import request # Local import
    if request.path.startswith('/api'):
        return {'message': 'Authentication required'}, 401
    # For non-API requests, you might still want to redirect to a login page
    # For now, return JSON for all unauthorized as this is primarily an API
    return {'message': 'Authentication required'}, 401


def init_extensions(app: Any) -> None:
    """
    Initialize all Flask extensions with the given app.

    Args:
        app (Any): The Flask application instance.
    """
    db.init_app(app)
    ma.init_app(app)
    cache.init_app(app)
    cors.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app)

    # Configure login manager
    login_manager.login_view = "api_v1.loginresource"
    login_manager.login_message_category = "info"

    # Import and set user loader after all models are defined
    from .user_loader import load_user
    login_manager.user_loader(load_user)


__all__ = [
    "db",
    "migrate",
    "mail",
    "cache",
    "cors",
    "socketio",
    "login_manager",
    "init_extensions",
    "db_service",
    "cache_service",
]
