import subprocess
import sys
import os

def run_git_pull():
    try:
        # Check if we're in a git repository
        result = subprocess.run(['git', 'rev-parse', '--git-dir'], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            print("Not in a git repository")
            return False
            
        # Get current branch
        branch_result = subprocess.run(['git', 'branch', '--show-current'], 
                                     capture_output=True, text=True)
        current_branch = branch_result.stdout.strip()
        print(f"Current branch: {current_branch}")
        
        # Get remote info
        remote_result = subprocess.run(['git', 'remote', '-v'], 
                                     capture_output=True, text=True)
        print(f"Remote repositories:\n{remote_result.stdout}")
        
        # Perform git pull
        print("Pulling from remote...")
        pull_result = subprocess.run(['git', 'pull'], 
                                   capture_output=True, text=True)
        
        if pull_result.returncode == 0:
            print("Git pull successful!")
            if pull_result.stdout:
                print(f"Output: {pull_result.stdout}")
        else:
            print(f"Git pull failed: {pull_result.stderr}")
            
        # Show status
        status_result = subprocess.run(['git', 'status'], 
                                     capture_output=True, text=True)
        print(f"\nGit status:\n{status_result.stdout}")
        
        return pull_result.returncode == 0
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_git_pull()
    sys.exit(0 if success else 1) 