from multiprocessing import Pool
from multiprocessing import Pool
"""Secure file permission utilities."""

import os
import stat
from pathlib import Path
from typing import Union

# Default secure permission modes
SECURE_DIR_MODE = 0o755  # rwxr-xr-x
SECURE_FILE_MODE = 0o644  # rw-r--r--
PRIVATE_FILE_MODE = 0o600  # rw-------


def set_secure_permissions(path: Union[str, Path], mode: int) -> None:
    """Set secure permissions on a file or directory.

    Args:
        path: Path to the file or directory
        mode: Permission mode to set (octal)
    """
    path = Path(path)
    try:
        os.chmod(path, mode)
    except OSError as e:
        raise OSError(f"Failed to set permissions on {path}: {e}")


def create_secure_directory(path: Union[str, Path], mode: int = SECURE_DIR_MODE):
    """Create a directory with secure permissions.

    Args:
        path: Path to create
        mode: Permission mode to set (default: 0o755)
    """
    path = Path(path)
    try:
        path.mkdir(parents=True, exist_ok=True)
        set_secure_permissions(path, mode)
    except OSError as e:
        raise OSError(f"Failed to create secure directory {path}: {e}")


def create_secure_file(path: Union[str, Path], mode: int = SECURE_FILE_MODE):
    """Create a file with secure permissions.

    Args:
        path: Path to create
        mode: Permission mode to set (default: 0o644)
    """
    path = Path(path)
    try:
        # Create parent directories if they don't exist
        path.parent.mkdir(parents=True, exist_ok=True)

        # Create file if it doesn't exist
        if not path.exists():
            path.touch()

        set_secure_permissions(path, mode)
    except OSError as e:
        raise OSError(f"Failed to create secure file {path}: {e}")


def secure_directory_tree(
    root_path: Union[str, Path],
    dir_mode: int = SECURE_DIR_MODE,
    file_mode: int = SECURE_FILE_MODE,
):
    """Recursively set secure permissions on a directory tree.

    Args:
        root_path: Root directory to start from
        dir_mode: Permission mode for directories (default: 0o755)
        file_mode: Permission mode for files (default: 0o644)
    """
    root_path = Path(root_path)
    try:
        # Set permissions on root directory
        set_secure_permissions(root_path, dir_mode)

        # Walk directory tree
        for dirpath, dirnames, filenames in os.walk(root_path):
            # Set directory permissions
            for dirname in dirnames:
                path = Path(dirpath) / dirname
                set_secure_permissions(path, dir_mode)

            # Set file permissions
            for filename in filenames:
                path = Path(dirpath) / filename
                set_secure_permissions(path, file_mode)
    except OSError as e:
        raise OSError(f"Failed to secure directory tree {root_path}: {e}")


def verify_secure_permissions(path: Union[str, Path], expected_mode: int) -> bool:
    """Verify that a path has the expected secure permissions.

    Args:
        path: Path to check
        expected_mode: Expected permission mode

    Returns:
        bool: True if permissions match expected mode
    """
    path = Path(path)
    try:
        current_mode = stat.S_IMODE(os.stat(path).st_mode)
        return current_mode == expected_mode
    except OSError as e:
        raise OSError(f"Failed to check permissions on {path}: {e}")
