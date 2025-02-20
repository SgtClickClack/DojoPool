"""Unit tests for backup manager."""

import gzip
import os
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Generator, List
from unittest.mock import MagicMock, Mock, patch

import boto3
import pytest
from botocore.exceptions import ClientError

from dojopool.config.backup_config import BackupSettings
from dojopool.core.backup.backup_manager import BackupManager


@pytest.fixture
def backup_dir() -> Path:
    """Create a temporary backup directory."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)


@pytest.fixture
def backup_settings(backup_dir: Path):
    """Create backup settings with test directories."""
    return BackupSettings(
        BACKUP_ROOT_DIR=backup_dir,
        DB_BACKUP_ENABLED=True,
        FILE_BACKUP_ENABLED=True,
        DB_BACKUP_RETENTION_DAYS=7,
        FILE_BACKUP_RETENTION_DAYS=30,
        DB_BACKUP_COMPRESSION=True,
    )


@pytest.fixture
def backup_manager(backup_settings: BackupSettings):
    """Create a backup manager instance."""
    return BackupManager(settings=backup_settings)


def create_test_file(
    path: Path, days_old: int = 0, size: int = 1024, content: bytes = None
):
    """Create a test backup file with specified age and size."""
    path.parent.mkdir(parents=True, exist_ok=True)

    if content is None:
        content = b"x" * size

    path.write_bytes(content)

    if days_old > 0:
        old_time = datetime.now() - timedelta(days=days_old)
        os.utime(path, (old_time.timestamp(), old_time.timestamp()))

    return path


def create_compressed_file(path: Path, content: bytes = b"test data") -> Path:
    """Create a gzip compressed test file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(path, "wb") as f:
        f.write(content)
    return path


def test_get_backup_files(backup_manager: BackupManager, backup_dir: Path):
    """Test getting backup files sorted by modification time."""
    # Create test files with different ages
    files = [
        create_test_file(backup_dir / "backup1.db", days_old=5),
        create_test_file(backup_dir / "backup2.db", days_old=3),
        create_test_file(backup_dir / "backup3.db", days_old=1),
    ]

    result = backup_manager.get_backup_files(backup_dir)
    assert len(result) == 3
    assert result == sorted(files, key=lambda x: x.stat().st_mtime)


def test_should_retain_backup(backup_manager: BackupManager, backup_dir: Path):
    """Test backup retention logic."""
    retention_days = 7

    # Create test files
    old_file = create_test_file(backup_dir / "old.db", days_old=10)
    new_file = create_test_file(backup_dir / "new.db", days_old=3)

    assert not backup_manager.should_retain_backup(old_file, retention_days)
    assert backup_manager.should_retain_backup(new_file, retention_days)


def test_verify_backup(backup_manager: BackupManager, backup_dir: Path):
    """Test backup verification."""
    # Valid backup
    valid_file = create_test_file(backup_dir / "valid.db", size=1024)
    assert backup_manager.verify_backup(valid_file)

    # Empty backup
    empty_file = create_test_file(backup_dir / "empty.db", size=0)
    assert not backup_manager.verify_backup(empty_file)

    # Non-existent backup
    non_existent = backup_dir / "non_existent.db"
    assert not backup_manager.verify_backup(non_existent)

    # Valid compressed backup
    valid_compressed = create_compressed_file(backup_dir / "valid.db.gz")
    assert backup_manager.verify_backup(valid_compressed)

    # Invalid compressed backup
    invalid_compressed = create_test_file(
        backup_dir / "invalid.db.gz", content=b"not gzipped"
    )
    assert not backup_manager.verify_backup(invalid_compressed)


def test_compress_file(backup_manager: BackupManager, backup_dir: Path) -> None:
    """Test file compression."""
    # Create test file
    test_content = b"test data for compression"
    original_file = create_test_file(backup_dir / "test.db", content=test_content)

    # Compress file
    compressed_file = backup_manager.compress_file(original_file)
    assert compressed_file is not None
    assert compressed_file.exists()
    assert compressed_file.suffix == ".gz"
    assert not original_file.exists()  # Original should be deleted

    # Verify compressed content
    with gzip.open(compressed_file, "rb") as f:
        assert f.read() == test_content


