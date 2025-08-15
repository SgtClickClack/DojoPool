
import os
from pathlib import Path
import logging

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
console_handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

def cleanup_git_files():
    try:
        # List of patterns for Git configuration files
        patterns = ['git_*.py', 'configure_git*.py', 'setup_git*.py', 
                   'verify_git*.py', '*_git_*.py', 'cleanup_git*.py']
        
        files_removed = []
        files_failed = []
        
        # Iterate through patterns and remove matching files
        for pattern in patterns:
            for file_path in Path('.').glob(pattern):
                if file_path.name != 'git_config.py':  # Keep the main git_config.py
                    try:
                        file_path.unlink()
                        files_removed.append(file_path.name)
                        logger.info(f"Removed redundant file: {file_path.name}")
                    except Exception as e:
                        files_failed.append((file_path.name, str(e)))
                        logger.error(f"Error removing {file_path.name}: {str(e)}")
        
        # Log results
        if files_removed:
            logger.info(f"Successfully removed {len(files_removed)} files:")
            for file in files_removed:
                logger.info(f"- {file}")
        
        if files_failed:
            logger.warning("Failed to remove some files:")
            for file, error in files_failed:
                logger.warning(f"- {file}: {error}")
        
        return len(files_removed), len(files_failed)
    
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return 0, 0

if __name__ == "__main__":
    removed, failed = cleanup_git_files()
    print(f"Cleanup completed. Removed: {removed}, Failed: {failed}")
