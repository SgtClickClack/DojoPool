"""Flask extensions for the application."""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_caching import Cache
from flask_redis import FlaskRedis
from flask_login import LoginManager

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
cache = Cache()
redis_client = FlaskRedis()
login_manager = LoginManager()

def init_login_manager(app):
    """Initialize login manager settings."""
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'  # type: ignore
    login_manager.login_message_category = 'info'  # type: ignore

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID."""
    from dojopool.models.user import User
    return User.query.get(int(user_id))

__all__ = [
    'db',
    'migrate',
    'mail',
    'cache',
    'redis_client',
    'login_manager',
    'init_login_manager'
]