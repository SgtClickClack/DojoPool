"""
Backup system configuration for DojoPool.
Handles all backup-related settings and provides configuration validation.
"""

import os
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, FrozenSet, List, Optional, Set, Tuple, TypedDict, Union
from uuid import UUID

from pydantic import (
    AnyUrl,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    Json,
    SecretStr,
    validator,
)
from pydantic.color import Color
from pydantic.networks import IPAddress
from pydantic_settings import BaseSettings


class BackupPaths(TypedDict):
    """Backup paths configuration."""

    root: Path
    database: Path
    files: Path
    logs: Path


class RemoteConfig(TypedDict):
    """Remote backup configuration."""

    enabled: bool
    type: str  # s3, ftp, etc.
    url: str
    credentials: Dict[str, str]


class BackupSettings(BaseSettings):
    """Backup settings configuration."""

    # General settings
    BACKUP_ENABLED: bool = True
    BACKUP_ROOT_DIR: Path = Path("/var/backups/dojopool")
    BACKUP_ENCRYPTION_ENABLED: bool = True
    BACKUP_ENCRYPTION_KEY: Optional[str] = None

    # Database backup settings
    DB_BACKUP_ENABLED: bool = True
    DB_BACKUP_FREQUENCY: str = "0 0 * * *"  # Daily at midnight
    DB_BACKUP_RETENTION_DAYS: int = 30
    DB_BACKUP_COMPRESSION: bool = True

    # File backup settings
    FILE_BACKUP_ENABLED: bool = True
    FILE_BACKUP_FREQUENCY: str = "0 0 * * *"  # Daily at midnight
    FILE_BACKUP_RETENTION_DAYS: int = 30
    FILE_BACKUP_COMPRESSION: bool = True
    FILE_BACKUP_PATHS: List[Path] = []

    # Remote backup settings
    REMOTE_BACKUP_ENABLED: bool = False
    REMOTE_BACKUP_TYPE: str = "s3"
    REMOTE_BACKUP_URL: str = ""
    REMOTE_BACKUP_CREDENTIALS: Dict[str, str] = {}

    # Notification settings
    BACKUP_NOTIFICATIONS_ENABLED: bool = True
    BACKUP_NOTIFICATION_EMAIL: Optional[str] = None
    BACKUP_NOTIFICATION_SLACK_WEBHOOK: Optional[str] = None

    class Config:
        """Pydantic config."""

        env_prefix: str = "DOJOPOOL_BACKUP_"
        case_sensitive: bool = True

    def get_backup_dirs(self) -> BackupPaths:
        """Get backup directories."""
        root: Any = self.BACKUP_ROOT_DIR
        return {
            "root": root,
            "database": root / "database",
            "files": root / "files",
            "logs": root / "logs",
        }

    def get_remote_config(self):
        """Get remote backup configuration."""
        return {
            "enabled": self.REMOTE_BACKUP_ENABLED,
            "type": self.REMOTE_BACKUP_TYPE,
            "url": self.REMOTE_BACKUP_URL,
            "credentials": self.REMOTE_BACKUP_CREDENTIALS,
        }

    def validate_paths(self):
        """Validate and create backup directories if they don't exist."""
        for dir_path in self.get_backup_dirs().values():
            if not dir_path.exists():
                dir_path.mkdir(parents=True, exist_ok=True)
            elif not dir_path.is_dir():
                raise ValueError(f"{dir_path} exists but is not a directory")
            elif not os.access(dir_path, os.W_OK):
                raise PermissionError(f"No write permission for {dir_path}")

    def get_backup_filename(
        self, backup_type: str, timestamp: Optional[datetime] = None
    ):
        """Generate backup filename."""
        if timestamp is None:
            timestamp: Any = datetime.utcnow()
        return f"backup_{backup_type}_{timestamp.strftime('%Y%m%d_%H%M%S')}.tar.gz"


# Load settings from environment
backup_settings: BackupSettings = BackupSettings()
