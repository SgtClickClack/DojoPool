import unittest
import os
from pathlib import Path
from git_manager import GitManager

class TestGitSetup(unittest.TestCase):
    def test_git_initialization(self):
        """Test if git is properly initialized"""
        self.assertTrue(Path('.git').exists(), "Git repository should be initialized")
    
    def test_gitignore_existence(self):
        """Test if .gitignore file exists"""
        self.assertTrue(Path('.gitignore').exists(), ".gitignore file should exist")
    
    def test_git_status(self):
        """Test if git status command works"""
        status = GitManager.status()
        self.assertIsInstance(status, str, "Git status should return a string")
    
    def test_current_branch(self):
        """Test if we can get current branch name"""
        branch = GitManager.get_current_branch()
        self.assertIsInstance(branch, str, "Should get current branch name")
        self.assertTrue(len(branch) > 0, "Branch name should not be empty")

if __name__ == '__main__':
    unittest.main()
