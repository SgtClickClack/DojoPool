import os
import subprocess
import logging
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('git_setup.log')
    ]
)
logger = logging.getLogger(__name__)

def run_git_command(command, check=True):
    """Run a git command and return the output."""
    try:
        if isinstance(command, str):
            command = command.split()
        logger.debug(f"Executing git command: {' '.join(command)}")
        result = subprocess.run(command, capture_output=True, text=True, check=check)
        if result.returncode != 0 and check:
            logger.error(f"Git command failed: {result.stderr}")
            return None
        logger.debug(f"Command output: {result.stdout.strip()}")
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Git command failed with CalledProcessError: {str(e)}")
        logger.error(f"Command output: {e.stdout}")
        logger.error(f"Command error: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error running git command: {str(e)}", exc_info=True)
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
        'scripts/cleanup_and_configure_git_final.py'
    ]
    
    for file in redundant_files:
        try:
            file_path = Path(file)
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Removed {file}")
        except Exception as e:
            logger.error(f"Error removing {file}: {e}")

def setup_ssh():
    """Set up SSH keys for Git authentication."""
    try:
        logger.info("Setting up SSH authentication...")
        ssh_dir = Path.home() / '.ssh'
        ssh_dir.mkdir(mode=0o700, exist_ok=True)
        
        key_file = ssh_dir / 'id_rsa'
        if not key_file.exists():
            subprocess.run([
                'ssh-keygen',
                '-t', 'rsa',
                '-b', '4096',
                '-C', "replit@users.noreply.github.com",
                '-f', str(key_file),
                '-N', ''
            ], check=True)
            logger.info("SSH key generated successfully")
        else:
            logger.info("SSH key already exists")

        # Display the public key for the user
        with open(key_file.with_suffix('.pub'), 'r') as f:
            public_key = f.read().strip()
            logger.info("Public SSH key (add this to GitHub):")
            logger.info(public_key)
            
        return True
    except Exception as e:
        logger.error(f"Error setting up SSH: {str(e)}")
        return False

def configure_git():
    """Configure Git settings and clean up repository."""
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
            ["git", "config", "--global", "core.excludesFile", ".gitignore"],
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

        # Add all files
        logger.info("Adding all files...")
        run_git_command("git add -A")
        
        # Create commit if there are changes
        status = run_git_command("git status --porcelain")
        if status:
            logger.info("Creating commit with changes...")
            run_git_command(['git', 'commit', '-m', "Configure Git settings and clean up repository"])

        # Switch to main branch
        logger.info("Switching to main branch...")
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

        return True
        
    except Exception as e:
        logger.error(f"Error during git setup: {str(e)}")
        return False

def main():
    """Main execution function."""
    try:
        # First, clean up redundant files
        cleanup_redundant_files()
        
        # Set up SSH keys
        if not setup_ssh():
            logger.error("Failed to set up SSH authentication")
            return False

        # Configure Git
        if not configure_git():
            logger.error("Failed to configure Git")
            return False

        logger.info("Git setup and configuration completed successfully")
        return True

    except Exception as e:
        logger.error(f"Error during setup: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    print(f"Git configuration {'succeeded' if success else 'failed'}")