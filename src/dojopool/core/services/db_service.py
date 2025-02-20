from flask_caching import Cache
from flask_caching import Cache
"""
DB Service Module

Provides a service layer for interacting with the database using SQLAlchemy.
Enhanced with type annotations and robust error handling.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Type, TypeVar, Union
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text

from ..extensions import db

T: TypeVar = TypeVar("T")


class DBService:
    def __init__(self, session: Any) -> None:
        """
        Initialize the database service with a SQLAlchemy session.

        Args:
            session (Session): The SQLAlchemy session instance.
        """
        self.session = session

    def fetch_all(self, model: Type[T]):
        """
        Fetches all records for the given model.

        Args:
            model (Type[T]): The database model.

        Returns:
            List[T]: A list of model instances.
        """
        return self.session.query(model).all()

    def fetch_by_id(self, model: Type[T], record_id: int):
        """
        Fetch a single record by ID.

        Args:
            model (Type[T]): The database model.
            record_id (int): The record's ID.

        Returns:
            Optional[T]: The model instance, or None if not found.
        """
        return self.session.get(model, record_id)

    @staticmethod
    async def get(model: Type[T], id: int):
        """Get a record by ID.

        Args:
            model: SQLAlchemy model class
            id: Record ID

        Returns:
            Record instance or None
        """
        return model.query.get(id)

    @staticmethod
    async def set(instance: Any) -> None:
        """Save a record to the database.

        Args:
            instance: SQLAlchemy model instance
        """
        db.session.add(instance)
        db.session.commit()

    @staticmethod
    async def execute(sql: str, params: Optional[Dict[str, Any]] = None):
        """Execute raw SQL query.

        Args:
            sql: SQL query string
            params: Query parameters

        Returns:
            List of records as dictionaries
        """
        result: Any = db.session.execute(text(sql), params or {})
        return [dict(row) for row in result]

    def update_record(self, record: T):
        """
        Update a record in the database.
        """
        self.session.add(record)
        self.session.commit()


db_service: DBService = DBService(db.session)
