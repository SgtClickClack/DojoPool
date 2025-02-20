"""
Database Module

This module provides a wrapper around the Flask-SQLAlchemy database, abstracting
common operations such as executing queries, adding, deleting, and updating records.
"""

import logging
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import UUID

from flask_sqlalchemy import SQLAlchemy  # type: ignore
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import DeclarativeMeta, Mapped, mapped_column, relationship
from sqlalchemy.ext.declarative import declarative_base

logger: Any = logging.getLogger(__name__)

# Initialize SQLAlchemy with no settings
db: SQLAlchemy = SQLAlchemy()

# Create declarative base
Base = declarative_base()


def init_db(app) -> None:
    """Initialize the database with the app context."""
    db.init_app(app)

    # Import models here to avoid circular imports

    # Create tables if they don't exist
    with app.app_context():
        db.create_all()


def reference_col(
    tablename: str, nullable: bool = False, pk_name: str = "id", **kwargs: Any
):
    """Column that adds primary key foreign key reference.

    Args:
        tablename: Table name being referenced
        nullable: Whether it should be nullable
        pk_name: Name of primary key column being referenced
        **kwargs: Additional arguments passed to Column

    Returns:
        Column with foreign key reference
    """
    return Column(db.ForeignKey(f"{tablename}.{pk_name}"), nullable=nullable, **kwargs)


class Database:
    def __init__(self, db: SQLAlchemy):
        """
        Initialize the database wrapper.

        Args:
            db (SQLAlchemy): The Flask-SQLAlchemy instance.
        """
        self.db: SQLAlchemy = db

    def execute_query(
        self, query: str, params: Optional[Tuple[Any, ...]] = None
    ) -> List[Any]:
        """
        Execute a given SQL query using the current SQLAlchemy session.

        Args:
            query (str): The SQL query to execute.
            params (Optional[Tuple[Any, ...]]): The parameters for the query.

        Returns:
            List[Any]: A list of fetched results.
        """
        try:
            result: Any = self.db.session.execute(query, params or ())
            self.db.session.commit()
            logger.info("Executed query successfully: %s", query)
            return result.fetchall()
        except Exception as e:
            logger.error("Error executing query '%s': %s", query, e)
            self.db.session.rollback()
            raise

    def add_record(self, record: Any):
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

    def delete_record(self, record: Any):
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

    def update_record(self):
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
