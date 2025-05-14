FROM python:3.13.2-slim

# Install PostgreSQL client tools and cron
RUN apt-get update && \
    apt-get install -y postgresql-client cron && \
    rm -rf /var/lib/apt/lists/*

# Create necessary directories
RUN mkdir -p /var/backups/dojopool/database /var/log/dojopool

# Copy backup script
COPY database_backup.py /app/backup/database_backup.py
RUN chmod +x /app/backup/database_backup.py

# Add cron job
RUN echo "0 2 * * * /usr/local/bin/python /app/backup/database_backup.py >> /var/log/dojopool/cron.log 2>&1" > /etc/cron.d/database-backup
RUN chmod 0644 /etc/cron.d/database-backup

# Create the cron log file
RUN touch /var/log/dojopool/cron.log

# Run cron in the foreground
CMD ["cron", "-f"] 