"""Unit tests for S3 backup functionality."""

import os
import tempfile
from pathlib import Path
from typing import Any, Dict, Generator
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from dojopool.config.backup_config import BackupSettings
from dojopool.core.backup.backup_manager import BackupManager


@pytest.fixture
def backup_dir() -> Generator[Path, None, None]:
    """Create a temporary backup directory."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)


@pytest.fixture
def s3_settings(backup_dir: Path):
    """Create backup settings with S3 configuration."""
    settings_dict: Dict[str, Any] = {
        "BACKUP_ROOT_DIR": backup_dir,
        "DB_BACKUP_ENABLED": True,
        "FILE_BACKUP_ENABLED": True,
        "DB_BACKUP_RETENTION_DAYS": 7,
        "FILE_BACKUP_RETENTION_DAYS": 30,
        "DB_BACKUP_COMPRESSION": True,
        "REMOTE_BACKUP_ENABLED": True,
        "REMOTE_BACKUP_TYPE": "s3",
        "REMOTE_BACKUP_URL": "s3://test-bucket/backups",
        "REMOTE_BACKUP_CREDENTIALS": {
            "aws_access_key_id": "test_key",
            "aws_secret_access_key": "test_secret",
        },
    }
    return BackupSettings(**settings_dict)


@pytest.fixture
def backup_manager(s3_settings: BackupSettings) -> BackupManager:
    """Create a backup manager instance with S3 configuration."""
    return BackupManager(settings=s3_settings)


def create_test_file(path: Path, content: bytes = b"test data"):
    """Create a test file with specified content."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return path


@patch("boto3.client")
def test_s3_client_initialization(mock_boto3: MagicMock):
    """Test S3 client initialization under different conditions."""
    # Test with S3 disabled
    settings_dict: Dict[str, Any] = {
        "BACKUP_ROOT_DIR": Path("/tmp"),
        "REMOTE_BACKUP_ENABLED": False,
    }
    manager = BackupManager(settings=BackupSettings(**settings_dict))
    assert manager.s3_client is None
    mock_boto3.assert_not_called()

    # Test with S3 enabled but missing credentials
    settings_dict.update(
        {
            "REMOTE_BACKUP_ENABLED": True,
            "REMOTE_BACKUP_TYPE": "s3",
            "REMOTE_BACKUP_CREDENTIALS": {},
        }
    )
    manager = BackupManager(settings=BackupSettings(**settings_dict))
    assert manager.s3_client is None
    mock_boto3.assert_not_called()

    # Test with valid credentials
    settings_dict["REMOTE_BACKUP_CREDENTIALS"] = {
        "aws_access_key_id": "test_key",
        "aws_secret_access_key": "test_secret",
    }
    mock_boto3.return_value = MagicMock()
    manager = BackupManager(settings=BackupSettings(**settings_dict))
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

    # Configure mock
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
    # Configure mock
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
def test_backup_rotation_with_s3(
    mock_boto3: MagicMock, backup_manager: BackupManager, backup_dir: Path
) -> None:
    """Test backup rotation with S3 integration."""
    # Configure mock
    mock_s3 = mock_boto3.return_value
    backup_manager.s3_client = mock_s3

    # Create test database backups
    db_dir = backup_dir / "database"
    db_dir.mkdir(parents=True, exist_ok=True)
    new_db = create_test_file(db_dir / "new_db.db")

    # Enable compression
    backup_manager.settings.DB_BACKUP_COMPRESSION = True

    # Rotate backups
    backup_manager.rotate_backups()

    # Verify S3 upload was called for compressed file
    mock_s3.upload_file.assert_called_once()
    call_args = mock_s3.upload_file.call_args[0]
    assert call_args[1] == "test-bucket"
    assert call_args[2].startswith("backups/") and call_args[2].endswith(".db.gz")
