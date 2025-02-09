"""Secure file permission handling utilities."""

import os
import stat
from pathlib import Path
from typing import Union

# Secure default permissions
DEFAULT_FILE_MODE = 0o644  # rw-r--r--
DEFAULT_DIR_MODE = 0o755   # rwxr-xr-x
SECURE_DIR_MODE = 0o750    # rwxr-x---
SECURE_FILE_MODE = 0o640   # rw-r-----
PRIVATE_FILE_MODE = 0o600  # rw-------

def secure_path(path: Union[str, Path], mode: int) -> None:
    """Set secure permissions on a file or directory.
    
    Args:
        path: Path to file or directory
        mode: Permission mode to set
        
    Raises:
        OSError: If permission change fails
    """
    try:
        os.chmod(path, mode)
    except OSError as e:
        raise OSError(f"Failed to set permissions on {path}: {e}")

def create_secure_directory(path: Union[str, Path], mode: int = DEFAULT_DIR_MODE) -> None:
    """Create a directory with secure permissions.
    
    Args:
        path: Directory path
        mode: Permission mode (defaults to 0o755)
        
    Raises:
        OSError: If directory creation fails
    """
    try:
        os.makedirs(path, mode=mode, exist_ok=True)
        # Ensure permissions are set even if directory existed
        secure_path(path, mode)
    except OSError as e:
        raise OSError(f"Failed to create secure directory {path}: {e}")

def create_secure_file(path: Union[str, Path], mode: int = DEFAULT_FILE_MODE) -> None:
    """Create a file with secure permissions.
    
    Args:
        path: File path
        mode: Permission mode (defaults to 0o644)
        
    Raises:
        OSError: If file creation fails
    """
    try:
        # Create parent directories if they don't exist
        parent = Path(path).parent
        if not parent.exists():
            create_secure_directory(parent)
            
        # Create file if it doesn't exist
        Path(path).touch(mode=mode, exist_ok=True)
        # Ensure permissions are set even if file existed
        secure_path(path, mode)
    except OSError as e:
        raise OSError(f"Failed to create secure file {path}: {e}")

def secure_directory_tree(root: Union[str, Path], 
                         dir_mode: int = DEFAULT_DIR_MODE,
                         file_mode: int = DEFAULT_FILE_MODE) -> None:
    """Recursively set secure permissions on a directory tree.
    
    Args:
        root: Root directory path
        dir_mode: Directory permission mode
        file_mode: File permission mode
        
    Raises:
        OSError: If permission changes fail
    """
    try:
        root_path = Path(root)
        
        # Set root directory permissions
        secure_path(root_path, dir_mode)
        
        # Walk directory tree
        for dirpath, dirnames, filenames in os.walk(root_path):
            # Set directory permissions
            for dirname in dirnames:
                path = Path(dirpath) / dirname
                secure_path(path, dir_mode)
                
            # Set file permissions
            for filename in filenames:
                path = Path(dirpath) / filename
                secure_path(path, file_mode)
    except OSError as e:
        raise OSError(f"Failed to secure directory tree {root}: {e}")

def is_secure_path(path: Union[str, Path], expected_mode: int) -> bool:
    """Check if a path has secure permissions.
    
    Args:
        path: Path to check
        expected_mode: Expected permission mode
        
    Returns:
        bool: True if permissions match expected mode
    """
    try:
        stat_info = os.stat(path)
        actual_mode = stat.S_IMODE(stat_info.st_mode)
        return actual_mode == expected_mode
    except OSError:
        return False

def verify_secure_permissions(path: Union[str, Path]) -> bool:
    """Verify that a path has appropriately secure permissions.
    
    Args:
        path: Path to verify
        
    Returns:
        bool: True if permissions are secure
    """
    try:
        path_obj = Path(path)
        stat_info = path_obj.stat()
        mode = stat.S_IMODE(stat_info.st_mode)
        
        if path_obj.is_dir():
            # Directory should not be world-writable
            return not bool(mode & stat.S_IWOTH)
        else:
            # File should not be world-writable or executable
            return not bool(mode & (stat.S_IWOTH | stat.S_IXOTH))
    except OSError:
        return False 