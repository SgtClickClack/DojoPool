"""Unit tests for backup manager."""

import os
import tempfile
import shutil
from unittest.mock import MagicMock, patch

import pytest
from cryptography.fernet import Fernet

from dojopool.backup.backup_manager import BackupManager
from dojopool.config import BackupSettings


@pytest.fixture
def backup_dir(tmp_path):
    """Create temporary backup directory."""
    backup_dir = tmp_path / "backups"
    backup_dir.mkdir()
    return backup_dir


@pytest.fixture
def mock_settings(backup_dir):
    """Create mock backup settings."""
    settings = BackupSettings(
        BACKUP_ROOT_DIR=backup_dir,
        DB_BACKUP_ENABLED=True,
        FILE_BACKUP_ENABLED=True,
        BACKUP_ENCRYPTION_ENABLED=True,
        REMOTE_BACKUP_ENABLED=False,
    )
    with patch("dojopool.backup.backup_manager.backup_settings", settings):
        yield settings


@pytest.fixture
def backup_manager(mock_settings):
    """Create backup manager instance."""
    return BackupManager()


def test_backup_manager_initialization(backup_manager, mock_settings):
    """Test backup manager initialization."""
    assert backup_manager.settings == mock_settings
    assert backup_manager.fernet is not None
    assert backup_manager.s3 is None


def test_encryption_setup_with_key(mock_settings):
    """Test encryption setup with provided key."""
    key = Fernet.generate_key()
    mock_settings.BACKUP_ENCRYPTION_KEY = key.decode()
    manager = BackupManager()
    assert manager.fernet.encrypt(b"test") != b"test"


def test_encryption_setup_without_key(mock_settings):
    """Test encryption setup without key."""
    mock_settings.BACKUP_ENCRYPTION_KEY = None
    manager = BackupManager()
    assert manager.fernet is not None
    assert manager.fernet.encrypt(b"test") != b"test"


@patch("boto3.client")
def test_remote_setup_s3(mock_boto3, mock_settings):
    """Test S3 remote setup."""
    mock_settings.REMOTE_BACKUP_ENABLED = True
    mock_settings.REMOTE_BACKUP_TYPE = "s3"
    mock_settings.REMOTE_BACKUP_CREDENTIALS = {
        "aws_access_key_id": "test_key",
        "aws_secret_access_key": "test_secret",
    }

    BackupManager()
    mock_boto3.assert_called_once_with(
        "s3", aws_access_key_id="test_key", aws_secret_access_key="test_secret"
    )


@patch("subprocess.run")
def test_database_backup(mock_run, backup_manager, backup_dir):
    """Test database backup creation."""
    mock_run.return_value = MagicMock(returncode=0)

    backup_file = backup_manager.backup_database()

    assert backup_file is not None
    assert backup_file.exists()
    assert backup_file.suffix == ".gz"
    mock_run.assert_called_once()


@patch("subprocess.run")
def test_database_backup_failure(mock_run, backup_manager):
    """Test database backup failure handling."""
    mock_run.side_effect = Exception("Backup failed")

    backup_file = backup_manager.backup_database()

    assert backup_file is None


def test_file_backup(backup_manager, tmp_path):
    """Test file backup creation."""
    # Create test files
    test_dir = tmp_path / "test_files"
    test_dir.mkdir()
    (test_dir / "file1.txt").write_text("test1")
    (test_dir / "file2.txt").write_text("test2")

    backup_manager.settings.FILE_BACKUP_PATHS = [test_dir]
    backup_files = backup_manager.backup_files()

    assert len(backup_files) == 1
    assert backup_files[0].exists()
    assert backup_files[0].suffix == ".gz"


@patch("boto3.client")
def test_remote_backup_upload(mock_boto3, backup_manager, tmp_path):
    """Test remote backup upload."""
    mock_s3 = MagicMock()
    mock_boto3.return_value = mock_s3
    backup_manager.settings.REMOTE_BACKUP_ENABLED = True
    backup_manager.settings.REMOTE_BACKUP_URL = "s3://test-bucket"
    backup_manager.s3 = mock_s3

    test_file = tmp_path / "test_backup.gz"
    test_file.write_text("test")

    success = backup_manager.upload_to_remote(test_file)

    assert success is True
    mock_s3.upload_file.assert_called_once_with(
        str(test_file), "test-bucket", f"backups/{test_file.name}"
    )


def test_cleanup_old_backups(backup_manager, backup_dir):
    """Test cleanup of old backups."""
    # Create test backup files
    old_backup = backup_dir / "database" / "old_backup.sql.gz"
    new_backup = backup_dir / "database" / "new_backup.sql.gz"
    old_backup.parent.mkdir(exist_ok=True)
    old_backup.touch()
    new_backup.touch()

    # Set old backup's mtime to past retention period
    old_time = backup_manager.settings.DB_BACKUP_RETENTION_DAYS + 1
    os.utime(old_backup, (old_time, old_time))

    backup_manager.cleanup_old_backups()

    assert not old_backup.exists()
    assert new_backup.exists()


@patch("dojopool.backup.backup_manager.send_notification")
def test_backup_notifications(mock_send, backup_manager):
    """Test backup notifications."""
    backup_manager.settings.BACKUP_NOTIFICATIONS_ENABLED = True
    backup_manager._send_notification("Test Subject", "Test Message")

    mock_send.assert_called_once_with(
        subject="Test Subject",
        message="Test Message",
        email=backup_manager.settings.BACKUP_NOTIFICATION_EMAIL,
        slack_webhook=backup_manager.settings.BACKUP_NOTIFICATION_SLACK_WEBHOOK,
    )
