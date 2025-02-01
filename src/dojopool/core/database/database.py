"""Core database module."""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, ForeignKey, Integer

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
