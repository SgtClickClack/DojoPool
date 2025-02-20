#!/usr/bin/env python3
"""
Backup scheduler for DojoPool.
Handles scheduling and execution of automated backups.
"""

import logging
import sys
import time
from pathlib import Path

import schedule

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from dojopool.backup.backup_manager import BackupManager
from dojopool.config.backup_config import backup_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(
            backup_settings.BACKUP_ROOT_DIR / "logs" / "backup_scheduler.log"
        ),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("backup_scheduler")


def run_backup_job():
    """Execute backup job."""
    try:
        logger.info("Starting scheduled backup job")
        backup_manager = BackupManager()
        backup_manager.run_backup()
        logger.info("Scheduled backup job completed")
    except Exception as e:
        logger.error(f"Scheduled backup job failed: {e}")


def main():
    """Main scheduler function."""
    logger.info("Starting backup scheduler")

    # Initialize backup manager to validate configuration
    BackupManager()

    # Schedule database backups
    if backup_settings.DB_BACKUP_ENABLED:
        schedule.every().day.at("00:00").do(run_backup_job)
        logger.info(
            f"Scheduled database backups: {backup_settings.DB_BACKUP_FREQUENCY}"
        )

    # Schedule file backups
    if backup_settings.FILE_BACKUP_ENABLED:
        schedule.every().day.at("02:00").do(run_backup_job)
        logger.info(f"Scheduled file backups: {backup_settings.FILE_BACKUP_FREQUENCY}")

    # Run scheduler
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)
    except KeyboardInterrupt:
        logger.info("Backup scheduler stopped by user")
    except Exception as e:
        logger.error(f"Backup scheduler failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
