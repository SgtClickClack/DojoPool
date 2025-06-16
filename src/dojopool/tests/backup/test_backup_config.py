"""Unit tests for backup configuration."""

import os
from pathlib import Path
from unittest.mock import patch

import pytest
import tempfile
from unittest.mock import Mock

from dojopool.config.backup_config import BackupSettings
from dojopool.backup.backup_manager import BackupManager


def test_backup_settings_defaults():
    """Test default backup settings."""
    settings = BackupSettings()
    assert settings.BACKUP_ENABLED is True
    assert isinstance(settings.BACKUP_ROOT_DIR, Path)
    assert settings.DB_BACKUP_ENABLED is True
    assert settings.FILE_BACKUP_ENABLED is True
    assert settings.BACKUP_ENCRYPTION_ENABLED is True


def test_backup_dirs():
    """Test backup directory structure."""
    settings = BackupSettings(BACKUP_ROOT_DIR=Path("/tmp/test_backups"))
    dirs = settings.get_backup_dirs()
    assert "root" in dirs
    assert "database" in dirs
    assert "files" in dirs
    assert "logs" in dirs
    assert dirs["database"] == Path("/tmp/test_backups/database")


@pytest.mark.parametrize("dir_exists", [True, False])
def test_validate_paths(dir_exists, tmp_path):
    """Test path validation with and without existing directories."""
    settings = BackupSettings(BACKUP_ROOT_DIR=tmp_path)

    if dir_exists:
        for dir_path in settings.get_backup_dirs().values():
            dir_path.mkdir(parents=True, exist_ok=True)

    settings.validate_paths()

    for dir_path in settings.get_backup_dirs().values():
        assert dir_path.exists()
        assert dir_path.is_dir()


def test_validate_paths_permission_error(tmp_path):
    """Test path validation with permission error."""
    settings = BackupSettings(BACKUP_ROOT_DIR=tmp_path)

    # Make directory read-only
    tmp_path.chmod(0o500)

    with pytest.raises(PermissionError):
        settings.validate_paths()


def test_backup_settings_from_env():
    """Test loading settings from environment variables."""
    env_vars = {
        "DOJOPOOL_BACKUP_BACKUP_ENABLED": "false",
        "DOJOPOOL_BACKUP_DB_BACKUP_RETENTION_DAYS": "14",
        "DOJOPOOL_BACKUP_FILE_BACKUP_FREQUENCY": "0 0 * * *",
        "DOJOPOOL_BACKUP_REMOTE_BACKUP_ENABLED": "true",
        "DOJOPOOL_BACKUP_REMOTE_BACKUP_TYPE": "s3",
        "DOJOPOOL_BACKUP_REMOTE_BACKUP_URL": "s3://my-bucket",
    }

    with patch.dict(os.environ, env_vars):
        settings = BackupSettings()
        assert settings.BACKUP_ENABLED is False
        assert settings.DB_BACKUP_RETENTION_DAYS == 14
        assert settings.FILE_BACKUP_FREQUENCY == "0 0 * * *"
        assert settings.REMOTE_BACKUP_ENABLED is True
        assert settings.REMOTE_BACKUP_TYPE == "s3"
        assert settings.REMOTE_BACKUP_URL == "s3://my-bucket"


def test_backup_paths_validation():
    """Test backup paths validation."""
    settings = BackupSettings(
        FILE_BACKUP_PATHS=[Path("/path/one"), Path("/path/two"), Path("/path/three")]
    )
    assert len(settings.FILE_BACKUP_PATHS) == 3
    assert all(isinstance(p, Path) for p in settings.FILE_BACKUP_PATHS)
