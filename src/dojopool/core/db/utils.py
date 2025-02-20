import gc
import gc
"""Database utility functions."""

import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from flask import Response, current_app
from flask.typing import ResponseReturnValue
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from werkzeug.wrappers import Response as WerkzeugResponse


def init_db(db: SQLAlchemy) -> None:
    """Initialize the database.

    Args:
        db: SQLAlchemy instance
    """
    db.create_all()


def reset_db(db: SQLAlchemy):
    """Reset the database by dropping all tables and recreating them.

    Args:
        db: SQLAlchemy instance
    """
    db.drop_all()
    db.create_all()


def backup_db(db: SQLAlchemy, backup_path: Optional[str] = None):
    """Backup database to file.

    Args:
        db: SQLAlchemy instance
        backup_path: Optional path to backup file

    Returns:
        Path to backup file

    Raises:
        Exception: If backup fails
    """
    if not backup_path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(
            current_app.config["BACKUP_DIR"], f"backup_{timestamp}.sql"
        )

    os.makedirs(os.path.dirname(backup_path), exist_ok=True)

    try:
        # Get database URL from config
        db_url = current_app.config["SQLALCHEMY_DATABASE_URI"]

        # Execute pg_dump command
        os.system(f"pg_dump {db_url} > {backup_path}")

        return backup_path
    except Exception as e:
        current_app.logger.error(f"Database backup failed: {str(e)}")
        raise


def restore_db(db: SQLAlchemy, backup_path: str) -> None:
    """Restore database from backup file.

    Args:
        db: SQLAlchemy instance
        backup_path: Path to backup file

    Raises:
        FileNotFoundError: If backup file doesn't exist
        Exception: If restore fails
    """
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found: {backup_path}")

    try:
        # Get database URL from config
        db_url = current_app.config["SQLALCHEMY_DATABASE_URI"]

        # Drop all tables
        db.drop_all()

        # Execute psql command to restore
        os.system(f"psql {db_url} < {backup_path}")
    except Exception as e:
        current_app.logger.error(f"Database restore failed: {str(e)}")
        raise


def check_connection(db: SQLAlchemy):
    """Check database connection.

    Args:
        db: SQLAlchemy instance

    Returns:
        True if connection is successful, False otherwise
    """
    try:
        db.session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        current_app.logger.error(f"Database connection check failed: {str(e)}")
        return False


def get_table_sizes(db: SQLAlchemy):
    """Get sizes of all database tables.

    Args:
        db: SQLAlchemy instance

    Returns:
        List of dictionaries containing table names and sizes
    """
    sql = """
        SELECT
            table_name,
            pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
    """

    result = db.session.execute(text(sql))
    return [dict(row) for row in result]
