#!/usr/bin/env python3
"""Database backup script."""

import datetime
import logging
import os
import subprocess
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("/var/log/dojopool/backup.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("database_backup")

# Backup configuration
BACKUP_DIR = Path("/var/backups/dojopool/database")
BACKUP_RETENTION_DAYS = 7
DB_NAME = os.getenv("POSTGRES_DB", "dojopool")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_HOST = os.getenv("POSTGRES_HOST", "db")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")


def setup_backup_directory():
    """Create backup directory if it doesn't exist."""
    try:
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        logger.info(f"Backup directory ready: {BACKUP_DIR}")
    except Exception as e:
        logger.error(f"Failed to create backup directory: {e}")
        sys.exit(1)


def cleanup_old_backups():
    """Remove backups older than BACKUP_RETENTION_DAYS."""
    try:
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=BACKUP_RETENTION_DAYS)
        for backup_file in BACKUP_DIR.glob("*.sql.gz"):
            if backup_file.stat().st_mtime < cutoff_date.timestamp():
                backup_file.unlink()
                logger.info(f"Removed old backup: {backup_file}")
    except Exception as e:
        logger.error(f"Failed to clean up old backups: {e}")


def create_backup():
    """Create a new database backup."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"backup_{timestamp}.sql.gz"

    try:
        # Create backup using pg_dump and compress with gzip
        cmd = f"pg_dump -h {DB_HOST} -p {DB_PORT} -U {DB_USER} {DB_NAME} | gzip > {backup_file}"
        subprocess.run(
            cmd, shell=True, check=True, env={"PGPASSWORD": os.getenv("POSTGRES_PASSWORD")}
        )
        logger.info(f"Backup created successfully: {backup_file}")

        # Verify backup file exists and has size > 0
        if not backup_file.exists() or backup_file.stat().st_size == 0:
            raise Exception("Backup file is empty or does not exist")

        return True
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        if backup_file.exists():
            backup_file.unlink()
        return False


def main():
    """Main backup routine."""
    logger.info("Starting database backup process")

    # Ensure backup directory exists
    setup_backup_directory()

    # Clean up old backups
    cleanup_old_backups()

    # Create new backup
    success = create_backup()

    if success:
        logger.info("Backup process completed successfully")
    else:
        logger.error("Backup process failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
