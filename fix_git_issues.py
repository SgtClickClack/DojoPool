import subprocess
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_git_command(command):
    try:
        result = subprocess.run(command.split(), capture_output=True, text=True)
        return result.stdout.strip()
    except Exception as e:
        logger.error(f"Error running git command: {str(e)}")
        return None

def fix_git_issues():
    # Check current status
    logger.info("Checking Git status...")
    status = run_git_command("git status")
    print(f"Current status:\n{status}\n")
    
    # Create backup branch
    timestamp = run_git_command("date +%Y%m%d_%H%M%S")
    backup_branch = f"backup_{timestamp}"
    logger.info(f"Creating backup branch: {backup_branch}")
    run_git_command(f"git checkout -b {backup_branch}")
    
    # Check for submodules
    if Path('.gitmodules').exists():
        logger.info("Removing submodules...")
        with open('.gitmodules', 'r') as f:
            content = f.read()
            print(f"Found .gitmodules:\n{content}")
        
        # Remove submodule entries
        run_git_command("git rm --cached -r .")
        if Path('.gitmodules').exists():
            os.remove('.gitmodules')
    
    # Add all files
    logger.info("Adding all files...")
    run_git_command("git add .")
    
    # Create cleanup commit
    logger.info("Creating cleanup commit...")
    commit_result = run_git_command('git commit -m "Clean up repository and fix tracking issues"')
    print(f"Commit result:\n{commit_result}")
    
    # Switch back to main branch
    logger.info("Switching back to main branch...")
    run_git_command("git checkout main")
    
    # Final status check
    final_status = run_git_command("git status")
    print(f"\nFinal status:\n{final_status}")

if __name__ == "__main__":
    fix_git_issues()
