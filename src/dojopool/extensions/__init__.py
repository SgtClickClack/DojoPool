"""Flask extensions for the application."""

from typing import Any, Dict, List, Optional

from flask_caching import Cache
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_mail import Mail
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

# Initialize extensions
migrate = Migrate()
login_manager = LoginManager()
mail = Mail()
cors = CORS()
socketio = SocketIO()
jwt = JWTManager()
ma = Marshmallow()
cache = Cache(
    config={
        "CACHE_TYPE": "redis",
        "CACHE_REDIS_URL": "redis://localhost:6379/0",
        "CACHE_DEFAULT_TIMEOUT": 300,
    }
)
db = SQLAlchemy()

# Initialize services
class CacheService:
    """Cache service wrapper."""

    def __init__(self, cache_instance: Cache):
        self.cache = cache_instance

    async def get(self, key: str) -> Any:
        """Get value from cache."""
        return self.cache.get(key)

    async def set(self, key: str, value: Any, timeout: int = None) -> None:
        """Set value in cache."""
        self.cache.set(key, value, timeout=timeout)

    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        self.cache.delete(key)

    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache."""
        return self.cache.get_many(*keys)

    async def set_many(self, mapping: Dict[str, Any], timeout: int = None) -> None:
        """Set multiple values in cache."""
        self.cache.set_many(mapping, timeout=timeout)

    async def delete_many(self, keys: List[str]) -> None:
        """Delete multiple values from cache."""
        self.cache.delete_many(*keys)


cache_service = CacheService(cache)


def init_app(app):
    """Initialize Flask extensions"""
    migrate.init_app(app, db)
    login_manager.init_app(app)
    mail.init_app(app)
    cors.init_app(app)
    socketio.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    cache.init_app(app)

    # Configure login
    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"

    return app


__all__ = [
    "migrate",
    "login_manager",
    "mail",
    "cors",
    "socketio",
    "jwt",
    "ma",
    "cache",
    "cache_service",
    "db",
    "init_app",
]

def get_config(timeout: Optional[int] = None) -> Dict[str, Any]:
    """
    Retrieves configuration settings.

    Args:
        timeout (Optional[int]): Timeout setting in seconds; defaults to 30 if not provided.
    
    Returns:
        Dict[str, Any]: A dictionary of configuration settings.
    """
    if timeout is None:
        timeout = 30
    return {"timeout": timeout}

def request_with_params(url: str, params: Optional[List[Any]] = None) -> Dict[str, Any]:
    """
    Simulated request function that uses parameters.

    Args:
        url (str): The endpoint URL.
        params (Optional[List[Any]]): A list of parameters; defaults to empty list if not provided.
    
    Returns:
        Dict[str, Any]: A dummy response dictionary.
    """
    if params is None:
        params = []
    return {"url": url, "params": params}
