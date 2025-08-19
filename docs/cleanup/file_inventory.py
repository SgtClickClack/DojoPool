"""
File inventory generator for DojoPool codebase cleanup.
This script creates a detailed inventory of all files in the project,
which we can then systematically process for cleanup.
"""

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path


def calculate_file_hash(file_path):
    """Calculate SHA-256 hash of file contents."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def get_file_info(file_path):
    """Get detailed information about a file."""
    stat = os.stat(file_path)
    return {
        "path": str(file_path),
        "size": stat.st_size,
        "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "hash": calculate_file_hash(file_path),
        "extension": file_path.suffix,
        "analyzed": False,
        "has_issues": False,
        "issues": [],
        "similar_files": [],
        "dependencies": [],
        "status": "pending",
    }


def create_inventory(root_dir):
    """Create inventory of all files in the project."""
    inventory = {
        "generated_at": datetime.now().isoformat(),
        "root_directory": str(root_dir),
        "files": [],
        "statistics": {
            "total_files": 0,
            "total_size": 0,
            "by_extension": {},
            "by_status": {"pending": 0, "analyzed": 0, "has_issues": 0},
        },
    }

    # Files/directories to ignore
    ignore_patterns = {
        ".git",
        "__pycache__",
        "node_modules",
        "venv",
        ".pyc",
        ".pyo",
        ".pyd",
        ".DS_Store",
    }

    for path in Path(root_dir).rglob("*"):
        # Skip ignored patterns
        if any(ignored in str(path) for ignored in ignore_patterns):
            continue

        if path.is_file():
            file_info = get_file_info(path)
            inventory["files"].append(file_info)

            # Update statistics
            inventory["statistics"]["total_files"] += 1
            inventory["statistics"]["total_size"] += file_info["size"]

            ext = file_info["extension"]
            if ext:
                inventory["statistics"]["by_extension"][ext] = (
                    inventory["statistics"]["by_extension"].get(ext, 0) + 1
                )

            inventory["statistics"]["by_status"]["pending"] += 1

    return inventory


def save_inventory(inventory, output_file):
    """Save inventory to JSON file."""
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(inventory, f, indent=2)


def main():
    """Main function to generate inventory."""
    root_dir = Path(__file__).parent.parent.parent  # Project root
    inventory = create_inventory(root_dir)

    # Save full inventory
    inventory_file = Path(__file__).parent / "file_inventory.json"
    save_inventory(inventory, inventory_file)

    # Create markdown summary
    summary = f"""# File Inventory Summary
Generated at: {inventory['generated_at']}

## Statistics
- Total Files: {inventory['statistics']['total_files']}
- Total Size: {inventory['statistics']['total_size'] / 1024 / 1024:.2f} MB

## File Types
"""

    for ext, count in inventory["statistics"]["by_extension"].items():
        summary += f"- {ext}: {count} files\n"

    summary_file = Path(__file__).parent / "file_inventory_summary.md"
    with open(summary_file, "w", encoding="utf-8") as f:
        f.write(summary)


if __name__ == "__main__":
    main()
