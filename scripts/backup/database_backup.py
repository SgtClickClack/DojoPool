#!/usr/bin/env python3
"""Database backup script with compression and rotation."""

import os
import sys
import time
import logging
import subprocess
from datetime import datetime
import gzip
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/var/log/dojopool/backup.log')
    ]
)
logger = logging.getLogger(__name__)

# Backup configuration
BACKUP_DIR = "/var/backups/dojopool/database"
MAX_BACKUPS = 7  # Keep a week's worth of backups
POSTGRES_DB = os.getenv("POSTGRES_DB", "dojopool")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

def ensure_backup_dir():
    """Create backup directory if it doesn't exist."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    logger.info(f"Backup directory ensured: {BACKUP_DIR}")

def cleanup_old_backups():
    """Remove old backups keeping only the most recent ones."""
    backups = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.gz')])
    while len(backups) >= MAX_BACKUPS:
        backup_to_remove = os.path.join(BACKUP_DIR, backups.pop(0))
        os.remove(backup_to_remove)
        logger.info(f"Removed old backup: {backup_to_remove}")

def create_backup():
    """Create a compressed database backup."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(BACKUP_DIR, f"backup_{timestamp}.sql")
    compressed_file = f"{backup_file}.gz"

    try:
        # Set PostgreSQL environment variables
        env = os.environ.copy()
        env["PGPASSWORD"] = POSTGRES_PASSWORD

        # Create backup
        cmd = [
            "pg_dump",
            "-h", POSTGRES_HOST,
            "-p", POSTGRES_PORT,
            "-U", POSTGRES_USER,
            "-d", POSTGRES_DB,
            "-F", "p",  # Plain text format
            "-f", backup_file
        ]

        subprocess.run(cmd, env=env, check=True)
        logger.info(f"Database backup created: {backup_file}")

        # Compress backup
        with open(backup_file, 'rb') as f_in:
            with gzip.open(compressed_file, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        
        # Remove uncompressed backup
        os.remove(backup_file)
        logger.info(f"Backup compressed: {compressed_file}")

        return True
    except Exception as e:
        logger.error(f"Backup failed: {str(e)}")
        if os.path.exists(backup_file):
            os.remove(backup_file)
        if os.path.exists(compressed_file):
            os.remove(compressed_file)
        return False

def main():
    """Main backup routine."""
    logger.info("Starting database backup process")
    
    try:
        ensure_backup_dir()
        cleanup_old_backups()
        
        if create_backup():
            logger.info("Backup completed successfully")
            return 0
        else:
            logger.error("Backup failed")
            return 1
    except Exception as e:
        logger.error(f"Backup process failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 