import gc
import gc
"""Database manager for DojoPool."""

import os
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union

from flask import current_app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey, create_engine, text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class DatabaseManager:
    """Database management utilities."""

    def __init__(self, db: SQLAlchemy) -> None:
        """Initialize database manager.

        Args:
            db: SQLAlchemy instance
        """
        self.db = db

    def init_db(self):
        """Initialize the database."""
        self.db.create_all()

    def drop_db(self):
        """Drop all database tables."""
        self.db.drop_all()

    def backup_db(self, backup_path: Optional[str] = None):
        """Backup database to file.

        Args:
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

    def restore_db(self, backup_path: str) -> None:
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
            # Get database URL from config
            db_url = current_app.config["SQLALCHEMY_DATABASE_URI"]

            # Drop all tables
            self.drop_db()

            # Execute psql command to restore
            os.system(f"psql {db_url} < {backup_path}")
        except Exception as e:
            current_app.logger.error(f"Database restore failed: {str(e)}")
            raise

    def check_connection(self):
        """Check database connection.

        Returns:
            True if connection is successful, False otherwise
        """
        try:
            self.db.session.execute(text("SELECT 1"))
            return True
        except Exception as e:
            current_app.logger.error(f"Database connection check failed: {str(e)}")
            return False

    def get_table_sizes(self):
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

        result = self.db.session.execute(text(sql))
        return [dict(row) for row in result]
