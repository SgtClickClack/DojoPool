#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/dojopool/database"
METRICS_DIR="/var/backups/dojopool/metrics"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql.gz"
METRICS_FILE="${METRICS_DIR}/backup_metrics.prom"
CHECKSUM_FILE="${BACKUP_DIR}/backup_${DATE}.sha256"
VERIFICATION_LOG="${BACKUP_DIR}/verification_${DATE}.log"

# Create required directories
mkdir -p "$BACKUP_DIR" "$METRICS_DIR"

# Function to update Prometheus metrics
update_metrics() {
    local status=$1
    local duration=$2
    local size=$3
    local verify_duration=$4
    
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

# HELP backup_verification_duration_seconds Time taken to verify the backup
# TYPE backup_verification_duration_seconds gauge
backup_verification_duration_seconds $verify_duration

# HELP backup_size_bytes Size of the backup file in bytes
# TYPE backup_size_bytes gauge
backup_size_bytes $size

# HELP backup_total_count Total number of backup attempts
# TYPE backup_total_count counter
backup_total_count 1

# HELP backup_success_count Total number of successful backups
# TYPE backup_success_count counter
backup_success_count $([[ "$status" -eq 0 ]] && echo "1" || echo "0")

# HELP backup_available_space_bytes Available space in backup directory
# TYPE backup_available_space_bytes gauge
backup_available_space_bytes $(df -B1 "$BACKUP_DIR" | awk 'NR==2 {print $4}')
EOF
}

# Function to verify backup integrity
verify_backup() {
    local backup_file=$1
    local verify_start_time=$(date +%s)
    echo "Starting backup verification at $(date)" | tee -a "$VERIFICATION_LOG"
    
    # Check if file exists and is not empty
    if [ ! -s "$backup_file" ]; then
        echo "Backup file is empty or does not exist" | tee -a "$VERIFICATION_LOG"
        return 1
    }
    
    # Generate and verify checksum
    echo "Generating checksum..." | tee -a "$VERIFICATION_LOG"
    sha256sum "$backup_file" > "$CHECKSUM_FILE"
    if ! sha256sum -c "$CHECKSUM_FILE" >> "$VERIFICATION_LOG" 2>&1; then
        echo "Checksum verification failed" | tee -a "$VERIFICATION_LOG"
        return 1
    }
    
    # Try to decompress the backup file to verify it's not corrupted
    echo "Verifying compression integrity..." | tee -a "$VERIFICATION_LOG"
    if ! gzip -t "$backup_file" >> "$VERIFICATION_LOG" 2>&1; then
        echo "Backup file is corrupted" | tee -a "$VERIFICATION_LOG"
        return 1
    }
    
    # Create a temporary database for verification
    local temp_db="verify_${DATE}"
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    echo "Creating temporary database for verification..." | tee -a "$VERIFICATION_LOG"
    if ! createdb -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$temp_db" >> "$VERIFICATION_LOG" 2>&1; then
        echo "Failed to create temporary database" | tee -a "$VERIFICATION_LOG"
        return 1
    }
    
    # Restore backup to temporary database
    echo "Restoring backup to temporary database..." | tee -a "$VERIFICATION_LOG"
    if ! gunzip -c "$backup_file" | psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$temp_db" >> "$VERIFICATION_LOG" 2>&1; then
        echo "Failed to restore backup" | tee -a "$VERIFICATION_LOG"
        dropdb -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$temp_db"
        return 1
    }
    
    # Comprehensive database comparison
    echo "Performing comprehensive database comparison..." | tee -a "$VERIFICATION_LOG"
    
    # Compare table counts
    local orig_tables=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    local restore_tables=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$temp_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    
    # Compare row counts for each table
    local tables=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    local comparison_failed=0
    
    echo "Comparing table contents..." | tee -a "$VERIFICATION_LOG"
    for table in $tables; do
        local orig_count=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM $table")
        local restore_count=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$temp_db" -t -c "SELECT COUNT(*) FROM $table")
        
        if [ "$orig_count" != "$restore_count" ]; then
            echo "Table $table: count mismatch (original: $orig_count, restored: $restore_count)" | tee -a "$VERIFICATION_LOG"
            comparison_failed=1
        fi
    done
    
    # Clean up temporary database
    echo "Cleaning up temporary database..." | tee -a "$VERIFICATION_LOG"
    dropdb -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$temp_db" >> "$VERIFICATION_LOG" 2>&1
    
    # Calculate verification duration
    local verify_end_time=$(date +%s)
    verify_duration=$((verify_end_time - verify_start_time))
    echo "Verification duration: $verify_duration seconds" | tee -a "$VERIFICATION_LOG"
    
    if [ "$orig_tables" != "$restore_tables" ] || [ $comparison_failed -eq 1 ]; then
        echo "Backup verification failed: data integrity check failed" | tee -a "$VERIFICATION_LOG"
        return 1
    }
    
    echo "Backup verification successful" | tee -a "$VERIFICATION_LOG"
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

# Check available space before backup
available_space=$(df -B1 "$BACKUP_DIR" | awk 'NR==2 {print $4}')
required_space=$(psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT pg_database_size('$POSTGRES_DB')")

if [ $available_space -lt $((required_space * 3)) ]; then
    echo "Insufficient space for backup and verification" | tee -a "$VERIFICATION_LOG"
    update_metrics 1 0 0 0
    exit 1
fi

# Record start time
start_time=$(date +%s)

# Perform backup
echo "Starting backup at $(date)" | tee -a "$VERIFICATION_LOG"
pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
backup_status=$?

# Calculate backup duration
end_time=$(date +%s)
backup_duration=$((end_time - start_time))

if [ $backup_status -eq 0 ]; then
    echo "Backup created: $BACKUP_FILE" | tee -a "$VERIFICATION_LOG"
    
    # Verify backup
    verify_start_time=$(date +%s)
    if verify_backup "$BACKUP_FILE"; then
        verify_end_time=$(date +%s)
        verify_duration=$((verify_end_time - verify_start_time))
        
        echo "Backup verification passed" | tee -a "$VERIFICATION_LOG"
        backup_size=$(stat -f%z "$BACKUP_FILE")
        update_metrics 0 $backup_duration $backup_size $verify_duration
        
        # Rotate old backups (keep last 7 days)
        echo "Rotating old backups..." | tee -a "$VERIFICATION_LOG"
        find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
        find "$BACKUP_DIR" -name "backup_*.sha256" -mtime +7 -delete
        find "$BACKUP_DIR" -name "verification_*.log" -mtime +7 -delete
        
        echo "Backup process completed successfully" | tee -a "$VERIFICATION_LOG"
        exit 0
    else
        verify_end_time=$(date +%s)
        verify_duration=$((verify_end_time - verify_start_time))
        
        echo "Backup verification failed" | tee -a "$VERIFICATION_LOG"
        rm -f "$BACKUP_FILE" "$CHECKSUM_FILE"  # Clean up failed backup
        update_metrics 1 $backup_duration 0 $verify_duration
        exit 1
    fi
else
    echo "Backup creation failed" | tee -a "$VERIFICATION_LOG"
    rm -f "$BACKUP_FILE" "$CHECKSUM_FILE"  # Clean up failed backup file
    update_metrics 1 $backup_duration 0 0
    exit 1
fi 