#!/usr/bin/env python3
import subprocess
import logging
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create handler
console_handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

def verify_git_settings():
    """Apply and verify Git configuration settings."""
    try:
        # Check if Git is installed
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True, check=True)
            logger.info(f"Git is installed: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("Git is not installed or not found in PATH")
            return False

        # Define required Git configurations
        configs = [
            ['git', 'config', '--global', 'user.email', 'replit@users.noreply.github.com'],
            ['git', 'config', '--global', 'user.name', 'Replit User'],
            ['git', 'config', '--global', 'init.defaultBranch', 'main'],
            ['git', 'config', '--global', 'credential.helper', 'store'],
            ['git', 'config', '--global', 'core.fileMode', 'false'],
            ['git', 'config', '--global', 'core.autocrlf', 'input'],
            ['git', 'config', '--global', 'pull.rebase', 'false']
        ]
        
        # Apply configurations
        logger.info("Applying Git configurations...")
        for config in configs:
            try:
                subprocess.run(config, capture_output=True, text=True, check=True)
                logger.info(f"Applied configuration: {' '.join(config[2:])}")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to apply configuration {' '.join(config)}: {e.stderr}")
                return False

        # Initialize repository if needed
        if not Path('.git').exists():
            logger.info("Initializing Git repository...")
            subprocess.run(['git', 'init'], check=True)

        # Verify configurations
        logger.info("Verifying Git configurations...")
        config_mapping = {
            'user.email': 'replit@users.noreply.github.com',
            'user.name': 'Replit User',
            'init.defaultBranch': 'main',
            'credential.helper': 'store',
            'core.fileMode': 'false',
            'core.autocrlf': 'input',
            'pull.rebase': 'false'
        }
        
        for key, expected in config_mapping.items():
            result = subprocess.run(
                ['git', 'config', '--get', key],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode != 0:
                logger.error(f"Git configuration {key} is not set")
                return False
                
            actual = result.stdout.strip()
            if actual != expected:
                logger.error(f"Git configuration {key} has unexpected value: {actual} (expected: {expected})")
                return False
                
            logger.info(f"Verified {key}: {actual}")

        # Check for staged changes
        result = subprocess.run(['git', 'status', '--porcelain'], 
                            capture_output=True, text=True, check=False)
        if result.stdout.strip():
            logger.info("There are staged changes in the repository")
        else:
            logger.info("No staged changes in the repository")
            
        return True
        
    except Exception as e:
        logger.error(f"Error during Git configuration verification: {str(e)}")
        return False

if __name__ == "__main__":
    success = verify_git_settings()
    if success:
        logger.info("Git configuration verified and applied successfully")
        exit(0)
    else:
        logger.error("Git configuration verification failed")
        exit(1)
