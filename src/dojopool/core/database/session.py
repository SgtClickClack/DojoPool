"""Database session management for DojoPool."""

from contextlib import contextmanager
from typing import Any, Dict, Generator, List, Optional, Tuple, Union

from flask import Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from . import db


@contextmanager
def db_session() -> Generator[Any, None, None]:
    """Context manager for database sessions.

    Yields:
        Database session object

    Raises:
        Exception: If any database error occurs
    """
    session = db.session()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


def atomic_transaction(func):
    """Decorator for atomic database transactions.

    Args:
        func: Function to wrap with transaction

    Returns:
        Wrapped function
    """

    def wrapper(*args, **kwargs):
        with db_session() as session:
            return func(session, *args, **kwargs)

    return wrapper


def bulk_save_objects(
    objects: List[Any],
    *,
    return_defaults: bool = False,
    update_changed_only: bool = True,
):
    """Bulk save objects to database.

    Args:
        objects: List of objects to save
        return_defaults: Whether to return default values
        update_changed_only: Whether to only update changed fields
    """
    with db_session() as session:
        session.bulk_save_objects(
            objects,
            return_defaults=return_defaults,
            update_changed_only=update_changed_only,
        )


def bulk_insert_mappings(
    mapper: Any, mappings: List[Dict[str, Any]], *, return_defaults: bool = False
):
    """Bulk insert mappings to database.

    Args:
        mapper: SQLAlchemy mapper
        mappings: List of mappings to insert
        return_defaults: Whether to return default values
    """
    with db_session() as session:
        session.bulk_insert_mappings(mapper, mappings, return_defaults=return_defaults)
