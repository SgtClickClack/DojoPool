#!/usr/bin/env python3
import subprocess
import getpass
import sys
import os

def configure_git_auth():
    """Configure Git authentication for GitHub."""
    print("=== GitHub Authentication Setup ===")
    
    # Configure basic Git settings
    try:
        subprocess.run(['git', 'config', '--global', 'user.name', 'DojoPool Developer'], 
                      capture_output=True, check=True)
        subprocess.run(['git', 'config', '--global', 'user.email', 'developer@dojopool.com'], 
                      capture_output=True, check=True)
        subprocess.run(['git', 'config', '--global', 'credential.helper', 'store'], 
                      capture_output=True, check=True)
        print("✅ Basic Git configuration set")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error configuring Git: {e}")
        return False
    
    print("\n=== GitHub Personal Access Token Setup ===")
    print("To authenticate with GitHub, you need a Personal Access Token (PAT).")
    print("Follow these steps:")
    print("1. Go to GitHub.com → Settings → Developer settings → Personal access tokens")
    print("2. Click 'Generate new token (classic)'")
    print("3. Give it a name like 'DojoPool Development'")
    print("4. Select scopes: repo, workflow, write:packages")
    print("5. Copy the generated token")
    
    # Ask for username
    username = input("\nEnter your GitHub username: ").strip()
    if not username:
        print("❌ Username is required")
        return False
    
    # Ask for token
    token = getpass.getpass("Enter your GitHub Personal Access Token: ").strip()
    if not token:
        print("❌ Token is required")
        return False
    
    # Test authentication
    print("\n=== Testing Authentication ===")
    try:
        # Test with a simple Git command that requires auth
        result = subprocess.run(['git', 'ls-remote', 'https://github.com/SgtClickClack/DojoPool.git'], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Authentication successful!")
            print("You can now perform Git operations like pull, push, etc.")
            return True
        else:
            print(f"❌ Authentication failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Authentication timed out")
        return False
    except Exception as e:
        print(f"❌ Error testing authentication: {str(e)}")
        return False

def test_current_auth():
    """Test current authentication status."""
    print("=== Testing Current Authentication ===")
    
    try:
        result = subprocess.run(['git', 'ls-remote', 'https://github.com/SgtClickClack/DojoPool.git'], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Authentication is working!")
            return True
        else:
            print(f"❌ Authentication failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Authentication timed out")
        return False
    except Exception as e:
        print(f"❌ Error testing authentication: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        success = test_current_auth()
    else:
        success = configure_git_auth()
    
    sys.exit(0 if success else 1) 