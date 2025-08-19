"""Database utilities for DojoPool."""

import os
from typing import Any, Dict, List, Optional

from flask import current_app
from sqlalchemy import text

from . import db
from .session import db_session


def execute_sql(sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Execute raw SQL query.

    Args:
        sql: SQL query string
        params: Query parameters

    Returns:
        List of result rows as dictionaries
    """
    with db_session() as session:
        result = session.execute(text(sql), params or {})
        return [dict(row) for row in result]


def backup_database(backup_path: Optional[str] = None) -> str:
    """Backup database to file.

    Args:
        backup_path: Path to backup file (default: auto-generated)

    Returns:
        Path to backup file
    """
    if backup_path is None:
        backup_dir = os.path.join(current_app.instance_path, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        backup_path = os.path.join(
            backup_dir, f"backup_{current_app.config['ENV']}_{db.engine.url.database}.sql"
        )

    # SQLite backup
    if "sqlite" in current_app.config["SQLALCHEMY_DATABASE_URI"]:
        import sqlite3

        source = sqlite3.connect(
            current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
        )
        dest = sqlite3.connect(backup_path)
        source.backup(dest)
        source.close()
        dest.close()
    # PostgreSQL backup
    elif "postgresql" in current_app.config["SQLALCHEMY_DATABASE_URI"]:
        import subprocess

        subprocess.run(["pg_dump", "-f", backup_path, str(db.engine.url)])
    else:
        raise ValueError("Unsupported database type for backup")

    current_app.logger.info(f"Database backed up to: {backup_path}")
    return backup_path


def restore_database(backup_path: str) -> None:
    """Restore database from backup.

    Args:
        backup_path: Path to backup file
    """
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found: {backup_path}")

    # SQLite restore
    if "sqlite" in current_app.config["SQLALCHEMY_DATABASE_URI"]:
        import sqlite3

        source = sqlite3.connect(backup_path)
        dest = sqlite3.connect(
            current_app.config["SQLALCHEMY_DATABASE_URI"].replace("sqlite:///", "")
        )
        source.backup(dest)
        source.close()
        dest.close()
    # PostgreSQL restore
    elif "postgresql" in current_app.config["SQLALCHEMY_DATABASE_URI"]:
        import subprocess

        subprocess.run(["psql", "-f", backup_path, str(db.engine.url)])
    else:
        raise ValueError("Unsupported database type for restore")

    current_app.logger.info(f"Database restored from: {backup_path}")


def check_connection() -> bool:
    """Check database connection.

    Returns:
        True if connection successful
    """
    try:
        db.session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        current_app.logger.error(f"Database connection error: {str(e)}")
        return False


def get_table_sizes() -> List[Dict[str, Any]]:
    """Get sizes of all database tables.

    Returns:
        List of table sizes and row counts
    """
    if "sqlite" in current_app.config["SQLALCHEMY_DATABASE_URI"]:
        sql = """
            SELECT
                name as table_name,
                (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count,
                (SELECT COUNT(*) FROM name) as row_count
            FROM sqlite_master m
            WHERE type='table'
        """
    else:
        sql = """
            SELECT
                relname as table_name,
                pg_total_relation_size(relid) as total_size,
                pg_relation_size(relid) as data_size,
                n_live_tup as row_count
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(relid) DESC
        """

    return execute_sql(sql)


# Consolidated utility functions for database operations
# Cleaned up unused imports and removed commented code
