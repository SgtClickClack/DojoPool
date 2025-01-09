#!/usr/bin/env python3
"""Script to verify the codebase structure."""

import os
from pathlib import Path

EXPECTED_STRUCTURE = {
    'api': {
        'v1': {},
        '__init__.py': None
    },
    'auth': {
        '__init__.py': None,
        'oauth.py': None
    },
    'core': {
        'game': {'__init__.py': None},
        'tournament': {'__init__.py': None},
        'ranking': {'__init__.py': None},
        'realtime': {'__init__.py': None},
        '__init__.py': None
    },
    'frontend': {
        'src': {
            'tests': {'setupTests.ts': None},
            'constants.ts': None
        },
        'public': {}
    },
    'models': {
        '__init__.py': None,
        'user.py': None,
        'game.py': None
    },
    'services': {
        'email': {'__init__.py': None},
        'notification': {'__init__.py': None},
        '__init__.py': None
    },
    'static': {
        'css': {},
        'js': {},
        'images': {}
    },
    'templates': {},
    'utils': {
        '__init__.py': None,
        'decorators.py': None,
        'helpers.py': None
    },
    '__init__.py': None,
    'app.py': None,
    'config.py': None,
    'extensions.py': None
}

def verify_structure(base_path, structure=None, path=''):
    """Verify the directory structure matches expected structure."""
    if structure is None:
        structure = EXPECTED_STRUCTURE
    
    issues = []
    
    for name, expected in structure.items():
        full_path = os.path.join(base_path, path, name)
        rel_path = os.path.join(path, name) if path else name
        
        if not os.path.exists(full_path):
            issues.append(f"Missing: {rel_path}")
            continue
        
        if expected is None:  # File
            if not os.path.isfile(full_path):
                issues.append(f"Expected file, found directory: {rel_path}")
        else:  # Directory
            if not os.path.isdir(full_path):
                issues.append(f"Expected directory, found file: {rel_path}")
            else:
                issues.extend(verify_structure(base_path, expected, rel_path))
    
    return issues

def check_redundant_files(base_path):
    """Check for redundant files and directories."""
    redundant = []
    unwanted = [
        '.gitignore',
        'dojopool.egg-info',
        'dojopool',
        'email',
        'mail_service',
        'websockets',
        'sockets',
        'main'
    ]
    
    for item in unwanted:
        if os.path.exists(os.path.join(base_path, item)):
            redundant.append(item)
    
    return redundant

def main():
    """Main function to verify codebase structure."""
    # Get the src directory path
    src_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_path = os.path.join(src_path, 'src')
    
    print("Verifying directory structure...")
    issues = verify_structure(src_path)
    
    if issues:
        print("\nStructure issues found:")
        for issue in issues:
            print(f"- {issue}")
    else:
        print("Directory structure is correct!")
    
    print("\nChecking for redundant files...")
    redundant = check_redundant_files(src_path)
    
    if redundant:
        print("\nRedundant files/directories found:")
        for item in redundant:
            print(f"- {item}")
    else:
        print("No redundant files found!")

if __name__ == '__main__':
    main() 