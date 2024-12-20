"""Database migrations management for DojoPool."""

import os
from typing import Optional
from flask import current_app
from alembic import command
from alembic.config import Config as AlembicConfig
from . import db, migrate

class MigrationManager:
    """Manage database migrations."""
    
    def __init__(self, app=None):
        """Initialize migration manager.
        
        Args:
            app: Flask application instance
        """
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize with Flask application.
        
        Args:
            app: Flask application instance
        """
        self.app = app
        
        # Ensure migrations directory exists
        migrations_dir = os.path.join(app.root_path, 'migrations')
        if not os.path.exists(migrations_dir):
            os.makedirs(migrations_dir)
    
    def get_config(self) -> AlembicConfig:
        """Get Alembic configuration.
        
        Returns:
            Alembic configuration object
        """
        config = AlembicConfig()
        config.set_main_option('script_location', 'migrations')
        config.set_main_option('sqlalchemy.url', self.app.config['SQLALCHEMY_DATABASE_URI'])
        return config
    
    def create(self, message: Optional[str] = None) -> None:
        """Create a new migration.
        
        Args:
            message: Migration message
        """
        config = self.get_config()
        command.revision(
            config,
            message=message,
            autogenerate=True
        )
        current_app.logger.info(f"Created migration: {message}")
    
    def upgrade(self, revision: str = 'head') -> None:
        """Upgrade database to a later version.
        
        Args:
            revision: Target revision (default: latest)
        """
        config = self.get_config()
        with self.app.app_context():
            command.upgrade(config, revision)
            current_app.logger.info(f"Upgraded database to: {revision}")
    
    def downgrade(self, revision: str) -> None:
        """Downgrade database to a previous version.
        
        Args:
            revision: Target revision
        """
        config = self.get_config()
        with self.app.app_context():
            command.downgrade(config, revision)
            current_app.logger.info(f"Downgraded database to: {revision}")
    
    def current(self) -> None:
        """Show current revision."""
        config = self.get_config()
        command.current(config)
    
    def history(self) -> None:
        """Show migration history."""
        config = self.get_config()
        command.history(config)
    
    def init_db(self) -> None:
        """Initialize database with migrations."""
        with self.app.app_context():
            if not os.path.exists(self.app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')):
                db.create_all()
                command.stamp(self.get_config(), 'head')
                current_app.logger.info("Initialized database with migrations") 