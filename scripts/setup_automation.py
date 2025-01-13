#!/usr/bin/env python3
import os
import stat
from pathlib import Path
import shutil
import logging
import yaml
import platform
import subprocess
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def setup_git_hooks():
    """Set up Git hooks for context automation."""
    hooks_dir = Path('.git/hooks')
    if not hooks_dir.exists():
        logging.error("Git hooks directory not found. Is this a Git repository?")
        return False

    # Create pre-commit hook
    pre_commit = hooks_dir / 'pre-commit'
    pre_commit_content = """#!/bin/sh

# Run context validation
python src/dojopool/scripts/validate_context.py
validation_status=$?

if [ $validation_status -ne 0 ]; then
    echo "Context validation failed! Please fix documentation inconsistencies before committing."
    exit 1
fi

# Run update context to ensure documentation is current
python src/dojopool/scripts/update_context.py
update_status=$?

if [ $update_status -ne 0 ]; then
    echo "Context update failed! Please check the error messages above."
    exit 1
fi

exit 0
"""
    
    # Write the hook file
    with open(pre_commit, 'w') as f:
        f.write(pre_commit_content)
    
    # Make hook executable
    st = os.stat(pre_commit)
    os.chmod(pre_commit, st.st_mode | stat.S_IEXEC)
    
    logging.info("Git hooks installed successfully")
    return True

def create_config():
    """Create configuration file for context automation."""
    config = {
        'context_automation': {
            'enabled': True,
            'check_frequency': 'commit',  # 'commit', 'push', or 'daily'
            'update_tracking': True,
            'validate_docs': True,
            'notify_changes': True
        },
        'documentation': {
            'tracking_file': 'docs/DEVELOPMENT_TRACKING.md',
            'index_file': 'docs/DOCUMENTATION_INDEX.md',
            'update_threshold': 10  # minimum lines changed to trigger update
        },
        'notifications': {
            'email': False,
            'console': True,
            'log_file': True
        }
    }
    
    config_file = Path('context_automation.yaml')
    with open(config_file, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
    
    logging.info("Configuration file created successfully")
    return True

def setup_scheduled_task():
    """Set up scheduled task for daily context validation."""
    if platform.system() == 'Windows':
        # Windows Task Scheduler
        script_path = os.path.abspath('src/dojopool/scripts/validate_context.py')
        python_path = sys.executable
        command = f'"{python_path}" "{script_path}"'
        
        # Create the scheduled task
        task_name = "DojoPoolContextValidation"
        try:
            # Delete existing task if it exists
            subprocess.run(['schtasks', '/delete', '/tn', task_name, '/f'], 
                         capture_output=True, check=False)
            
            # Create new task to run daily at midnight
            result = subprocess.run([
                'schtasks', '/create', '/tn', task_name,
                '/tr', command,
                '/sc', 'daily',
                '/st', '00:00'
            ], capture_output=True, check=True)
            
            logging.info("Windows scheduled task created successfully")
            return True
            
        except subprocess.CalledProcessError as e:
            logging.error(f"Failed to create Windows scheduled task: {e}")
            return False
    else:
        # Unix crontab
        try:
            from crontab import CronTab
            
            cron = CronTab(user=True)
            job = cron.new(command=f'cd {os.getcwd()} && python src/dojopool/scripts/validate_context.py')
            job.setall('0 0 * * *')
            
            cron.write()
            logging.info("Unix cron job set up successfully")
            return True
        except ImportError:
            logging.error("python-crontab not installed. Please install it for Unix systems.")
            return False
        except Exception as e:
            logging.error(f"Failed to set up Unix cron job: {e}")
            return False

def main():
    """Set up context automation."""
    success = True
    
    # Create necessary directories
    os.makedirs('logs', exist_ok=True)
    
    # Set up components
    if not setup_git_hooks():
        success = False
    
    if not create_config():
        success = False
    
    if not setup_scheduled_task():
        logging.warning("Daily validation will need to be set up manually")
    
    if success:
        logging.info("""
Context automation setup complete!

The following features are now enabled:
1. Pre-commit hooks for context validation
2. Automatic tracking of code changes
3. Daily context validation (via scheduled task)

To verify the setup:
1. Make some changes to the code
2. Try to commit them
3. Check the development tracking file for updates
""")
    else:
        logging.error("Context automation setup failed. Please check the errors above.")
    
    return 0 if success else 1

if __name__ == '__main__':
    main() 