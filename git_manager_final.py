import subprocess
import logging
import sys

# Configure logging
logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
handler = logging.handlers.RotatingFileHandler('repo_cleanup.log', maxBytes=100000, backupCount=3)
handler.setFormatter(logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s'))
logger = logging.getLogger(__name__)
logger.addHandler(handler)

def cleanup_git_repo(repo_path):
    try:
        # Example Git cleanup commands - you can modify them as per your requirements
        logger.info(f"Starting cleanup for Git repository at {repo_path}")
        
        # Remove unnecessary remote branches (example)
        subprocess.run(["git", "-C", repo_path, "remote", "prune", "origin"], check=True)
        
        # Clean up untracked files
        subprocess.run(["git", "-C", repo_path, "clean", "-fd"], check=True)
        
        # Reset any changes
        subprocess.run(["git", "-C", repo_path, "reset", "--hard"], check=True)

        logger.info(f"Successfully cleaned up Git repository at {repo_path}")

    except subprocess.CalledProcessError as e:
        logger.error(f"Git repository cleanup failed at {repo_path}. Error: {e}")
        logger.debug(f"Git command that failed: {e.cmd} with return code: {e.returncode}")
    except Exception as ex:
        logger.error(f"Unexpected error occurred during repository cleanup: {str(ex)}")

# Example usage
cleanup_git_repo("/path/to/your/repository")

