#!/usr/bin/env python3
import subprocess
import os
import sys

def main():
    print("=== Git Pull Script ===")
    
    # Check if we're in a git repo
    if not os.path.exists('.git'):
        print("Error: Not in a git repository")
        return False
    
    try:
        # Get current branch
        result = subprocess.run(['git', 'branch', '--show-current'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            branch = result.stdout.strip()
            print(f"Current branch: {branch}")
        else:
            print("Could not determine current branch")
            return False
        
        # Get remote info
        result = subprocess.run(['git', 'remote', '-v'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"Remote repositories:\n{result.stdout}")
        else:
            print("Could not get remote information")
            return False
        
        # Perform git pull
        print("\nPulling from remote...")
        result = subprocess.run(['git', 'pull'], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            if result.stdout.strip():
                print(f"Pull successful! Output:\n{result.stdout}")
            else:
                print("Pull successful! (Already up to date)")
        else:
            print(f"Pull failed: {result.stderr}")
            return False
        
        # Show final status
        result = subprocess.run(['git', 'status'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"\nFinal status:\n{result.stdout}")
        
        return True
        
    except subprocess.TimeoutExpired:
        print("Error: Command timed out")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 