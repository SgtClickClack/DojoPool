import os
import subprocess
from pathlib import Path

def run_command(command):
    """Run a shell command and return the output"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {command}")
        print(f"Error message: {e.stderr}")
        return None

def init_git():
    """Initialize git repository with proper configuration"""
    # Initialize git repository if not already initialized
    if not Path('.git').exists():
        print("Initializing git repository...")
        run_command('git init')
    
    # Configure git
    print("Configuring git...")
    run_command('git config core.fileMode false')  # Ignore file mode changes
    run_command('git config core.autocrlf input')  # Handle line endings
    
    # Add files to git
    print("Adding files to git...")
    run_command('git add .')
    
    # Create initial commit if no commits exist
    if not run_command('git rev-parse --verify HEAD 2>/dev/null'):
        print("Creating initial commit...")
        run_command('git commit -m "Initial commit: Project setup"')
    
    print("Git repository initialized successfully!")

if __name__ == "__main__":
    init_git()
