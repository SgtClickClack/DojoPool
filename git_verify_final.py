#!/usr/bin/env python3
import subprocess
import logging
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create handlers
console_handler = logging.StreamHandler()
file_handler = logging.FileHandler('git_setup.log')

# Create formatter and add it to handlers
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

# Add handlers to the logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)

def verify_git_configuration():
    """Verify Git configuration settings."""
    try:
        # Check Git installation
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True, check=True)
            logger.info(f"Git is installed: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("Git is not installed or not found in PATH")
            return False

        # Define and verify required configurations
        config_mapping = {
            'user.email': 'replit@users.noreply.github.com',
            'user.name': 'Replit User',
            'init.defaultBranch': 'main',
            'credential.helper': 'store',
            'core.fileMode': 'false',
            'core.autocrlf': 'input',
            'pull.rebase': 'false'
        }

        # Apply configurations
        logger.info("Applying Git configurations...")
        for key, value in config_mapping.items():
            try:
                subprocess.run(['git', 'config', '--global', key, value], 
                             capture_output=True, text=True, check=True)
                logger.info(f"Applied {key}: {value}")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to set {key}: {e.stderr}")
                return False

        # Verify configurations
        logger.info("Verifying Git configurations...")
        for key, expected in config_mapping.items():
            result = subprocess.run(['git', 'config', '--get', key],
                                 capture_output=True, text=True, check=False)
            
            if result.returncode != 0:
                logger.error(f"Git configuration {key} is not set")
                return False
            
            actual = result.stdout.strip()
            if actual != expected:
                logger.error(f"Git configuration {key} has unexpected value: {actual} (expected: {expected})")
                return False
            
            logger.info(f"Verified {key}: {actual}")

        # Initialize repository if needed
        if not Path('.git').exists():
            logger.info("Initializing Git repository...")
            subprocess.run(['git', 'init'], check=True)

        # Check for staged changes
        result = subprocess.run(['git', 'status', '--porcelain'], 
                             capture_output=True, text=True, check=False)
        if result.stdout.strip():
            logger.info("There are staged changes in the repository")
        else:
            logger.info("No staged changes in the repository")

        logger.info("All Git configurations verified successfully")
        return True

    except Exception as e:
        logger.error(f"Error during Git configuration verification: {str(e)}")
        return False

if __name__ == "__main__":
    success = verify_git_configuration()
    if success:
        logger.info("Git configuration verified successfully")
        exit(0)
    else:
        logger.error("Git configuration verification failed")
        exit(1)
