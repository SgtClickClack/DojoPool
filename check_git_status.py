from pathlib import Path
import subprocess
import os

def run_git_command(command):
    try:
        result = subprocess.run(command.split(), capture_output=True, text=True)
        return result.stdout.strip()
    except Exception as e:
        return f"Error: {str(e)}"

def check_git_status():
    # Check if .git exists
    if not Path('.git').exists():
        print("Git repository not initialized")
        return
        
    # Check status
    status = run_git_command("git status")
    print("Git Status:", status)
    
    # Check for submodules
    if Path('.gitmodules').exists():
        print("\nSubmodules found:")
        with open('.gitmodules', 'r') as f:
            print(f.read())
    else:
        print("\nNo .gitmodules file found")
        
    # List all git related files
    git_files = [str(p) for p in Path('.').glob('**/.git*')]
    print("\nGit related files:", git_files)

if __name__ == "__main__":
    check_git_status()
