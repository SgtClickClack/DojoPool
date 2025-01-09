"""Database migrations module.

This module provides database migration functionality using Alembic.
"""

from flask import current_app
from flask_migrate import Migrate
from alembic import context
from src.core.database import db, metadata

def run_migrations():
    """Run database migrations."""
    # Get database URL from app config
    url = current_app.config['SQLALCHEMY_DATABASE_URI']
    
    # Configure migration context
    context.configure(
        url=url,
        target_metadata=metadata,
        compare_type=True,
        compare_server_default=True,
        include_schemas=True,
        version_table='alembic_version',
        transaction_per_migration=True,
        user_module_prefix=None
    )
    
    # Run migration
    with context.begin_transaction():
        context.run_migrations()

def init_migrations(app):
    """Initialize database migrations.
    
    Args:
        app: Flask application instance
    """
    migrate = Migrate(app, db)
    migrate.init_app(app, db)
    
    # Configure Alembic context
    if context.is_offline_mode():
        run_migrations()

def create_tables():
    """Create all database tables."""
    db.create_all()

def drop_tables():
    """Drop all database tables."""
    db.drop_all()

def reset_tables():
    """Reset all database tables."""
    drop_tables()
    create_tables()