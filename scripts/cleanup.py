#!/usr/bin/env python3
"""Repository cleanup script."""

import os
import shutil
from pathlib import Path

def move_file(src: Path, dest: Path) -> None:
    """Move file to destination, creating directories if needed."""
    if src.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dest))
        print(f"Moved {src} to {dest}")

def cleanup_repository():
    """Clean up and organize repository files."""
    root = Path(__file__).parent.parent
    
    # Move test files to tests directory
    test_files = [
        "test_server.py",
        "test_flask.py",
        "test_goose.py",
        "test_app_root.py",
        "test_db.py",
        "[TEST]test_api.py"
    ]
    for test_file in test_files:
        move_file(root / test_file, root / "tests" / test_file)
    
    # Move configuration files
    config_moves = {
        ".eslintrc.js": "config/frontend/.eslintrc.js",
        ".eslintrc.json": "config/frontend/.eslintrc.json",
        "babel.config.js": "config/frontend/babel.config.js",
        "jest.config.js": "config/frontend/jest.config.js",
        "jest.setup.js": "config/frontend/jest.setup.js",
        "tsconfig.json": "config/frontend/tsconfig.json",
        "pyrightconfig.json": "config/python/pyrightconfig.json",
        ".pre-commit-config.yaml": "config/git/.pre-commit-config.yaml",
        "suppression.xml": "config/security/suppression.xml"
    }
    for src, dest in config_moves.items():
        move_file(root / src, root / dest)
    
    # Move scripts
    script_moves = {
        "run_server.py": "scripts/server/run_server.py",
        "celery_worker.py": "scripts/server/celery_worker.py",
        "setup_db.py": "scripts/database/setup_db.py",
        "[DB]init_db_script.py": "scripts/database/init_db.py",
        "sortImports.py": "scripts/development/sort_imports.py"
    }
    for src, dest in script_moves.items():
        move_file(root / src, root / dest)
    
    # Clean up temporary files
    temp_files = [
        "test.db",
        "chat.js",
        "minimal.py",
        "start.py",
        "run.bat",
        "get-pip.py"
    ]
    for temp_file in temp_files:
        temp_path = root / temp_file
        if temp_path.exists():
            temp_path.unlink()
            print(f"Removed temporary file: {temp_file}")
    
    # Clean up duplicate files
    duplicates = {
        "setup.py": "src/setup.py",
        "[SETUP]setup.py": "scripts/setup.py",
        "[DOC]README.md": "docs/README_old.md",
        "[TRACK]DEVELOPMENT_TRACKING.md": "docs/DEVELOPMENT_TRACKING.md"
    }
    for src, dest in duplicates.items():
        move_file(root / src, root / dest)

if __name__ == "__main__":
    cleanup_repository() 