def test_decompress_file(backup_manager: BackupManager, backup_dir: Path):
    """Test file decompression."""
    # Create compressed test file
    test_content = b"test data for decompression"
    compressed_file = create_compressed_file(backup_dir / "test.db.gz", test_content)

    # Decompress file
    decompressed_file = backup_manager.decompress_file(compressed_file)
    assert decompressed_file is not None
    assert decompressed_file.exists()
    assert decompressed_file.suffix == ".db"

    # Verify decompressed content
    assert decompressed_file.read_bytes() == test_content


def test_rotate_backups(backup_manager: BackupManager, backup_dir: Path):
    """Test backup rotation."""
    # Create test database backups
    db_dir = backup_dir / "database"
    create_test_file(db_dir / "old_db.db", days_old=10)
    create_test_file(db_dir / "new_db.db", days_old=3)

    # Create test file backups
    file_dir = backup_dir / "files"
    create_test_file(file_dir / "old_file.zip", days_old=40)
    new_file = create_test_file(file_dir / "new_file.zip", days_old=20)

    # Rotate backups
    backup_manager.rotate_backups()

    # Check results
    assert not (db_dir / "old_db.db").exists()  # Old file should be deleted
    assert not (db_dir / "new_db.db").exists()  # Original should be compressed
    assert (db_dir / "new_db.db.gz").exists()  # Should exist as compressed
    assert not (file_dir / "old_file.zip").exists()  # Old file should be deleted

    # Since file backups are not configured for compression, this should remain uncompressed
    assert (file_dir / "new_file.zip").exists()  # Should remain as is

    # Verify the compressed file can be decompressed
    compressed_file = db_dir / "new_db.db.gz"
    decompressed = backup_manager.decompress_file(compressed_file)
    assert decompressed is not None
    assert decompressed.exists()


def test_cleanup_invalid_backups(backup_manager: BackupManager, backup_dir: Path):
    """Test cleanup of invalid backups."""
    # Create test invalid backups
    invalid_dir = backup_dir / "database" / "invalid"
    old_invalid = create_test_file(invalid_dir / "old_invalid.db", days_old=40)
    new_invalid = create_test_file(invalid_dir / "new_invalid.db", days_old=20)

    # Clean up invalid backups
    backup_manager.cleanup_invalid_backups(max_age_days=30)

    # Check results
    assert not old_invalid.exists()
    assert new_invalid.exists()


def test_rotate_backups_with_invalid_files(
    backup_manager: BackupManager, backup_dir: Path
) -> None:
    """Test backup rotation with invalid files."""
    # Create test backups
    db_dir = backup_dir / "database"
    valid_file = create_test_file(db_dir / "valid.db", days_old=10)
    invalid_file = create_test_file(db_dir / "invalid.db", days_old=10, size=0)

    # Rotate backups
    backup_manager.rotate_backups()

    # Check results
    assert not valid_file.exists()  # Old valid file should be deleted
    assert not invalid_file.exists()  # Old invalid file should be moved
    assert (db_dir / "invalid" / "invalid.db").exists()  # Invalid file should be moved


@patch("boto3.client")
def test_s3_client_setup(mock_boto3: MagicMock, backup_manager: BackupManager):
    """Test S3 client initialization."""
    # Reset s3_client
    backup_manager.s3_client = None

    # Test with S3 disabled
    backup_manager.settings.REMOTE_BACKUP_ENABLED = False
    backup_manager._setup_s3_client()
    assert backup_manager.s3_client is None

    # Test with S3 enabled but missing credentials
    backup_manager.settings.REMOTE_BACKUP_ENABLED = True
    backup_manager.settings.REMOTE_BACKUP_TYPE = "s3"
    backup_manager.settings.REMOTE_BACKUP_CREDENTIALS = {}
    backup_manager._setup_s3_client()
    assert backup_manager.s3_client is None

    # Test with valid credentials
    backup_manager.settings.REMOTE_BACKUP_CREDENTIALS = {
        "aws_access_key_id": "test_key",
        "aws_secret_access_key": "test_secret",
    }
    mock_boto3.return_value = MagicMock()
    backup_manager._setup_s3_client()
    mock_boto3.assert_called_once_with(
        "s3", aws_access_key_id="test_key", aws_secret_access_key="test_secret"
    )


