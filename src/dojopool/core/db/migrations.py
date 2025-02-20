"""Database migration manager for DojoPool."""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from flask import Response, current_app
from flask.typing import ResponseReturnValue
from flask_migrate import Migrate, downgrade, migrate, revision, upgrade
from werkzeug.wrappers import Response as WerkzeugResponse


class MigrationManager:
    """Migration management utilities."""

    def __init__(self, migrate: Migrate) -> None:
        """Initialize migration manager.

        Args:
            migrate: Flask-Migrate instance
        """
        self.migrate = migrate

    def create_migration(self, message: Optional[str] = None) -> str:
        """Create a new migration.

        Args:
            message: Optional migration message

        Returns:
            Path to created migration file
        """
        return revision(message=message)

    def auto_migrate(self, message: Optional[str] = None):
        """Create an automatic migration.

        Args:
            message: Optional migration message

        Returns:
            Path to created migration file
        """
        return migrate(message=message)

    def upgrade(self, revision: str = "head"):
        """Upgrade database to a later version.

        Args:
            revision: Target revision (default: head)
        """
        upgrade(revision)

    def downgrade(self, revision: str = "-1") -> None:
        """Downgrade database to a previous version.

        Args:
            revision: Target revision (default: -1)
        """
        downgrade(revision)

    def get_current_revision(self) -> Optional[str]:
        """Get current migration revision.

        Returns:
            Current revision or None if no migrations exist
        """
        try:
            with current_app.db.engine.connect() as conn:
                context = self.migrate.get_context()
                return context.get_current_revision()
        except Exception as e:
            current_app.logger.error(f"Failed to get current revision: {str(e)}")
            return None
