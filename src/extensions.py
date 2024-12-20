from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_mail import Mail
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
mail = Mail()
socketio = SocketIO(async_mode='threading')
limiter = Limiter(key_func=get_remote_address)
cache = Cache()

def init_extensions(app):
    """Initialize Flask extensions"""
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    mail.init_app(app)
    socketio.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)

    # Configure login
    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info' 