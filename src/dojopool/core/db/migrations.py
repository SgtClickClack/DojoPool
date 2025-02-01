"""Database migration manager for DojoPool."""

from pathlib import Path

from flask import current_app
from flask_migrate import Migrate, downgrade, migrate, revision, upgrade


class MigrationManager:
    """Migration management utilities."""

    def __init__(self, migrate: Migrate):
        """Initialize migration manager.

        Args:
            migrate: Flask-Migrate instance
        """
        self.migrate = migrate

    def create_migration(self, message: str = None):
        """Create a new migration.

        Args:
            message: Migration message
        """
        with current_app.app_context():
            revision(message=message)
            current_app.logger.info("Created new migration revision")

    def auto_migrate(self, message: str = None):
        """Automatically create migration based on model changes.

        Args:
            message: Migration message
        """
        with current_app.app_context():
            migrate(message=message)
            current_app.logger.info("Created automatic migration")

    def upgrade(self, revision: str = "head"):
        """Upgrade database to a later version.

        Args:
            revision: Target revision (default: head)
        """
        with current_app.app_context():
            upgrade(revision=revision)
            current_app.logger.info(f"Upgraded database to: {revision}")

    def downgrade(self, revision: str = "-1"):
        """Downgrade database to a previous version.

        Args:
            revision: Target revision (default: -1)
        """
        with current_app.app_context():
            downgrade(revision=revision)
            current_app.logger.info(f"Downgraded database to: {revision}")

    def get_current_revision(self):
        """Get current migration revision.

        Returns:
            str: Current revision
        """
        migrations_dir = Path(current_app.root_path) / "migrations"
        if not migrations_dir.exists():
            return None

        with current_app.app_context():
            from flask_migrate import current

            return current()
