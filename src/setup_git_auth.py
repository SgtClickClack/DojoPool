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
    except Exception as e:
        logger.error(f"Error running git command: {str(e)}")
        return None

def setup_git_auth():
    """Set up Git with authentication and clean up repository."""
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
            ["git", "config", "--global", "credential.helper", "store"],
            ["git", "config", "--global", "core.excludesFile", ".gitignore"]
        ]
        
        for config in git_configs:
            if run_git_command(config) is None:
                return False

        # Create backup branch
        backup_branch = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Creating backup branch: {backup_branch}")
        run_git_command(f"git checkout -b {backup_branch}", check=False)

        # Remove problematic configurations
        if Path('.gitmodules').exists():
            os.remove('.gitmodules')
            logger.info("Removed .gitmodules file")

        # Clean and reset repository
        run_git_command("git rm -rf --cached .", check=False)
        run_git_command("git gc --prune=now", check=False)
        run_git_command("git remote prune origin", check=False)
        
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
        
        # Clean up old branches except the latest backup
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
    success = setup_git_auth()
    print(f"Git configuration {'succeeded' if success else 'failed'}")
