"""Database service module."""

from typing import Any, Dict, List, Optional, Type, TypeVar
from sqlalchemy.orm import Query
from sqlalchemy.sql import text

from ..extensions import db

T = TypeVar("T")


class DatabaseService:
    """Database service class for handling database operations."""

    @staticmethod
    async def fetch_all(query: Query) -> List[Dict[str, Any]]:
        """Fetch all records from a query.

        Args:
            query: SQLAlchemy query object

        Returns:
            List of records as dictionaries
        """
        result = query.all()
        if hasattr(result[0], "_asdict"):
            return [row._asdict() for row in result]
        return [row.__dict__ for row in result]

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


db_service = DatabaseService()
