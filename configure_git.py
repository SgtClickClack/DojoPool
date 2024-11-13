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

def run_git_command(command):
    """Run a git command and return the output."""
    try:
        if isinstance(command, str):
            command = command.split()
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Git command failed: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Error running git command: {str(e)}")
        return None

def configure_git():
    """Configure Git settings and clean up repository."""
    try:
        # Initialize repository if needed
        if not Path('.git').exists():
            logger.info("Initializing Git repository...")
            run_git_command("git init")

        # Configure Git settings
        logger.info("Configuring Git settings...")
        configs = [
            ["git", "config", "core.fileMode", "false"],
            ["git", "config", "core.autocrlf", "input"],
            ["git", "config", "pull.rebase", "false"],
            ["git", "config", "merge.ff", "false"],
            ["git", "config", "--global", "user.email", "replit@users.noreply.github.com"],
            ["git", "config", "--global", "user.name", "Replit User"],
            ["git", "config", "--global", "init.defaultBranch", "main"]
        ]

        for config in configs:
            if run_git_command(config) is None:
                return False

        # Clean up repository
        logger.info("Cleaning up repository...")
        if Path('.gitmodules').exists():
            os.remove('.gitmodules')
            logger.info("Removed .gitmodules file")

        # Reset Git cache
        run_git_command("git rm -rf --cached .")
        
        # Add all files
        logger.info("Adding all files...")
        run_git_command("git add -A")

        # Create commit if there are changes
        status = run_git_command("git status --porcelain")
        if status:
            logger.info("Creating commit with changes...")
            run_git_command(["git", "commit", "-m", "Configure Git settings and clean up repository"])

        # Ensure we're on main branch
        current_branch = run_git_command("git rev-parse --abbrev-ref HEAD")
        if current_branch != "main":
            run_git_command("git checkout -b main")

        logger.info("Git configuration completed successfully")
        return True

    except Exception as e:
        logger.error(f"Error during Git configuration: {str(e)}")
        return False

if __name__ == "__main__":
    configure_git()
