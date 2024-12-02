import os
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_git_command(command, check=True):
    """Run a git command and return the output."""
    try:
        if isinstance(command, str):
            command = command.split()
        result = subprocess.run(command, capture_output=True, text=True, check=check)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Git command failed: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Error running git command: {str(e)}")
        return None

def setup_git():
    """Set up and configure git repository."""
    try:
        # Initialize git if not already initialized
        if not Path('.git').exists():
            logger.info("Initializing git repository...")
            run_git_command("git init")

        # Configure git settings
        logger.info("Configuring git settings...")
        git_configs = [
            ["git", "config", "core.fileMode", "false"],
            ["git", "config", "core.autocrlf", "input"],
            ["git", "config", "pull.rebase", "false"],
            ["git", "config", "merge.ff", "false"],
            ["git", "config", "--global", "user.email", "replit@users.noreply.github.com"],
            ["git", "config", "--global", "user.name", "Replit User"]
        ]
        
        for config in git_configs:
            result = run_git_command(config)
            if result is None:
                logger.error(f"Failed to set git config: {' '.join(config)}")
                return False

        # Clean up any existing issues
        logger.info("Cleaning up repository...")
        
        # Remove any existing submodule configurations
        if Path('.gitmodules').exists():
            os.remove('.gitmodules')
            logger.info("Removed .gitmodules file")

        # Clean git cache
        run_git_command("git rm -rf --cached .", check=False)
        
        # Add all files
        logger.info("Adding all files to git...")
        run_git_command("git add -A")
        
        # Create a commit if there are changes
        status = run_git_command("git status --porcelain")
        if status:
            logger.info("Creating commit with changes...")
            run_git_command(['git', 'commit', '-m', "Configure Git settings and clean up repository"])
        
        logger.info("Git setup completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error during git setup: {str(e)}")
        return False

if __name__ == "__main__":
    setup_git()
