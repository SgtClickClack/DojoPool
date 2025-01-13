"""File name sanitization utilities."""
import os
import re
from typing import Set
from unicodedata import normalize

# Characters that should be escaped in filenames
DANGEROUS_CHARS: Set[str] = {
    '/', '\\', ':', '*', '?', '"', '<', '>', '|',  # Invalid filename chars
    ';', '&', '`', '$', '|', '!',  # Shell special chars
    '\n', '\r', '\t', '\0', '\f',  # Control chars
    '..',  # Path traversal
}

# File extensions that should be blocked
BLOCKED_EXTENSIONS: Set[str] = {
    # Executable
    'exe', 'dll', 'so', 'bat', 'cmd', 'com', 'pif', 'scr', 'vb', 'vbs',
    'vbe', 'js', 'jse', 'ws', 'wsf', 'wsh', 'ps1', 'msi', 'msp', 'hta',
    # System
    'sys', 'drv', 'bin', 'reg',
    # Archive that might contain dangerous files
    'zip', 'rar', '7z', 'tar', 'gz', 'cab',
}

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and command injection.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
        
    Raises:
        ValueError: If filename is empty or contains only dangerous characters
    """
    if not filename or not filename.strip():
        raise ValueError("Empty filename")

    # Normalize unicode characters
    filename = normalize('NFKD', filename).encode('ascii', 'ignore').decode('ascii')
    
    # Get name and extension
    name, ext = os.path.splitext(filename)
    if ext:
        ext = ext[1:].lower()  # Remove dot and convert to lowercase
        
    # Check for blocked extensions
    if ext in BLOCKED_EXTENSIONS:
        raise ValueError(f"File extension '{ext}' is not allowed")
        
    # Remove or replace dangerous characters
    name = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '_', name)
    
    # Replace multiple dots with single dot
    name = re.sub(r'\.+', '.', name)
    
    # Replace multiple underscores with single underscore
    name = re.sub(r'_+', '_', name)
    
    # Remove leading/trailing dots and spaces
    name = name.strip('. ')
    
    # Check if filename became empty after sanitization
    if not name:
        raise ValueError("Invalid filename")
        
    # Reconstruct filename with extension
    if ext:
        return f"{name}.{ext}"
    return name

def is_safe_path(base_path: str, path: str) -> bool:
    """
    Check if a path is safe (doesn't escape base directory).
    
    Args:
        base_path: Base directory path
        path: Path to check
        
    Returns:
        True if path is safe, False otherwise
    """
    try:
        base_path = os.path.abspath(base_path)
        full_path = os.path.abspath(os.path.join(base_path, path))
        return os.path.commonpath([base_path, full_path]) == base_path
    except (ValueError, TypeError):
        return False

def get_safe_filename(filename: str, existing_files: Set[str] | None = None) -> str:
    """
    Get a safe, unique filename.
    
    Args:
        filename: Original filename
        existing_files: Set of existing filenames to avoid duplicates
        
    Returns:
        Safe, unique filename
    """
    safe_name = sanitize_filename(filename)
    
    if not existing_files:
        return safe_name
        
    # If filename exists, append number
    name, ext = os.path.splitext(safe_name)
    counter = 1
    
    while safe_name in existing_files:
        safe_name = f"{name}_{counter}{ext}"
        counter += 1
        
    return safe_name

def is_safe_file_type(filename: str, allowed_extensions: Set[str]) -> bool:
    """
    Check if file type is allowed based on extension.
    
    Args:
        filename: Filename to check
        allowed_extensions: Set of allowed file extensions
        
    Returns:
        True if file type is allowed, False otherwise
    """
    ext = os.path.splitext(filename)[1][1:].lower()
    return ext in allowed_extensions 