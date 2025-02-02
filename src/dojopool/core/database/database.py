"""
Database Module

This module provides a wrapper around the Flask-SQLAlchemy database, abstracting
common operations such as executing queries, adding, deleting, and updating records.
"""

import logging
from typing import Any, List, Optional, Tuple

from flask_sqlalchemy import SQLAlchemy  # type: ignore
from sqlalchemy import Column, ForeignKey, Integer

logger = logging.getLogger(__name__)

# Initialize SQLAlchemy with no settings
db = SQLAlchemy()


def init_db(app):
    """Initialize the database with the app context."""
    db.init_app(app)

    # Import models here to avoid circular imports

    # Create tables if they don't exist
    with app.app_context():
        db.create_all()


def reference_col(tablename: str, nullable: bool = False, pk_name: str = "id", **kwargs) -> Column:
    """Column that adds primary key foreign key reference.

    Args:
        tablename: Name of the referenced table.
        nullable: Whether the column is nullable.
        pk_name: Name of the primary key column.
        **kwargs: Additional column arguments.

    Returns:
        Column: Foreign key column.
    """
    return Column(Integer, ForeignKey(f"{tablename}.{pk_name}"), nullable=nullable, **kwargs)


class Database:
    def __init__(self, db: SQLAlchemy) -> None:
        """
        Initialize the database wrapper.

        Args:
            db (SQLAlchemy): The Flask-SQLAlchemy instance.
        """
        self.db = db

    def execute_query(self, query: str, params: Optional[Tuple[Any, ...]] = None) -> List[Any]:
        """
        Execute a given SQL query using the current SQLAlchemy session.

        Args:
            query (str): The SQL query to execute.
            params (Optional[Tuple[Any, ...]]): The parameters for the query.

        Returns:
            List[Any]: A list of fetched results.
        """
        try:
            result = self.db.session.execute(query, params or ())
            self.db.session.commit()
            logger.info("Executed query successfully: %s", query)
            return result.fetchall()
        except Exception as e:
            logger.error("Error executing query '%s': %s", query, e)
            self.db.session.rollback()
            raise

    def add_record(self, record: Any) -> None:
        """
        Add a record (typically a SQLAlchemy model instance) to the session and commit.

        Args:
            record (Any): The record to add to the database.
        """
        try:
            self.db.session.add(record)
            self.db.session.commit()
            logger.info("Record added successfully: %s", record)
        except Exception as e:
            logger.error("Error adding record '%s': %s", record, e)
            self.db.session.rollback()
            raise

    def delete_record(self, record: Any) -> None:
        """
        Delete a record (typically a SQLAlchemy model instance) from the session and commit.

        Args:
            record (Any): The record to delete from the database.
        """
        try:
            self.db.session.delete(record)
            self.db.session.commit()
            logger.info("Record deleted successfully: %s", record)
        except Exception as e:
            logger.error("Error deleting record '%s': %s", record, e)
            self.db.session.rollback()
            raise

    def update_record(self) -> None:
        """
        Commit the changes for all pending modifications in the session.
        """
        try:
            self.db.session.commit()
            logger.info("Session updated successfully.")
        except Exception as e:
            logger.error("Error updating records: %s", e)
            self.db.session.rollback()
            raise
