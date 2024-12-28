#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/dojopool/database"
METRICS_DIR="/var/backups/dojopool/metrics"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql.gz"
METRICS_FILE="${METRICS_DIR}/backup_metrics.prom"

# Create required directories
mkdir -p "$BACKUP_DIR" "$METRICS_DIR"

# Function to update Prometheus metrics
update_metrics() {
    local status=$1
    local duration=$2
    local size=$3
    
    # Create or truncate metrics file
    cat > "$METRICS_FILE" << EOF
# HELP backup_success_timestamp Timestamp of the last successful backup
# TYPE backup_success_timestamp gauge
backup_success_timestamp $(if [ "$status" -eq 0 ]; then date +%s; else echo "0"; fi)

# HELP backup_last_status Status of the last backup (1 for success, 0 for failure)
# TYPE backup_last_status gauge
backup_last_status $([[ "$status" -eq 0 ]] && echo "1" || echo "0")

# HELP backup_duration_seconds Time taken to complete the backup
# TYPE backup_duration_seconds gauge
backup_duration_seconds $duration

# HELP backup_size_bytes Size of the backup file in bytes
# TYPE backup_size_bytes gauge
backup_size_bytes $size

# HELP backup_total_count Total number of backup attempts
# TYPE backup_total_count counter
backup_total_count 1

# HELP backup_success_count Total number of successful backups
# TYPE backup_success_count counter
backup_success_count $([[ "$status" -eq 0 ]] && echo "1" || echo "0")
EOF
}

# Function to verify backup integrity
verify_backup() {
    local backup_file=$1
    echo "Verifying backup integrity..."
    
    # Check if file exists and is not empty
    if [ ! -s "$backup_file" ]; then
        echo "Backup file is empty or does not exist"
        return 1
    }
    
    # Try to decompress the backup file to verify it's not corrupted
    if ! gzip -t "$backup_file"; then
        echo "Backup file is corrupted"
        return 1
    }
    
    # Create a temporary database for verification
    local temp_db="verify_${DATE}"
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    echo "Creating temporary database for verification..."
    if ! createdb -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$temp_db"; then
        echo "Failed to create temporary database"
        return 1
    }
    
    # Restore backup to temporary database
    echo "Restoring backup to temporary database..."
    if ! gunzip -c "$backup_file" | psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$temp_db" > /dev/null 2>&1; then
        echo "Failed to restore backup"
        dropdb -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$temp_db"
        return 1
    }
    
    # Compare row counts between original and restored databases
    local orig_count=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    local restore_count=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$temp_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    
    # Clean up temporary database
    dropdb -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$temp_db"
    
    if [ "$orig_count" != "$restore_count" ]; then
        echo "Backup verification failed: table count mismatch"
        return 1
    }
    
    echo "Backup verification successful"
    return 0
}

# Export PostgreSQL password
export PGPASSWORD="$POSTGRES_PASSWORD"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER"; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
done

echo "PostgreSQL is ready!"

# Record start time
start_time=$(date +%s)

# Perform backup
echo "Starting backup at $(date)"
pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
backup_status=$?

# Calculate duration
end_time=$(date +%s)
duration=$((end_time - start_time))

if [ $backup_status -eq 0 ]; then
    echo "Backup created: $BACKUP_FILE"
    
    # Verify backup
    if verify_backup "$BACKUP_FILE"; then
        echo "Backup verification passed"
        # Get backup size
        backup_size=$(stat -f%z "$BACKUP_FILE")
        # Update metrics with success
        update_metrics 0 $duration $backup_size
        
        # Clean up old backups (keep last 7 days)
        find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
        
        echo "Backup process completed successfully"
        exit 0
    else
        echo "Backup verification failed"
        rm -f "$BACKUP_FILE"  # Clean up failed backup
        update_metrics 1 $duration 0
        exit 1
    fi
else
    echo "Backup creation failed"
    rm -f "$BACKUP_FILE"  # Clean up failed backup file
    update_metrics 1 $duration 0
    exit 1
fi 