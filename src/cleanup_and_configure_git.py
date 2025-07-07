import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def remove_redundant_files():
    """Remove redundant git configuration files."""
    redundant_files = [
        "check_git_status.py",
        "configure_git.py",
        "configure_git_auth.py",
        "configure_repository.py",
        "fix_git_issues.py",
        "git_config.py",
        "git_configuration.py",
        "git_manager.py",
        "git_setup.py",
        "git_setup_and_auth.py",
        "git_setup_final.py",
        "setup_git.py",
        "setup_git_auth.py",
        "verify_git_config.py",
        "configure_git_final.py",
    ]

    for file in redundant_files:
        try:
            Path(file).unlink(missing_ok=True)
            logger.info(f"Removed {file}")
        except Exception as e:
            logger.error(f"Error removing {file}: {e}")


def run_git_command(command, check=True):
    """Run a git command and return the output."""
    try:
        if isinstance(command, str):
            command = command.split()
        result = subprocess.run(command, capture_output=True, text=True, check=check)
        if result.returncode != 0 and check:
            logger.error(f"Git command failed: {result.stderr}")
            return None
        return result.stdout.strip()
    except Exception as e:
        logger.error(f"Error running git command: {str(e)}")
        return None


def execute_git_manager():
    """Import and execute the git manager configuration."""
    try:
        import git_manager_final

        success = git_manager_final.configure_git_repository()
        if success:
            logger.info("Git configuration completed successfully")
            # Clean up redundant files after successful configuration
            remove_redundant_files()
            return True
        else:
            logger.error("Git configuration failed")
            return False
    except Exception as e:
        logger.error(f"Error executing git manager: {str(e)}")
        return False


if __name__ == "__main__":
    success = execute_git_manager()
    print(f"Git configuration and cleanup {'succeeded' if success else 'failed'}")
