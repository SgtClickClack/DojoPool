import os
import subprocess
import logging
from pathlib import Path
from datetime import datetime

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
        if result.returncode != 0 and check:
            logger.error(f"Git command failed: {result.stderr}")
            return None
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Git command failed: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Error running git command: {str(e)}")
        return None

def setup_and_configure_git():
    """Set up Git repository with authentication and clean up issues."""
    try:
        # Initialize repository if needed
        if not Path('.git').exists():
            logger.info("Initializing Git repository...")
            run_git_command("git init")

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
            ["git", "config", "--global", "credential.helper", "store"]
        ]
        
        for config in git_configs:
            if run_git_command(config) is None:
                return False

        # Create backup branch
        backup_branch = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Creating backup branch: {backup_branch}")
        run_git_command(f"git checkout -b {backup_branch}", check=False)

        # Clean up repository
        logger.info("Cleaning up repository...")
        
        # Remove submodule configurations if they exist
        if Path('.gitmodules').exists():
            os.remove('.gitmodules')
            logger.info("Removed .gitmodules file")

        # Reset and clean git cache
        run_git_command("git rm -rf --cached .", check=False)
        
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
"""
        with open('.gitignore', 'w') as f:
            f.write(gitignore_content.strip())
        logger.info("Updated .gitignore file")

        # Add all files
        logger.info("Adding all files...")
        run_git_command("git add -A")
        
        # Create commit if there are changes
        status = run_git_command("git status --porcelain")
        if status:
            logger.info("Creating commit with changes...")
            run_git_command(['git', 'commit', '-m', "Configure Git settings and clean up repository"])

        # Ensure we're on main branch
        current_branch = run_git_command("git rev-parse --abbrev-ref HEAD")
        if current_branch != "main":
            run_git_command("git checkout -b main", check=False)

        # Clean up old temporary branches except the latest backup
        branches = run_git_command("git branch")
        if branches:
            for branch in branches.split('\n'):
                branch = branch.strip('* ')
                if branch != 'main' and branch != backup_branch:
                    run_git_command(f"git branch -D {branch}", check=False)

        logger.info("Git configuration completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error during git setup: {str(e)}")
        return False

if __name__ == "__main__":
    success = setup_and_configure_git()
    print(f"Git configuration {'succeeded' if success else 'failed'}")
