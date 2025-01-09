#!/bin/bash

# Create required directories
mkdir -p /var/log/dojopool
mkdir -p /var/backups/dojopool/database

# Install cron if not already installed
apt-get update && apt-get install -y cron

# Create crontab file
echo "# Run database backup daily at 2 AM
0 2 * * * /usr/local/bin/python /app/backup/database_backup.py >> /var/log/dojopool/cron.log 2>&1
" > /etc/cron.d/backup-cron

# Set proper permissions
chmod 0644 /etc/cron.d/backup-cron

# Start cron
service cron start

# Keep container running and tail logs
tail -f /var/log/dojopool/cron.log 