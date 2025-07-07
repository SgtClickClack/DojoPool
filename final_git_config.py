#!/usr/bin/env python3
import os
import subprocess
import logging
from pathlib import Path
from datetime import datetime

# Configure logging with enhanced setup
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Create handlers with unique names to avoid duplicates
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
        # Check Git user settings
        user_email = subprocess.run(['git', 'config', '--get', 'user.email'], 
                                  capture_output=True, text=True).stdout.strip()
        user_name = subprocess.run(['git', 'config', '--get', 'user.name'], 
                                 capture_output=True, text=True).stdout.strip()
        
        if not user_email or not user_name:
            logger.error("Git user configuration is incomplete")
            return False
            
        logger.info(f"Git configuration verified - Email: {user_email}, Name: {user_name}")
        return True
    except Exception as e:
        logger.error(f"Error verifying Git configuration: {str(e)}")
        return False

def run_git_command(command, check=True):
    """Run a git command and return the output."""
    try:
        if isinstance(command, str):
            command = command.split()
        logger.debug(f"Executing git command: {' '.join(command)}")
        result = subprocess.run(command, capture_output=True, text=True, check=check)
        if check:
            result.check_returncode()
        logger.debug(f"Command output: {result.stdout.strip()}")
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Git command failed with return code {e.returncode}: {e.stderr.strip()}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error running git command: {str(e)}")
        return None

def cleanup_redundant_files():
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
        'cleanup_and_configure_git.py',
        'scripts/cleanup_git_files.py',
        'scripts/cleanup_git_redundant.py',
        'scripts/cleanup_git_scripts.py',
        'scripts/configure_git_auth_final.py',
        'scripts/git_manager.py',
        'scripts/git_manager_consolidated.py',
        'scripts/git_setup_consolidated.py',
        'scripts/cleanup_and_configure_git_final.py',
        'scripts/final_git_setup.py',
        'scripts/git_config_final.py',
        'git_config_final.py'
    ]
    
    for file in redundant_files:
        try:
            file_path = Path(file)
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Removed {file}")
        except Exception as e:
            logger.error(f"Error removing {file}: {e}")

def configure_git():
    """Configure Git settings and verify configuration."""
    try:
        # Configure Git settings
        logger.info("Configuring Git settings...")
        git_configs = [
            ["git", "config", "core.fileMode", "false"],
            ["git", "config", "core.autocrlf", "input"],
            ["git", "config", "pull.rebase", "false"],
            ["git", "config", "merge.ff", "false"],
            ["git", "config", "--global", "user.email", "replit@users.noreply.github.com"],
            ["git", "config", "--global", "user.name", "Replit User"],
            ["git", "config", "--global", "init.defaultBranch", "main"],
            ["git", "config", "--global", "credential.helper", "store"],
            ["git", "config", "--global", "core.excludesFile", ".gitignore"]
        ]
        
        for config in git_configs:
            if run_git_command(config) is None:
                return False

        # Verify the configuration
        if not verify_git_config():
            return False

        # Create backup branch with unique name
        backup_branch = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Creating backup branch: {backup_branch}")
        run_git_command(f"git checkout -b {backup_branch}", check=False)

        # Update .gitignore
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
        logger.info("Updated .gitignore file")

        # Add and commit changes
        run_git_command("git add -A")
        status = run_git_command("git status --porcelain")
        if status:
            logger.info("Creating commit with changes...")
            run_git_command(['git', 'commit', '-m', "Configure Git settings and update .gitignore"])

        # Switch to main branch
        current_branch = run_git_command("git rev-parse --abbrev-ref HEAD")
        if current_branch != "main":
            run_git_command("git checkout -b main", check=False)
        
        logger.info("Git configuration completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error during git setup: {str(e)}")
        return False

if __name__ == "__main__":
    try:
        # First clean up redundant files
        cleanup_redundant_files()
        
        # Configure Git
        if not configure_git():
            logger.error("Failed to configure Git")
            exit(1)
            
        logger.info("Git setup and configuration completed successfully")
    except Exception as e:
        logger.error(f"Error during setup: {str(e)}")
        exit(1)
