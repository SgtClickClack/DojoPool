"""Database utility functions."""

from pathlib import Path
from flask import current_app
from flask_sqlalchemy import SQLAlchemy

def init_db(db: SQLAlchemy):
    """Initialize the database.
    
    Args:
        db: SQLAlchemy instance
    """
    with current_app.app_context():
        db.create_all()
        current_app.logger.info(f"Database initialized at: {current_app.config['SQLALCHEMY_DATABASE_URI']}")

def reset_db(db: SQLAlchemy):
    """Reset the database.
    
    Args:
        db: SQLAlchemy instance
    """
    with current_app.app_context():
        db.drop_all()
        db.create_all()
        current_app.logger.info("Database reset completed")

def backup_db(db: SQLAlchemy, backup_dir: str = None):
    """Backup the database.
    
    Args:
        db: SQLAlchemy instance
        backup_dir: Directory to store backup (default: instance/backups)
    """
    from .manager import DatabaseManager
    manager = DatabaseManager(db)
    return manager.backup_db(backup_dir)

def restore_db(db: SQLAlchemy, backup_file: str):
    """Restore database from backup.
    
    Args:
        db: SQLAlchemy instance
        backup_file: Path to backup file
    """
    from .manager import DatabaseManager
    manager = DatabaseManager(db)
    manager.restore_db(backup_file) 