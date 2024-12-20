"""Application factory.

This module provides the application factory for creating Flask applications.
"""

import os
from typing import Optional, Type

from flask import Flask
from flask_migrate import Migrate

from src.core.extensions import (
    db, login_manager, mail, migrate, csrf
)
from src.core.auth.models import User
from src.core.config import Config, TestingConfig

def create_app(config_class: Optional[Type[Config]] = None) -> Flask:
    """Create Flask application.
    
    Args:
        config_class: Configuration class to use
        
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Load config
    if config_class is None:
        if os.environ.get('FLASK_ENV') == 'testing':
            config_class = TestingConfig
        else:
            config_class = Config
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    
    # Register blueprints
    from src.core.auth.views import bp as auth_bp
    app.register_blueprint(auth_bp)
    
    from src.core.main.views import bp as main_bp
    app.register_blueprint(main_bp)
    
    from src.core.api.views import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Shell context
    @app.shell_context_processor
    def make_shell_context():
        return {
            'db': db,
            'User': User
        }
    
    return app