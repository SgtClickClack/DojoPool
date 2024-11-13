#!/usr/bin/env python3
import subprocess
import logging
import sys
from pathlib import Path
from datetime import datetime

# Configure logging with enhanced setup
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create handlers with unique names
file_handler = logging.FileHandler('git_setup.log')
console_handler = logging.StreamHandler()

# Create formatter and add it to handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

def validate_environment():
    """Validate the environment and Git installation."""
    try:
        # Check Python version
        python_version = sys.version_info
        if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 7):
            logger.error(f"Python version {python_version.major}.{python_version.minor} is not supported. Please use Python 3.7+")
            return False

        # Check Git installation
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True, check=True)
            logger.info(f"Git is installed: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.error("Git is not installed or not found in PATH")
            return False

        # Verify write permissions in current directory
        try:
            test_file = Path('.write_test')
            test_file.touch()
            test_file.unlink()
        except Exception as e:
            logger.error(f"No write permissions in current directory: {str(e)}")
            return False

        return True
    except Exception as e:
        logger.error(f"Environment validation failed: {str(e)}")
        return False

def cleanup_git_repository():
    """Clean up Git configuration files and optimize repository settings."""
    try:
        # Validate environment first
        if not validate_environment():
            return False

        # Define Git configurations with enhanced settings for Replit
        config_mapping = {
            'user.email': 'replit@users.noreply.github.com',
            'user.name': 'Replit User',
            'init.defaultBranch': 'main',
            'credential.helper': 'store',
            'core.fileMode': 'false',
            'core.autocrlf': 'input',
            'pull.rebase': 'false',
            'core.excludesFile': '.gitignore',
            'merge.ff': 'false',
            'fetch.prune': 'true',
            'gc.auto': '256',
            'pack.windowMemory': '100m',
            'pack.packSizeLimit': '100m',
            'pack.threads': '1'
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

        # Create backup branch with timestamp
        backup_branch = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"Creating backup branch: {backup_branch}")
        subprocess.run(['git', 'checkout', '-b', backup_branch], check=False)

        # Create comprehensive .gitignore
        gitignore_content = """# Python
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

# Large files
*.dll
*.pyd
*.so
*.dylib
*.exe
*.bin

# Replit specific
.config/
.cache/
.local/
.npm/
.nix/
.upm/
.git_backup/"""

        with open('.gitignore', 'w') as f:
            f.write(gitignore_content.strip())
        logger.info("Created comprehensive .gitignore file")

        # Clean up all redundant Git configuration files
        redundant_patterns = [
            'git_*.py', 'configure_git*.py', 'setup_git*.py', 
            'verify_git*.py', '*_git_*.py', 'cleanup_git*.py',
            'scripts/git_*.py', 'utils/git_*.py'
        ]
        
        files_removed = []
        files_failed = []
        current_file = Path(__file__).name
        
        for pattern in redundant_patterns:
            for file_path in Path('.').glob(pattern):
                if file_path.name != current_file:  # Keep only this file
                    try:
                        file_path.unlink()
                        files_removed.append(file_path.name)
                        logger.info(f"Removed redundant file: {file_path.name}")
                    except Exception as e:
                        files_failed.append((file_path.name, str(e)))
                        logger.error(f"Error removing {file_path.name}: {str(e)}")

        # Log cleanup results
        if files_removed:
            logger.info(f"Successfully removed {len(files_removed)} redundant files")
        if files_failed:
            logger.warning("Some files could not be removed:")
            for file, error in files_failed:
                logger.warning(f"- {file}: {error}")

        # Optimize Git repository
        logger.info("Optimizing Git repository...")
        subprocess.run(['git', 'gc', '--aggressive', '--prune=now'], check=False)
        subprocess.run(['git', 'repack', '-a', '-d', '--depth=250', '--window=250'], check=False)

        # Stage and commit changes
        result = subprocess.run(['git', 'status', '--porcelain'], 
                           capture_output=True, text=True, check=False)
        if result.stdout.strip():
            logger.info("Staging changes...")
            subprocess.run(['git', 'add', '-A'], check=True)
            subprocess.run(['git', 'commit', '-m', "Clean up and optimize Git configuration"], check=False)
            logger.info("Changes committed successfully")

        logger.info("Git configuration cleanup completed successfully")
        return True

    except Exception as e:
        logger.error(f"Error during Git configuration cleanup: {str(e)}")
        return False

if __name__ == "__main__":
    success = cleanup_git_repository()
    if success:
        logger.info("Git repository cleaned up and optimized successfully")
        exit(0)
    else:
        logger.error("Git repository cleanup failed")
        exit(1)
