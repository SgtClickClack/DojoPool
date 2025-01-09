#!/usr/bin/env python3
"""Script to update import statements in Python files."""

import os
import re
from pathlib import Path

IMPORT_MAPPINGS = {
    'from blueprints.': 'from core.',
    'from email.': 'from services.email.',
    'from mail_service.': 'from services.email.',
    'from websockets.': 'from core.realtime.',
    'from sockets.': 'from core.realtime.',
    'from main.': 'from core.',
    'from dojopool.': 'from .',
}

def update_imports(file_path):
    """Update import statements in a file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    for old, new in IMPORT_MAPPINGS.items():
        if old in content:
            content = content.replace(old, new)
            modified = True
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated imports in {file_path}")

def process_directory(directory):
    """Process all Python files in a directory."""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                update_imports(file_path)

def main():
    """Main function to update imports."""
    # Get the src directory path
    src_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(src_path, 'src')
    
    print("Updating import statements...")
    process_directory(src_path)
    print("Done! Import statements updated successfully.")

if __name__ == '__main__':
    main() 