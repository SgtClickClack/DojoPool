"""Database session management for DojoPool."""

from contextlib import contextmanager
from typing import Any, Generator

from flask import current_app

from . import db


@contextmanager
def db_session() -> Generator[Any, None, None]:
    """Context manager for database sessions.

    Yields:
        SQLAlchemy session

    Example:
        with db_session() as session:
            user = session.query(User).first()
    """
    session = db.session
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        current_app.logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        session.close()


def atomic_transaction(func):
    """Decorator to wrap function in atomic database transaction.

    Example:
        @atomic_transaction
        def create_user(name: str) -> User:
            user = User(name=name)
            db.session.add(user)
            return user
    """

    def wrapper(*args, **kwargs):
        with db_session():
            return func(*args, **kwargs)

    return wrapper


def bulk_save_objects(objects, *, return_defaults=False, update_changed_only=True):
    """Efficiently save multiple objects to database.

    Args:
        objects: List of SQLAlchemy model instances
        return_defaults: Whether to return default values
        update_changed_only: Whether to only update changed fields
    """
    with db_session() as session:
        session.bulk_save_objects(
            objects, return_defaults=return_defaults, update_changed_only=update_changed_only
        )


def bulk_insert_mappings(mapper, mappings, *, return_defaults=False):
    """Efficiently insert multiple mappings to database.

    Args:
        mapper: SQLAlchemy mapper
        mappings: List of dictionaries containing column mappings
        return_defaults: Whether to return default values
    """
    with db_session() as session:
        session.bulk_insert_mappings(mapper, mappings, return_defaults=return_defaults)
