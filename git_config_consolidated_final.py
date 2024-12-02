#!/usr/bin/env python3
import subprocess
import logging
from pathlib import Path
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create handler
console_handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

def verify_and_configure_git():
    """Apply and verify Git configuration settings."""
    try:
        # Check Git installation
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True, check=True)
            logger.info(f"Git is installed: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("Git is not installed or not found in PATH")
            return False

        # Define required Git configurations
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

        # Create backup branch
        backup_branch = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Creating backup branch: {backup_branch}")
        subprocess.run(['git', 'checkout', '-b', backup_branch], check=False)

        # Check for staged changes
        result = subprocess.run(['git', 'status', '--porcelain'], 
                           capture_output=True, text=True, check=False)
        if result.stdout.strip():
            logger.info("There are staged changes in the repository")
            # Add and commit changes
            subprocess.run(['git', 'add', '-A'], check=True)
            try:
                subprocess.run(['git', 'commit', '-m', "Configure Git settings"], check=True)
                logger.info("Changes committed successfully")
            except subprocess.CalledProcessError:
                logger.warning("No changes to commit or commit failed")
        else:
            logger.info("No staged changes in the repository")

        # Clean up redundant files
        redundant_files = [f for f in Path('.').glob('*git*.py') 
                          if f.name != 'git_config_consolidated_final.py']
        
        for file in redundant_files:
            try:
                if file.exists():
                    file.unlink()
                    logger.info(f"Removed redundant file: {file}")
            except Exception as e:
                logger.error(f"Error removing {file}: {e}")

        logger.info("All Git configurations verified successfully")
        return True

    except Exception as e:
        logger.error(f"Error during Git configuration verification: {str(e)}")
        return False

if __name__ == "__main__":
    success = verify_and_configure_git()
    if success:
        logger.info("Git configuration verified and applied successfully")
        exit(0)
    else:
        logger.error("Git configuration verification failed")
        exit(1)
