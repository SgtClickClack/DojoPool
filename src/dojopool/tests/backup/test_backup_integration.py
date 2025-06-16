"""Integration tests for backup system."""

import os
import shutil
import tempfile
import time
from pathlib import Path
from unittest.mock import patch

import pytest

from dojopool.backup.backup_manager import BackupManager
from dojopool.config.backup_config import BackupSettings


@pytest.fixture
def test_env():
    """Set up test environment."""
    # Create temporary directories
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Create test data directory structure
        data_dir = temp_path / "data"
        data_dir.mkdir()

        # Create test files
        (data_dir / "file1.txt").write_text("Test file 1 content")
        (data_dir / "file2.txt").write_text("Test file 2 content")

        # Create backup directory
        backup_dir = temp_path / "backups"
        backup_dir.mkdir()

        # Create test database dump
        db_dump = "CREATE TABLE test (id INT, name TEXT);\n"
        db_dump += "INSERT INTO test VALUES (1, 'test1');\n"
        (data_dir / "test_db.sql").write_text(db_dump)

        yield {"temp_dir": temp_path, "data_dir": data_dir, "backup_dir": backup_dir}


@pytest.fixture
def backup_settings(test_env):
    """Create test backup settings."""
    return BackupSettings(
        BACKUP_ROOT_DIR=test_env["backup_dir"],
        DB_BACKUP_ENABLED=True,
        FILE_BACKUP_ENABLED=True,
        BACKUP_ENCRYPTION_ENABLED=True,
        FILE_BACKUP_PATHS=[test_env["data_dir"]],
        DB_BACKUP_RETENTION_DAYS=7,
        FILE_BACKUP_RETENTION_DAYS=30,
    )


@pytest.fixture
def backup_manager(backup_settings):
    """Create backup manager with test settings."""
    with patch("dojopool.backup.backup_manager.backup_settings", backup_settings):
        return BackupManager()


def test_full_backup_cycle(backup_manager, test_env):
    """Test complete backup cycle including database and files."""
    # Run backup
    backup_manager.run_backup()

    # Verify backup directories exist
    backup_dirs = backup_manager.settings.get_backup_dirs()
    assert all(d.exists() for d in backup_dirs.values())

    # Verify database backup
    db_backups = list(backup_dirs["database"].glob("*.sql.gz"))
    assert len(db_backups) == 1
    assert db_backups[0].stat().st_size > 0

    # Verify file backups
    file_backups = list(backup_dirs["files"].glob("*.tar.gz"))
    assert len(file_backups) == 1
    assert file_backups[0].stat().st_size > 0


def test_backup_encryption(backup_manager, test_env):
    """Test backup encryption and decryption."""
    # Run backup
    backup_manager.run_backup()

    # Get backup files
    backup_dirs = backup_manager.settings.get_backup_dirs()
    db_backup = next(backup_dirs["database"].glob("*.sql.gz"))

    # Verify content is encrypted
    with open(db_backup, "rb") as f:
        content = f.read()

    # Try to decrypt
    decrypted = backup_manager.fernet.decrypt(content)
    assert decrypted != content
    assert len(decrypted) > 0


def test_backup_retention(backup_manager, test_env):
    """Test backup retention policy."""
    backup_dirs = backup_manager.settings.get_backup_dirs()

    # Create old and new backups
    old_backup = backup_dirs["database"] / "old_backup.sql.gz"
    new_backup = backup_dirs["database"] / "new_backup.sql.gz"

    old_backup.parent.mkdir(exist_ok=True)
    old_backup.write_bytes(b"old backup")
    new_backup.write_bytes(b"new backup")

    # Set old backup's mtime to past retention period
    old_time = time.time() - (backup_manager.settings.DB_BACKUP_RETENTION_DAYS + 1) * 86400
    os.utime(old_backup, (old_time, old_time))

    # Run cleanup
    backup_manager.cleanup_old_backups()

    # Verify old backup is removed and new backup remains
    assert not old_backup.exists()
    assert new_backup.exists()


@patch("boto3.client")
def test_remote_backup_cycle(mock_boto3, backup_manager, test_env):
    """Test remote backup functionality."""
    # Configure remote backup
    backup_manager.settings.REMOTE_BACKUP_ENABLED = True
    backup_manager.settings.REMOTE_BACKUP_URL = "s3://test-bucket"
    mock_s3 = mock_boto3.return_value
    backup_manager.s3 = mock_s3

    # Run backup
    backup_manager.run_backup()

    # Verify S3 upload calls
    upload_calls = mock_s3.upload_file.call_args_list
    assert len(upload_calls) > 0
    for call in upload_calls:
        assert call[0][1] == "test-bucket"
        assert call[0][2].startswith("backups/")


def test_recovery_scenario(backup_manager, test_env):
    """Test backup recovery scenario."""
    # Run initial backup
    backup_manager.run_backup()

    # Simulate data loss
    shutil.rmtree(test_env["data_dir"])
    test_env["data_dir"].mkdir()

    # Get latest backups
    backup_dirs = backup_manager.settings.get_backup_dirs()
    db_backup = next(backup_dirs["database"].glob("*.sql.gz"))
    file_backup = next(backup_dirs["files"].glob("*.tar.gz"))

    # Verify backups exist and can be used for recovery
    assert db_backup.exists()
    assert file_backup.exists()

    # Decrypt backups
    with open(db_backup, "rb") as f:
        db_content = backup_manager.fernet.decrypt(f.read())
    assert len(db_content) > 0

    with open(file_backup, "rb") as f:
        file_content = backup_manager.fernet.decrypt(f.read())
    assert len(file_content) > 0
