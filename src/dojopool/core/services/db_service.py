"""
DB Service Module

Provides a service layer for interacting with the database using SQLAlchemy.
Enhanced with type annotations and robust error handling.
"""

from typing import Any, Dict, List, Optional, Type, TypeVar
from sqlalchemy.orm import Query, Session  # type: ignore
from sqlalchemy.sql import text

from ..extensions import db

T = TypeVar("T")


class DBService:
    def __init__(self, session: Session) -> None:
        """
        Initialize the database service with a SQLAlchemy session.

        Args:
            session (Session): The SQLAlchemy session instance.
        """
        self.session = session

    def fetch_all(self, model: Type[T], filters: Optional[List[Any]] = None) -> List[T]:
        """
        Fetch all records of the specified model that match the given filters.

        Args:
            model (Type[T]): The SQLAlchemy model class.
            filters (Optional[List[Any]]): A list of filter expressions.

        Returns:
            List[T]: A list of matching records.
        """
        if filters is None:
            filters = []
        query = self.session.query(model)
        for f in filters:
            query = query.filter(f)
        try:
            records = query.all()
            return records
        except Exception as e:
            self.session.rollback()
            raise e

    def fetch_by_id(self, model: Type[T], record_id: int) -> Optional[T]:
        """
        Fetch a single record by its ID.

        Args:
            model (Type[T]): The SQLAlchemy model class.
            record_id (int): The primary key of the record.

        Returns:
            Optional[T]: The record if found, else None.
        """
        try:
            record = self.session.get(model, record_id)
            return record
        except Exception as e:
            self.session.rollback()
            raise e

    @staticmethod
    async def get(model: Type[T], id: int) -> Optional[T]:
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
    async def execute(sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute raw SQL query.

        Args:
            sql: SQL query string
            params: Query parameters

        Returns:
            List of records as dictionaries
        """
        result = db.session.execute(text(sql), params or {})
        return [dict(row) for row in result]


db_service = DBService(db.session)
