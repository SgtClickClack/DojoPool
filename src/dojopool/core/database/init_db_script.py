"""Database initialization script with secure file permissions."""

import os
from pathlib import Path

from dojopool.utils.file_permissions import (
    SECURE_DIR_MODE,
    SECURE_FILE_MODE,
    create_secure_directory,
    create_secure_file
)

def init_db():
    """Initialize database with secure permissions."""
    # Get instance directory path
    instance_dir = Path('instance')
    db_path = instance_dir / 'dojopool.db'
    
    try:
        # Create instance directory with secure permissions
        create_secure_directory(instance_dir, mode=SECURE_DIR_MODE)
        
        # Create database file with secure permissions
        create_secure_file(db_path, mode=SECURE_FILE_MODE)
        
        print(f"✅ Database initialized with secure permissions at {db_path}")
        return True
        
    except OSError as e:
        print(f"❌ Failed to initialize database: {e}")
        return False

if __name__ == '__main__':
    init_db() 