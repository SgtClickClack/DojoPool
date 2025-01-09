#!/usr/bin/env python3
"""Script to clean up redundant scripts."""

import os
import shutil

# Keep only these essential scripts
ESSENTIAL_SCRIPTS = {
    'reorganize_codebase.py',
    'update_imports.py',
    'verify_structure.py',
    'deploy_heroku.sh',
    'run_tests.sh',
    'setup_db.ps1',
    'setup_db.sh',
    'db_init.py',
    'run_tests.py',
    'cleanup_scripts.py'  # This script
}

def cleanup_scripts(scripts_dir):
    """Clean up redundant scripts."""
    # Get all files in the scripts directory
    files = [f for f in os.listdir(scripts_dir) if os.path.isfile(os.path.join(scripts_dir, f))]
    
    # Create backup directory
    backup_dir = os.path.join(scripts_dir, 'backup')
    os.makedirs(backup_dir, exist_ok=True)
    
    # Move non-essential scripts to backup
    for file in files:
        if file not in ESSENTIAL_SCRIPTS:
            src = os.path.join(scripts_dir, file)
            dst = os.path.join(backup_dir, file)
            print(f"Moving {file} to backup...")
            shutil.move(src, dst)
    
    # Clean up empty directories
    for item in os.listdir(scripts_dir):
        item_path = os.path.join(scripts_dir, item)
        if os.path.isdir(item_path) and item != 'backup':
            if not os.listdir(item_path):  # If directory is empty
                print(f"Removing empty directory: {item}")
                os.rmdir(item_path)
            else:  # If directory has contents, move to backup
                print(f"Moving directory {item} to backup...")
                shutil.move(item_path, os.path.join(backup_dir, item))

def main():
    """Main function to clean up scripts."""
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("Cleaning up redundant scripts...")
    cleanup_scripts(scripts_dir)
    print("Done! Scripts cleaned up successfully.")

if __name__ == '__main__':
    main() 