"""
Backup system configuration for DojoPool.
Handles all backup-related settings and provides configuration validation.
"""

import os
from pathlib import Path
from typing import Dict, List, Optional

from pydantic import BaseSettings, Field


class BackupSettings(BaseSettings):
    """Backup system settings with validation."""

    # General settings
    BACKUP_ENABLED: bool = Field(True, description="Enable/disable backup system")
    BACKUP_ROOT_DIR: Path = Field(
        Path("/var/backups/dojopool"), description="Root directory for all backups"
    )

    # Database backup settings
    DB_BACKUP_ENABLED: bool = Field(True, description="Enable database backups")
    DB_BACKUP_FREQUENCY: str = Field(
        "0 */4 * * *", description="Cron schedule for database backups"
    )
    DB_BACKUP_RETENTION_DAYS: int = Field(7, description="Days to keep database backups")
    DB_BACKUP_COMPRESSION: bool = Field(True, description="Enable backup compression")

    # File backup settings
    FILE_BACKUP_ENABLED: bool = Field(True, description="Enable file backups")
    FILE_BACKUP_FREQUENCY: str = Field("0 0 * * *", description="Cron schedule for file backups")
    FILE_BACKUP_RETENTION_DAYS: int = Field(30, description="Days to keep file backups")
    FILE_BACKUP_PATHS: List[Path] = Field(
        [Path("/var/dojopool/uploads"), Path("/var/dojopool/static"), Path("/etc/dojopool")],
        description="Paths to backup",
    )

    # Remote backup settings
    REMOTE_BACKUP_ENABLED: bool = Field(False, description="Enable remote backups")
    REMOTE_BACKUP_TYPE: str = Field("s3", description="Remote backup type (s3, ftp, etc)")
    REMOTE_BACKUP_URL: Optional[str] = Field(None, description="Remote backup destination URL")
    REMOTE_BACKUP_CREDENTIALS: Dict[str, str] = Field(
        default_factory=dict, description="Credentials for remote backup"
    )

    # Encryption settings
    BACKUP_ENCRYPTION_ENABLED: bool = Field(True, description="Enable backup encryption")
    BACKUP_ENCRYPTION_KEY: Optional[str] = Field(None, description="Encryption key for backups")

    # Notification settings
    BACKUP_NOTIFICATIONS_ENABLED: bool = Field(True, description="Enable backup notifications")
    BACKUP_NOTIFICATION_EMAIL: Optional[str] = Field(
        None, description="Email for backup notifications"
    )
    BACKUP_NOTIFICATION_SLACK_WEBHOOK: Optional[str] = Field(
        None, description="Slack webhook for notifications"
    )

    class Config:
        env_prefix = "DOJOPOOL_BACKUP_"
        case_sensitive = True

    def get_backup_dirs(self) -> Dict[str, Path]:
        """Get all required backup directories."""
        return {
            "root": self.BACKUP_ROOT_DIR,
            "database": self.BACKUP_ROOT_DIR / "database",
            "files": self.BACKUP_ROOT_DIR / "files",
            "logs": self.BACKUP_ROOT_DIR / "logs",
        }

    def validate_paths(self) -> None:
        """Validate and create necessary backup directories."""
        for dir_path in self.get_backup_dirs().values():
            dir_path.mkdir(parents=True, exist_ok=True)
            if not os.access(dir_path, os.W_OK):
                raise PermissionError(f"Cannot write to backup directory: {dir_path}")


# Load settings from environment
backup_settings = BackupSettings()
