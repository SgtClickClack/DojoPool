"""Type stub for extensions module."""

from typing import Optional

from flask import Flask
from flask_caching import Cache
from flask_cors import CORS
from flask_login import LoginManager, UserMixin
from flask_mail import Mail
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

# Database instance
db: SQLAlchemy

# Extension instances
ma: Marshmallow
cache: Cache
cors: CORS
login_manager: LoginManager
mail: Mail
migrate: Migrate
socketio: SocketIO

def init_extensions(app: Flask) -> None: ...
def load_user(user_id: str) -> Optional[UserMixin]: ...
