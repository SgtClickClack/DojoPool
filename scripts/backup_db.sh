#!/bin/bash

# Database backup script for DojoPool staging environment
# This script performs automated backups of PostgreSQL databases

# Load environment variables
source ../.env.staging

# Set backup directory
BACKUP_DIR="/var/backups/dojopooldb"
BACKUP_RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate timestamp for backup files
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup main database
echo "Backing up main database..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/dojopooldb_$TIMESTAMP.backup"

# Backup metrics database
echo "Backing up metrics database..."
pg_dump -h $DB_HOST -U $DB_USER -d ${DB_NAME}_metrics -F c -b -v -f "$BACKUP_DIR/dojopooldb_metrics_$TIMESTAMP.backup"

# Clean up old backups
find $BACKUP_DIR -type f -name "*.backup" -mtime +$BACKUP_RETENTION_DAYS -delete

# Verify backup success
if [ $? -eq 0 ]; then
    echo "Database backups completed successfully"
    # Send success notification
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"✅ Database backup completed successfully at $TIMESTAMP\"}"
else
    echo "Database backup failed"
    # Send failure notification
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"❌ Database backup failed at $TIMESTAMP\"}"
fi 