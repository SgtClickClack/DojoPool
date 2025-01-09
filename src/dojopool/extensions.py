"""Flask extensions for the application.

This module re-exports extensions from core.extensions for backward compatibility.
"""
from dojopool.core.extensions import (
    db,
    migrate,
    mail,
    redis_client,
    cache,
    limiter,
    login_manager,
    oauth,
    cors,
    csrf,
    init_db,
    _make_scoped_session
)

__all__ = [
    'db',
    'migrate',
    'mail',
    'redis_client',
    'cache',
    'limiter',
    'login_manager',
    'oauth',
    'cors',
    'csrf',
    'init_db',
    '_make_scoped_session'
]