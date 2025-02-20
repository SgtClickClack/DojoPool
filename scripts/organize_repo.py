#!/usr/bin/env python3
"""Script to organize repository structure."""

import os
import shutil
from pathlib import Path

def create_directory(path):
    """Create directory if it doesn't exist."""
    if not path.exists():
        path.mkdir(parents=True)
        print(f"Created directory: {path}")

def move_file(src, dest):
    """Move file to destination if it exists."""
    if src.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dest))
        print(f"Moved {src} to {dest}")

def organize_repository():
    """Organize repository structure."""
    root = Path(__file__).parent.parent
    
    # Create main directories
    directories = {
        'src': ['dojopool'],
        'tests': ['unit', 'integration', 'e2e'],
        'docs': ['api', 'guides', 'architecture'],
        'scripts': ['deployment', 'maintenance', 'development'],
        'config': ['development', 'production', 'testing'],
        'frontend': ['src', 'public', 'components'],
    }
    
    for dir_name, subdirs in directories.items():
        dir_path = root / dir_name
        create_directory(dir_path)
        for subdir in subdirs:
            create_directory(dir_path / subdir)
    
    # Move configuration files
    config_files = {
        '.env': 'config/development/.env',
        '.env.production': 'config/production/.env',
        'pytest.ini': 'config/testing/pytest.ini',
        'mypy.ini': 'config/development/mypy.ini',
        '.flake8': 'config/development/.flake8',
        'setup.cfg': 'config/development/setup.cfg',
    }
    
    for src, dest in config_files.items():
        move_file(root / src, root / dest)
    
    # Move scripts
    script_files = {
        'create_db.py': 'scripts/development/create_db.py',
        'create_tables.py': 'scripts/development/create_tables.py',
        'fix_imports.py': 'scripts/development/fix_imports.py',
        'monitor.py': 'scripts/maintenance/monitor.py',
        'optimize.py': 'scripts/maintenance/optimize.py',
    }
    
    for src, dest in script_files.items():
        move_file(root / src, root / dest)
    
    # Move documentation
    docs = {
        'CODE_OF_CONDUCT.md': 'docs/CODE_OF_CONDUCT.md',
        'CONTRIBUTING.md': 'docs/CONTRIBUTING.md',
        'SECURITY.md': 'docs/SECURITY.md',
        'Development_Tracking.md': 'docs/Development_Tracking.md',
    }
    
    for src, dest in docs.items():
        move_file(root / src, root / dest)
    
    # Clean up temporary and generated files
    cleanup_patterns = [
        '*.pyc',
        '__pycache__',
        '*.log',
        '*.sqlite3',
        '.pytest_cache',
        '.mypy_cache',
        '.coverage',
    ]
    
    for pattern in cleanup_patterns:
        for path in root.rglob(pattern):
            if path.is_file():
                path.unlink()
                print(f"Removed file: {path}")
            elif path.is_dir():
                shutil.rmtree(path)
                print(f"Removed directory: {path}")

if __name__ == '__main__':
    organize_repository() 