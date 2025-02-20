import gc
import gc
"""Database utilities for DojoPool."""

import os
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import UUID

from flask import Response, current_app
from flask.typing import ResponseReturnValue
from sqlalchemy import ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.wrappers import Response as WerkzeugResponse

from . import db
from .session import db_session


def execute_sql(
    sql: str, params: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Execute raw SQL query.

    Args:
        sql: SQL query string
        params: Optional query parameters

    Returns:
        List of dictionaries containing query results

    Raises:
        Exception: If query execution fails
    """
    with db_session() as session:
        result = session.execute(text(sql), params or {})
        return [dict(row) for row in result]


def backup_database(backup_path: Optional[str] = None):
    """Backup database to file.

    Args:
        backup_path: Optional path to backup file. If not provided,
                    a default path will be used.

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
        with db_session() as session:
            # Get database URL from config
            db_url = current_app.config["SQLALCHEMY_DATABASE_URI"]

            # Execute pg_dump command
            os.system(f"pg_dump {db_url} > {backup_path}")

            return backup_path
    except Exception as e:
        current_app.logger.error(f"Database backup failed: {str(e)}")
        raise


def restore_database(backup_path: str) -> None:
    """Restore database from backup file.

    Args:
        backup_path: Path to backup file

    Raises:
        FileNotFoundError: If backup file doesn't exist
        Exception: If restore fails
    """
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found: {backup_path}")

    try:
        with db_session() as session:
            # Get database URL from config
            db_url = current_app.config["SQLALCHEMY_DATABASE_URI"]

            # Drop all tables
            db.drop_all()

            # Execute psql command to restore
            os.system(f"psql {db_url} < {backup_path}")
    except Exception as e:
        current_app.logger.error(f"Database restore failed: {str(e)}")
        raise


def check_connection():
    """Check database connection.

    Returns:
        True if connection is successful, False otherwise
    """
    try:
        with db_session() as session:
            session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        current_app.logger.error(f"Database connection check failed: {str(e)}")
        return False


def get_table_sizes():
    """Get sizes of all database tables.

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

    return execute_sql(sql)
