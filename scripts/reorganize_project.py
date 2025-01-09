#!/usr/bin/env python3
"""Script to reorganize the DojoPool project structure with robust error handling and logging."""

import logging
import shutil
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('reorganize.log')
    ]
)

# Project structure definition
PROJECT_STRUCTURE = {
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
            'tests': {},
            'components': {},
            'styles': {},
            'utils': {}
        },
        'public': {
            'assets': {}
        }
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
    }
}

# Files to be moved with their destinations
FILE_MOVES = {
    'setupTests.ts': 'frontend/src/tests/',
    'constants.ts': 'frontend/src/utils/',
    'decorators.py': 'utils/',
    'helpers.py': 'utils/'
}

# Directories to be merged
DIR_MERGES = {
    'email': 'services/email',
    'mail_service': 'services/email',
    'websockets': 'core/realtime',
    'sockets': 'core/realtime',
    'blueprints/auth_*': 'auth',
    'blueprints/game_*': 'core/game',
    'blueprints/tournament_*': 'core/tournament'
}

# Files and directories to be removed
CLEANUP_ITEMS = [
    '.gitignore',
    'dojopool.egg-info',
    'dojopool',
    '__pycache__',
    'email',
    'mail_service',
    'websockets',
    'sockets',
    'blueprints'
]

class ProjectReorganizer:
    """Class to handle project reorganization."""
    
    def __init__(self, src_path: Path):
        self.src_path = src_path
        self.logger = logging.getLogger(__name__)
    
    def create_directory_structure(self):
        """Create the project directory structure."""
        def create_structure(base: Path, structure: dict):
            for name, content in structure.items():
                path = base / name
                if content is None:  # File
                    if not path.exists():
                        path.touch()
                        self.logger.info(f"Created file: {path.relative_to(self.src_path)}")
                else:  # Directory
                    path.mkdir(exist_ok=True)
                    self.logger.info(f"Created directory: {path.relative_to(self.src_path)}")
                    if content:  # If directory has contents
                        create_structure(path, content)
        
        try:
            create_structure(self.src_path, PROJECT_STRUCTURE)
        except Exception as e:
            self.logger.error(f"Error creating directory structure: {e}")
            raise
    
    def move_files(self):
        """Move files to their new locations."""
        for src_file, dest_dir in FILE_MOVES.items():
            src_path = self.src_path / src_file
            dest_path = self.src_path / dest_dir
            
            if src_path.exists():
                try:
                    shutil.move(str(src_path), str(dest_path / src_file))
                    self.logger.info(f"Moved {src_file} to {dest_dir}")
                except Exception as e:
                    self.logger.error(f"Error moving {src_file}: {e}")
    
    def merge_directories(self):
        """Merge directories according to the merge mapping."""
        for src_pattern, dest_dir in DIR_MERGES.items():
            try:
                src_paths = list(self.src_path.glob(src_pattern))
                dest_path = self.src_path / dest_dir
                
                for src_path in src_paths:
                    if src_path.is_file():
                        shutil.move(str(src_path), str(dest_path / src_path.name))
                        self.logger.info(f"Moved {src_path.name} to {dest_dir}")
                    elif src_path.is_dir():
                        for item in src_path.glob('*'):
                            shutil.move(str(item), str(dest_path / item.name))
                            self.logger.info(f"Moved {item.name} to {dest_dir}")
            except Exception as e:
                self.logger.error(f"Error merging {src_pattern}: {e}")
    
    def cleanup(self):
        """Remove redundant files and directories."""
        for item in CLEANUP_ITEMS:
            path = self.src_path / item
            try:
                if path.exists():
                    if path.is_file():
                        path.unlink()
                    else:
                        shutil.rmtree(str(path))
                    self.logger.info(f"Removed {item}")
            except Exception as e:
                self.logger.error(f"Error removing {item}: {e}")
    
    def reorganize(self):
        """Execute the reorganization process."""
        try:
            self.logger.info("Starting project reorganization...")
            
            self.create_directory_structure()
            self.logger.info("Directory structure created successfully")
            
            self.move_files()
            self.logger.info("Files moved successfully")
            
            self.merge_directories()
            self.logger.info("Directories merged successfully")
            
            self.cleanup()
            self.logger.info("Cleanup completed successfully")
            
            self.logger.info("Project reorganization completed successfully!")
        except Exception as e:
            self.logger.error(f"Project reorganization failed: {e}")
            raise

def main():
    """Main function to run the reorganization."""
    try:
        # Get the src directory path
        src_path = Path(__file__).parent.parent / 'src'
        
        # Create and run the reorganizer
        reorganizer = ProjectReorganizer(src_path)
        reorganizer.reorganize()
        
    except Exception as e:
        logging.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 