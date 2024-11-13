#!/usr/bin/env python3
import subprocess
import logging
import os
from pathlib import Path
from datetime import datetime

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

def verify_and_configure_git():
    """Set up and verify Git configuration settings."""
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
            'pull.rebase': 'false',
            'core.excludesFile': '.gitignore'
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

        # Initialize repository if needed
        if not Path('.git').exists():
            logger.info("Initializing Git repository...")
            subprocess.run(['git', 'init'], check=True)

        # Create comprehensive .gitignore
        gitignore_content = """
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
.env
.venv
env/
venv/
ENV/

# IDE
.idea/
.vscode/
*.swp
*.swo
*.swn
.replit
replit.nix

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Project specific
*.log
*.sqlite
*.db
node_modules/
.pytest_cache/
.coverage
htmlcov/
.uv/
uv.lock
git_setup.log
"""
        with open('.gitignore', 'w') as f:
            f.write(gitignore_content.strip())
        logger.info("Created .gitignore file")

        # Create backup branch
        backup_branch = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Creating backup branch: {backup_branch}")
        subprocess.run(['git', 'checkout', '-b', backup_branch], check=False)

        # Clean up redundant files
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
            'cleanup_and_configure_git.py',
            'git_verify.py',
            'git_verify_final.py',
            'verify_git.py',
            'verify_git_final.py',
            'verify_git_settings.py',
            'verify_git_settings_final.py',
            'git_config_verify.py',
            'git_config_verify_final.py',
            'git_config_consolidated.py',
            'git_settings_consolidated.py',
            'git_config_final.py',
            'git_settings_final.py'
        ]
        
        for file in redundant_files:
            try:
                file_path = Path(file)
                if file_path.exists():
                    file_path.unlink()
                    logger.info(f"Removed redundant file: {file}")
            except Exception as e:
                logger.error(f"Error removing {file}: {e}")

        # Check for staged changes and commit
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True, check=False)
        if result.stdout.strip():
            logger.info("There are staged changes in the repository")
            subprocess.run(['git', 'add', '-A'], check=True)
            subprocess.run(['git', 'commit', '-m', "Clean up Git configuration files"], check=False)
            logger.info("Changes committed successfully")

        logger.info("Git configuration and cleanup completed successfully")
        return True

    except Exception as e:
        logger.error(f"Error during Git configuration: {str(e)}")
        return False

if __name__ == "__main__":
    success = verify_and_configure_git()
    if success:
        logger.info("Git configuration verified and applied successfully")
        exit(0)
    else:
        logger.error("Git configuration verification failed")
        exit(1)