@patch("boto3.client")
def test_upload_to_s3(
    mock_boto3: MagicMock, backup_manager: BackupManager, backup_dir: Path
):
    """Test uploading files to S3."""
    # Create test file
    test_file = create_test_file(backup_dir / "test.db")

    # Configure S3 settings
    backup_manager.settings.REMOTE_BACKUP_ENABLED = True
    backup_manager.settings.REMOTE_BACKUP_TYPE = "s3"
    backup_manager.settings.REMOTE_BACKUP_URL = "s3://test-bucket/backups"
    mock_s3 = mock_boto3.return_value
    backup_manager.s3_client = mock_s3

    # Test successful upload
    assert backup_manager.upload_to_s3(test_file)
    mock_s3.upload_file.assert_called_once_with(
        str(test_file), "test-bucket", "backups/test.db"
    )

    # Test upload with non-existent file
    non_existent = backup_dir / "non_existent.db"
    assert not backup_manager.upload_to_s3(non_existent)

    # Test upload with S3 error
    mock_s3.upload_file.side_effect = ClientError(
        {"Error": {"Code": "TestError", "Message": "test error"}}, "test_operation"
    )
    assert not backup_manager.upload_to_s3(test_file)


@patch("boto3.client")
def test_download_from_s3(
    mock_boto3: MagicMock, backup_manager: BackupManager, backup_dir: Path
) -> None:
    """Test downloading files from S3."""
    # Configure S3 settings
    backup_manager.settings.REMOTE_BACKUP_ENABLED = True
    backup_manager.settings.REMOTE_BACKUP_TYPE = "s3"
    backup_manager.settings.REMOTE_BACKUP_URL = "s3://test-bucket/backups"
    mock_s3 = mock_boto3.return_value
    backup_manager.s3_client = mock_s3

    local_path = backup_dir / "downloaded.db"

    # Test successful download
    assert backup_manager.download_from_s3("backups/test.db", local_path)
    mock_s3.download_file.assert_called_once_with(
        "test-bucket", "backups/test.db", str(local_path)
    )

    # Test download with S3 error
    mock_s3.download_file.side_effect = ClientError(
        {"Error": {"Code": "TestError", "Message": "test error"}}, "test_operation"
    )
    assert not backup_manager.download_from_s3("backups/test.db", local_path)


@patch("boto3.client")
def test_rotate_backups_with_s3(
    mock_boto3: MagicMock, backup_manager: BackupManager, backup_dir: Path
) -> None:
    """Test backup rotation with S3 integration."""
    # Configure S3 settings
    backup_manager.settings.REMOTE_BACKUP_ENABLED = True
    backup_manager.settings.REMOTE_BACKUP_TYPE = "s3"
    backup_manager.settings.REMOTE_BACKUP_URL = "s3://test-bucket/backups"
    mock_s3 = mock_boto3.return_value
    backup_manager.s3_client = mock_s3

    # Create test database backups
    db_dir = backup_dir / "database"
    db_dir.mkdir(parents=True, exist_ok=True)
    new_db = create_test_file(db_dir / "new_db.db", days_old=3)

    # Enable compression
    backup_manager.settings.DB_BACKUP_COMPRESSION = True

    # Rotate backups
    backup_manager.rotate_backups()

    # Verify S3 upload was called for compressed file
    mock_s3.upload_file.assert_called_once()
    call_args = mock_s3.upload_file.call_args[0]
    assert call_args[1] == "test-bucket"
    assert call_args[2].startswith("backups/") and call_args[2].endswith(".db.gz")
