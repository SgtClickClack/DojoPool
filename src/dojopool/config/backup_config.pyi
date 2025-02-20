"""Type stubs for backup configuration."""

from pathlib import Path
from typing import Dict, List, Optional

from pydantic_settings import BaseSettings

class BackupSettings(BaseSettings):
    """Backup system settings with validation."""

    BACKUP_ENABLED: bool
    BACKUP_ROOT_DIR: Path
    DB_BACKUP_ENABLED: bool
    DB_BACKUP_FREQUENCY: str
    DB_BACKUP_RETENTION_DAYS: int
    DB_BACKUP_COMPRESSION: bool
    FILE_BACKUP_ENABLED: bool
    FILE_BACKUP_FREQUENCY: str
    FILE_BACKUP_RETENTION_DAYS: int
    FILE_BACKUP_PATHS: List[Path]
    REMOTE_BACKUP_ENABLED: bool
    REMOTE_BACKUP_TYPE: str
    REMOTE_BACKUP_URL: Optional[str]
    REMOTE_BACKUP_CREDENTIALS: Dict[str, str]
    BACKUP_ENCRYPTION_ENABLED: bool
    BACKUP_ENCRYPTION_KEY: Optional[str]
    BACKUP_NOTIFICATIONS_ENABLED: bool
    BACKUP_NOTIFICATION_EMAIL: Optional[str]
    BACKUP_NOTIFICATION_SLACK_WEBHOOK: Optional[str]

    def get_backup_dirs(self) -> Dict[str, Path]: ...
    def validate_paths(self) -> None: ...

backup_settings: BackupSettings
