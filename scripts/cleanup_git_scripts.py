import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def cleanup_git_scripts():
    """Remove redundant Git configuration files."""
    redundant_files = [
        'check_git_status.py',
        'configure_git.py',
        'configure_git_auth.py',
        'configure_repository.py',
        'fix_git_issues.py',
        'git_config.py',
        'git_configuration.py',
        'git_manager.py',
        'git_setup.py',
        'git_setup_and_auth.py',
        'git_setup_final.py',
        'setup_git.py',
        'setup_git_auth.py',
        'verify_git_config.py',
        'configure_git_final.py',
        'git_manager_final.py',
        'cleanup_and_configure_git.py'
    ]
    
    for file in redundant_files:
        try:
            file_path = Path(file)
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Removed {file}")
        except Exception as e:
            logger.error(f"Error removing {file}: {e}")

if __name__ == "__main__":
    cleanup_git_scripts()
