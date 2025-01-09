#!/usr/bin/env python3
"""Script to reorganize the DojoPool codebase structure."""

import os
import shutil
from pathlib import Path

def create_directory_structure(base_path):
    """Create the directory structure."""
    directories = [
        'api/v1',
        'auth',
        'core/game',
        'core/tournament',
        'core/ranking',
        'core/realtime',
        'frontend/src',
        'frontend/public',
        'models',
        'services/email',
        'services/notification',
        'static/css',
        'static/js',
        'static/images',
        'templates',
        'utils'
    ]
    
    for directory in directories:
        dir_path = os.path.join(base_path, directory)
        os.makedirs(dir_path, exist_ok=True)
        init_file = os.path.join(dir_path, '__init__.py')
        if not os.path.exists(init_file):
            Path(init_file).touch()

def move_files(src_path):
    """Move files to their proper locations."""
    # Move frontend files
    if os.path.exists(os.path.join(src_path, 'setupTests.ts')):
        shutil.move(
            os.path.join(src_path, 'setupTests.ts'),
            os.path.join(src_path, 'frontend/src/tests/setupTests.ts')
        )
    
    if os.path.exists(os.path.join(src_path, 'constants.ts')):
        shutil.move(
            os.path.join(src_path, 'constants.ts'),
            os.path.join(src_path, 'frontend/src/constants.ts')
        )
    
    # Move email services
    email_dirs = ['email', 'mail_service']
    for dir_name in email_dirs:
        email_path = os.path.join(src_path, dir_name)
        if os.path.exists(email_path):
            for item in os.listdir(email_path):
                src_item = os.path.join(email_path, item)
                dst_item = os.path.join(src_path, 'services/email', item)
                if os.path.isfile(src_item):
                    shutil.move(src_item, dst_item)
    
    # Move socket files
    socket_dirs = ['websockets', 'sockets']
    for dir_name in socket_dirs:
        socket_path = os.path.join(src_path, dir_name)
        if os.path.exists(socket_path):
            for item in os.listdir(socket_path):
                src_item = os.path.join(socket_path, item)
                dst_item = os.path.join(src_path, 'core/realtime', item)
                if os.path.isfile(src_item):
                    shutil.move(src_item, dst_item)

def cleanup_redundant_files(src_path):
    """Clean up redundant files and directories."""
    to_remove = [
        '.gitignore',
        'dojopool.egg-info',
        '__pycache__',
        'dojopool'
    ]
    
    for item in to_remove:
        item_path = os.path.join(src_path, item)
        if os.path.exists(item_path):
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
            else:
                os.remove(item_path)

def move_blueprints(src_path):
    """Move blueprint files to their feature directories."""
    blueprint_path = os.path.join(src_path, 'blueprints')
    if os.path.exists(blueprint_path):
        for item in os.listdir(blueprint_path):
            if item.startswith('auth_'):
                dst_dir = 'auth'
            elif item.startswith('game_'):
                dst_dir = 'core/game'
            elif item.startswith('tournament_'):
                dst_dir = 'core/tournament'
            else:
                continue
            
            src_item = os.path.join(blueprint_path, item)
            dst_item = os.path.join(src_path, dst_dir, item)
            if os.path.isfile(src_item):
                shutil.move(src_item, dst_item)

def main():
    """Main function to reorganize the codebase."""
    # Get the src directory path
    src_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(src_path, 'src')
    
    print("Creating directory structure...")
    create_directory_structure(src_path)
    
    print("Moving files to proper locations...")
    move_files(src_path)
    
    print("Moving blueprint files...")
    move_blueprints(src_path)
    
    print("Cleaning up redundant files...")
    cleanup_redundant_files(src_path)
    
    print("Done! Codebase reorganized successfully.")

if __name__ == '__main__':
    main() 