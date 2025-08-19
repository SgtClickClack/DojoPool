"""
Backup manager for DojoPool.
Handles automated backups of databases, files, and configuration.
"""

import datetime
import gzip
import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import List, Optional

import boto3
from botocore.exceptions import BotoClientError
from cryptography.fernet import Fernet

from ..config.backup_config import backup_settings
from ..utils.notifications import send_notification

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(backup_settings.BACKUP_ROOT_DIR / "logs" / "backup.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("backup_manager")


class BackupManager:
    """Manages all backup operations for DojoPool."""

    def __init__(self):
        """Initialize backup manager."""
        self.settings = backup_settings
        self.settings.validate_paths()
        self._setup_encryption()
        self._setup_remote()

    def _setup_encryption(self) -> None:
        """Set up encryption if enabled."""
        if self.settings.BACKUP_ENCRYPTION_ENABLED:
            if not self.settings.BACKUP_ENCRYPTION_KEY:
                key = Fernet.generate_key()
                logger.info("Generated new encryption key")
                self.fernet = Fernet(key)
            else:
                self.fernet = Fernet(self.settings.BACKUP_ENCRYPTION_KEY.encode())
        else:
            self.fernet = None

    def _setup_remote(self) -> None:
        """Set up remote backup client if enabled."""
        if self.settings.REMOTE_BACKUP_ENABLED:
            if self.settings.REMOTE_BACKUP_TYPE == "s3":
                self.s3 = boto3.client(
                    "s3",
                    aws_access_key_id=self.settings.REMOTE_BACKUP_CREDENTIALS.get(
                        "aws_access_key_id"
                    ),
                    aws_secret_access_key=self.settings.REMOTE_BACKUP_CREDENTIALS.get(
                        "aws_secret_access_key"
                    ),
                )
            else:
                logger.warning(
                    f"Unsupported remote backup type: {self.settings.REMOTE_BACKUP_TYPE}"
                )
                self.s3 = None
        else:
            self.s3 = None

    def backup_database(self) -> Optional[Path]:
        """Perform database backup."""
        if not self.settings.DB_BACKUP_ENABLED:
            logger.info("Database backup disabled")
            return None

        try:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = self.settings.get_backup_dirs()["database"] / f"db_backup_{timestamp}.sql"

            # Perform database dump
            cmd = [
                "pg_dump",
                "-h",
                os.getenv("POSTGRES_HOST", "localhost"),
                "-U",
                os.getenv("POSTGRES_USER", "postgres"),
                "-d",
                os.getenv("POSTGRES_DB", "dojopool"),
                "-F",
                "p",
                "-f",
                str(backup_file),
            ]

            subprocess.run(cmd, check=True)
            logger.info(f"Database backup created: {backup_file}")

            # Compress backup
            if self.settings.DB_BACKUP_COMPRESSION:
                compressed_file = Path(str(backup_file) + ".gz")
                with open(backup_file, "rb") as f_in:
                    with gzip.open(compressed_file, "wb") as f_out:
                        shutil.copyfileobj(f_in, f_out)
                backup_file.unlink()
                backup_file = compressed_file
                logger.info(f"Database backup compressed: {backup_file}")

            # Encrypt backup
            if self.fernet:
                with open(backup_file, "rb") as f:
                    data = f.read()
                encrypted_data = self.fernet.encrypt(data)
                with open(backup_file, "wb") as f:
                    f.write(encrypted_data)
                logger.info(f"Database backup encrypted: {backup_file}")

            return backup_file

        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            self._send_notification("Database Backup Failed", str(e))
            return None

    def backup_files(self) -> List[Path]:
        """Perform file backups."""
        if not self.settings.FILE_BACKUP_ENABLED:
            logger.info("File backup disabled")
            return []

        backup_files = []
        try:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

            for path in self.settings.FILE_BACKUP_PATHS:
                if not path.exists():
                    logger.warning(f"Backup path does not exist: {path}")
                    continue

                backup_name = f"{path.name}_backup_{timestamp}.tar.gz"
                backup_file = self.settings.get_backup_dirs()["files"] / backup_name

                # Create tar archive
                subprocess.run(["tar", "-czf", str(backup_file), str(path)], check=True)
                logger.info(f"File backup created: {backup_file}")

                # Encrypt backup
                if self.fernet:
                    with open(backup_file, "rb") as f:
                        data = f.read()
                    encrypted_data = self.fernet.encrypt(data)
                    with open(backup_file, "wb") as f:
                        f.write(encrypted_data)
                    logger.info(f"File backup encrypted: {backup_file}")

                backup_files.append(backup_file)

            return backup_files

        except Exception as e:
            logger.error(f"File backup failed: {e}")
            self._send_notification("File Backup Failed", str(e))
            return backup_files

    def upload_to_remote(self, backup_file: Path) -> bool:
        """Upload backup to remote storage."""
        if not self.settings.REMOTE_BACKUP_ENABLED or not self.s3:
            return False

        try:
            bucket = self.settings.REMOTE_BACKUP_URL.split("/")[-1]
            key = f"backups/{backup_file.name}"

            self.s3.upload_file(str(backup_file), bucket, key)
            logger.info(f"Uploaded backup to S3: {key}")
            return True

        except BotoClientError as e:
            logger.error(f"Failed to upload backup to S3: {e}")
            self._send_notification("Remote Backup Failed", str(e))
            return False

    def cleanup_old_backups(self) -> None:
        """Remove old backups based on retention policy."""
        try:
            # Clean database backups
            db_retention = datetime.datetime.now() - datetime.timedelta(
                days=self.settings.DB_BACKUP_RETENTION_DAYS
            )
            db_dir = self.settings.get_backup_dirs()["database"]
            for backup_file in db_dir.glob("*"):
                if backup_file.stat().st_mtime < db_retention.timestamp():
                    backup_file.unlink()
                    logger.info(f"Removed old database backup: {backup_file}")

            # Clean file backups
            file_retention = datetime.datetime.now() - datetime.timedelta(
                days=self.settings.FILE_BACKUP_RETENTION_DAYS
            )
            file_dir = self.settings.get_backup_dirs()["files"]
            for backup_file in file_dir.glob("*"):
                if backup_file.stat().st_mtime < file_retention.timestamp():
                    backup_file.unlink()
                    logger.info(f"Removed old file backup: {backup_file}")

        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
            self._send_notification("Backup Cleanup Failed", str(e))

    def _send_notification(self, subject: str, message: str) -> None:
        """Send backup notification."""
        if self.settings.BACKUP_NOTIFICATIONS_ENABLED:
            send_notification(
                subject=subject,
                message=message,
                email=self.settings.BACKUP_NOTIFICATION_EMAIL,
                slack_webhook=self.settings.BACKUP_NOTIFICATION_SLACK_WEBHOOK,
            )

    def run_backup(self) -> None:
        """Run complete backup process."""
        if not self.settings.BACKUP_ENABLED:
            logger.info("Backup system disabled")
            return

        logger.info("Starting backup process")

        # Database backup
        db_backup = self.backup_database()
        if db_backup and self.settings.REMOTE_BACKUP_ENABLED:
            self.upload_to_remote(db_backup)

        # File backups
        file_backups = self.backup_files()
        if self.settings.REMOTE_BACKUP_ENABLED:
            for backup in file_backups:
                self.upload_to_remote(backup)

        # Cleanup
        self.cleanup_old_backups()

        logger.info("Backup process completed")
