"""Database migration utilities."""

import logging
from typing import Optional

from alembic import context
from flask import current_app
from flask_migrate import Migrate

from dojopool.core.extensions import db

logger = logging.getLogger(__name__)


def run_migrations() -> None:
    """Run database migrations."""
    # Get database URL
    url = current_app.config.get("SQLALCHEMY_DATABASE_URI")
    if not url:
        raise RuntimeError("SQLALCHEMY_DATABASE_URI not set")

    # Configure migration context
    config = context.config
    config.set_main_option("sqlalchemy.url", url)

    # Configure target metadata
    target_metadata = db.metadata

    # Run migrations
    with context.begin_transaction():
        context.run_migrations()


def init_migrations(app: Optional[Migrate] = None):
    """Initialize database migrations.

    Args:
        app: Optional Flask-Migrate instance
    """
    # Configure migration context
    if context.is_offline_mode():
        run_migrations()
    else:
        with app.app_context():
            run_migrations()


def create_tables() -> None:
    """Create all database tables."""
    db.create_all()


def drop_tables():
    """Drop all database tables."""
    db.drop_all()


def reset_tables():
    """Reset all database tables."""
    drop_tables()
    create_tables()
