"""
Stub definitions for extensions module.
"""

from flask_caching import Cache
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Initialize Flask extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
cache = Cache(config={"CACHE_TYPE": "simple"})
