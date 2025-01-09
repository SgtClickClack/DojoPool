"""Flask extensions module.

This module initializes all Flask extensions used in the application.
Extensions are initialized here to avoid circular imports.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_caching import Cache
from flask_socketio import SocketIO
from flask_login import LoginManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from authlib.integrations.flask_client import OAuth
from sqlalchemy.orm import scoped_session, sessionmaker
from flask import current_app
from wtforms.csrf.session import SessionCSRF
import redis

# Database
db = SQLAlchemy()
migrate = Migrate()

# Security
csrf = SessionCSRF()
cors = CORS()

# Authentication
login_manager = LoginManager()
oauth = OAuth()

# Cache and rate limiting
cache = Cache()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Email
mail = Mail()

# Redis
redis_client = redis.Redis(
    host='redis',
    port=6379,
    db=0,
    decode_responses=True
)

# WebSocket - remove duplicate instance
# socketio is imported from src.extensions

def init_db(app, drop_tables=False):
    """Initialize the database."""
    with app.app_context():
        if drop_tables:
            db.drop_all()
        db.create_all()

def _make_scoped_session(bind=None):
    """Create a scoped session."""
    return scoped_session(
        sessionmaker(bind=bind, autocommit=False, autoflush=False)
    )
