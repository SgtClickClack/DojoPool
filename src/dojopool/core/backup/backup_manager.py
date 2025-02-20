from multiprocessing import Pool
from multiprocessing import Pool
"""Backup manager for handling backup rotation and verification."""

import gzip
import logging
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import boto3
from botocore.exceptions import ClientError

from dojopool.config.backup_config import BackupSettings, backup_settings

logger = logging.getLogger(__name__)


class BackupManager:
    """Manages backup operations including rotation and verification."""

    def __init__(self, settings: Optional[BackupSettings] = None) -> None:
        """Initialize backup manager.

        Args:
            settings: Optional backup settings. If not provided, uses default settings.
        """
        self.settings: BackupSettings = settings or backup_settings
        self.settings.validate_paths()
        self.s3_client: Any = None
        self._setup_s3_client()

    def _setup_s3_client(self):
        """Set up S3 client if remote backup is enabled."""
        self.s3_client = None
        if (
            not self.settings.REMOTE_BACKUP_ENABLED
            or self.settings.REMOTE_BACKUP_TYPE != "s3"
        ):
            logger.info("S3 backup not enabled or wrong backup type")
            return

        credentials = self.settings.REMOTE_BACKUP_CREDENTIALS or {}
        aws_key = credentials.get("aws_access_key_id")
        aws_secret = credentials.get("aws_secret_access_key")

        if not aws_key or not aws_secret:
            logger.warning("Missing AWS credentials for S3 client")
            return

        try:
            self.s3_client = boto3.client(
                "s3", aws_access_key_id=aws_key, aws_secret_access_key=aws_secret
            )
            logger.info("Successfully initialized S3 client")
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            self.s3_client = None

    def upload_to_s3(self, file_path: Path):
        """Upload a file to S3.

        Args:
            file_path: Path to the file to upload.

        Returns:
            True if upload successful, False otherwise.
        """
        if not self.s3_client or not self.settings.REMOTE_BACKUP_URL:
            logger.warning("S3 client not configured or remote backup URL not set")
            return False

        if not file_path.exists():
            logger.error(f"File to upload does not exist: {file_path}")
            return False

        try:
            # Extract bucket name and key from remote backup URL
            # Format: s3://bucket-name/optional/path/
            bucket = self.settings.REMOTE_BACKUP_URL.replace("s3://", "").split("/")[0]
            prefix = "/".join(
                self.settings.REMOTE_BACKUP_URL.replace("s3://", "").split("/")[1:]
            )
            key = f"{prefix.rstrip('/')}/{file_path.name}"

            self.s3_client.upload_file(str(file_path), bucket, key)
            logger.info(f"Successfully uploaded {file_path} to s3://{bucket}/{key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to upload {file_path} to S3: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error uploading {file_path} to S3: {e}")
            return False

    def download_from_s3(self, s3_key: str, local_path: Path) -> bool:
        """Download a file from S3.

        Args:
            s3_key: Key of the file in S3.
            local_path: Local path to save the file.

        Returns:
            True if download successful, False otherwise.
        """
        if not self.s3_client or not self.settings.REMOTE_BACKUP_URL:
            logger.warning("S3 client not configured or remote backup URL not set")
            return False

        try:
            bucket = self.settings.REMOTE_BACKUP_URL.replace("s3://", "").split("/")[0]
            self.s3_client.download_file(bucket, s3_key, str(local_path))
            logger.info(
                f"Successfully downloaded s3://{bucket}/{s3_key} to {local_path}"
            )
            return True
        except ClientError as e:
            logger.error(f"Failed to download {s3_key} from S3: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error downloading {s3_key} from S3: {e}")
            return False

    def get_backup_files(self, backup_dir: Path):
        """Get list of backup files in a directory sorted by modification time.

        Args:
            backup_dir: Directory to scan for backup files.

        Returns:
            List of backup files sorted by modification time (oldest first).
        """
        if not backup_dir.exists():
            return []

        files = [f for f in backup_dir.iterdir() if f.is_file()]
        return sorted(files, key=lambda x: x.stat().st_mtime)

    def should_retain_backup(self, file_path: Path, retention_days: int):
        """Check if a backup file should be retained based on age.

        Args:
            file_path: Path to the backup file.
            retention_days: Number of days to retain backups.

        Returns:
            True if the backup should be retained, False otherwise.
        """
        if not file_path.exists():
            return False

        mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
        cutoff = datetime.now() - timedelta(days=retention_days)
        return mtime > cutoff

    def verify_backup(self, file_path: Path) -> bool:
        """Verify the integrity of a backup file.

        Args:
            file_path: Path to the backup file.

        Returns:
            True if backup is valid, False otherwise.
        """
        if not file_path.exists():
            logger.error(f"Backup file does not exist: {file_path}")
            return False

        try:
            # Basic verification: check if file is readable and not empty
            if file_path.stat().st_size == 0:
                logger.error(f"Backup file is empty: {file_path}")
                return False

            # For compressed files, try to read and decompress
            if file_path.suffix == ".gz":
                try:
                    with gzip.open(file_path, "rb") as f:
                        # Try to read the first few bytes to verify it's a valid gzip file
                        f.read(1024)
                except gzip.BadGzipFile:
                    logger.error(f"Invalid gzip file: {file_path}")
                    return False

            return True
        except Exception as e:
            logger.error(f"Error verifying backup {file_path}: {e}")
            return False

    def compress_file(self, file_path: Path):
        """Compress a file using gzip compression.

        Args:
            file_path: Path to the file to compress.

        Returns:
            Path to the compressed file if successful, None otherwise.
        """
        if not file_path.exists():
            logger.error(f"File to compress does not exist: {file_path}")
            return None

        compressed_path = file_path.with_suffix(file_path.suffix + ".gz")
        try:
            with file_path.open("rb") as f_in:
                with gzip.open(compressed_path, "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)

            # Verify the compressed file
            if self.verify_backup(compressed_path):
                logger.info(f"Successfully compressed {file_path} to {compressed_path}")
                file_path.unlink()  # Remove original file
                return compressed_path
            else:
                logger.error(f"Failed to verify compressed file: {compressed_path}")
                compressed_path.unlink()
                return None
        except Exception as e:
            logger.error(f"Error compressing file {file_path}: {e}")
            if compressed_path.exists():
                compressed_path.unlink()
            return None

    def decompress_file(self, file_path: Path):
        """Decompress a gzip compressed file.

        Args:
            file_path: Path to the compressed file.

        Returns:
            Path to the decompressed file if successful, None otherwise.
        """
        if not file_path.exists() or not file_path.suffix == ".gz":
            logger.error(f"Invalid compressed file: {file_path}")
            return None

        decompressed_path = file_path.with_suffix("")
        try:
            with gzip.open(file_path, "rb") as f_in:
                with decompressed_path.open("wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)

            logger.info(f"Successfully decompressed {file_path} to {decompressed_path}")
            return decompressed_path
        except Exception as e:
            logger.error(f"Error decompressing file {file_path}: {e}")
            if decompressed_path.exists():
                decompressed_path.unlink()
            return None

    def rotate_backups(self):
        """Rotate backups based on retention settings."""
        backup_dirs = self.settings.get_backup_dirs()

        # Database backups
        if self.settings.DB_BACKUP_ENABLED:
            self._rotate_directory_backups(
                backup_dirs["database"], self.settings.DB_BACKUP_RETENTION_DAYS
            )

        # File backups
        if self.settings.FILE_BACKUP_ENABLED:
            self._rotate_directory_backups(
                backup_dirs["files"], self.settings.FILE_BACKUP_RETENTION_DAYS
            )

    def _rotate_directory_backups(self, directory: Path, retention_days: int) -> None:
        """Rotate backups in a specific directory.

        Args:
            directory: Directory containing backups.
            retention_days: Number of days to retain backups.
        """
        if not directory.exists():
            logger.warning(f"Backup directory does not exist: {directory}")
            return

        # Determine if this is a database backup directory
        is_db_backup = directory.name == "database"

        backup_files = self.get_backup_files(directory)
        for file_path in backup_files:
            try:
                if not self.should_retain_backup(file_path, retention_days):
                    if self.verify_backup(file_path):
                        logger.info(f"Removing old backup: {file_path}")
                        file_path.unlink()
                    else:
                        logger.error(f"Found invalid backup file: {file_path}")
                        # Move to a separate directory for investigation
                        invalid_dir = directory / "invalid"
                        invalid_dir.mkdir(exist_ok=True)
                        file_path.rename(invalid_dir / file_path.name)
                elif (
                    is_db_backup
                    and self.settings.DB_BACKUP_COMPRESSION
                    and not file_path.suffix.endswith(".gz")
                ):
                    # Compress only database backups if compression is enabled
                    compressed_file = self.compress_file(file_path)
                    if compressed_file and self.settings.REMOTE_BACKUP_ENABLED:
                        # Upload compressed file to S3 if enabled
                        self.upload_to_s3(compressed_file)
            except Exception as e:
                logger.error(f"Error rotating backup {file_path}: {e}")

    def cleanup_invalid_backups(self, max_age_days: int = 30):
        """Clean up invalid backups older than specified age.

        Args:
            max_age_days: Maximum age in days for invalid backups before deletion.
        """
        backup_dirs = self.settings.get_backup_dirs()
        for directory in backup_dirs.values():
            invalid_dir = directory / "invalid"
            if not invalid_dir.exists():
                continue

            for file_path in self.get_backup_files(invalid_dir):
                try:
                    if not self.should_retain_backup(file_path, max_age_days):
                        logger.info(f"Removing old invalid backup: {file_path}")
                        file_path.unlink()
                except Exception as e:
                    logger.error(f"Error cleaning up invalid backup {file_path}: {e}")
