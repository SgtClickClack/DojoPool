#!/usr/bin/env python3
import subprocess
import logging

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create handlers
console_handler = logging.StreamHandler()
file_handler = logging.FileHandler('git_setup.log')

# Create formatter and add it to handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

# Add handlers to the logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)

def verify_git_config():
    """Verify Git configuration settings."""
    try:
        user_email = subprocess.run(['git', 'config', '--get', 'user.email'], 
                                  capture_output=True, text=True).stdout.strip()
        user_name = subprocess.run(['git', 'config', '--get', 'user.name'], 
                                 capture_output=True, text=True).stdout.strip()
        
        logger.info(f"Current Git configuration - Email: {user_email}, Name: {user_name}")
        return bool(user_email and user_name)
    except Exception as e:
        logger.error(f"Error verifying Git configuration: {str(e)}")
        return False

def configure_git():
    """Configure Git settings."""
    try:
        logger.info("Configuring Git settings...")
        
        # Configure Git settings
        configs = [
            ["git", "config", "--global", "user.email", "replit@users.noreply.github.com"],
            ["git", "config", "--global", "user.name", "Replit User"],
            ["git", "config", "--global", "init.defaultBranch", "main"],
            ["git", "config", "--global", "core.excludesFile", ".gitignore"],
            ["git", "config", "--global", "credential.helper", "store"],
            ["git", "config", "--global", "core.fileMode", "false"]
        ]
        
        for config in configs:
            try:
                subprocess.run(config, check=True, capture_output=True, text=True)
                logger.info(f"Applied configuration: {' '.join(config[2:])}")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to apply configuration {' '.join(config)}: {e.stderr}")
                return False

        # Verify configuration
        if not verify_git_config():
            logger.error("Git configuration verification failed")
            return False

        logger.info("Git configuration completed successfully")
        return True

    except Exception as e:
        logger.error(f"Error during Git configuration: {str(e)}")
        return False

if __name__ == "__main__":
    success = configure_git()
    if not success:
        logger.error("Failed to configure Git")
        exit(1)
    logger.info("Git configuration completed successfully")
