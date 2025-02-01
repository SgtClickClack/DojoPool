"""Core extensions module."""

from flask_caching import Cache
from flask_cors import CORS
from flask_login import LoginManager
from flask_mail import Mail
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

# Initialize extensions
db = SQLAlchemy()
cache = Cache()
migrate = Migrate()
mail = Mail()
cors = CORS()
socketio = SocketIO()
login_manager = LoginManager()

# Import services
from .services.db_service import db_service
from .services.cache_service import cache_service


def init_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    cache.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    cors.init_app(app)
    socketio.init_app(app)
    login_manager.init_app(app)

    # Configure login manager
    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"

    @login_manager.user_loader
    def load_user(user_id):
        from ..models.user import User

        return User.query.get(int(user_id))


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
