from flask import jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from flask_wtf.csrf import CSRFProtect

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
mail = Mail()
limiter = Limiter(key_func=get_remote_address)
cache = Cache()
csrf = CSRFProtect()

def unauthorized_handler():
    """Handle unauthorized access."""
    return jsonify({
        'status': 'error',
        'message': 'Unauthorized access'
    }), 401

def init_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    migrate.init_app(app, db)
    
    login_manager.init_app(app)
    login_manager.login_view = None  # Disable redirect
    login_manager.unauthorized_handler(unauthorized_handler)
    
    mail.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        from .models import User
        return User.query.get(int(user_id))
