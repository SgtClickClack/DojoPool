"""Database management module."""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .manager import DatabaseManager
from .migrations import MigrationManager
from .utils import backup_db, init_db, reset_db, restore_db

__all__ = [
    "db",
    "DatabaseManager",
    "MigrationManager",
    "init_db",
    "reset_db",
    "backup_db",
    "restore_db",
]
