#!/usr/bin/env python3
"""Script to fix type checking issues in the core modules."""

import os
import shutil
from pathlib import Path
from typing import List, Set


def get_python_files(directory: Path) -> Set[Path]:
    """Get all Python files in directory and subdirectories."""
    python_files = set()
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py") and not file.endswith(".pyi"):
                python_files.add(Path(root) / file)
    return python_files


def create_stub_files():
    """Create stub files for all core modules."""
    core_dir = Path("src/dojopool/core")

    # Ensure the core directory exists
    if not core_dir.exists():
        print(f"Error: {core_dir} does not exist")
        return

    # Create py.typed file in core directory
    with open(core_dir / "py.typed", "w") as f:
        f.write("# This file marks the package as having type information\n")

    # Get all Python files
    python_files = get_python_files(core_dir)

    for source_file in python_files:
        # Create corresponding stub file
        stub_file = source_file.with_suffix(".pyi")

        # Skip if stub already exists
        if stub_file.exists():
            continue

        print(f"Creating stub for {source_file}")

        # Read source file
        with open(source_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract imports and type definitions
        stub_lines: List[str] = []
        for line in content.splitlines():
            # Keep imports
            if line.startswith(("import ", "from ")):
                stub_lines.append(line)
            # Keep type aliases
            elif ": " in line and "=" in line and "type" in line.lower():
                stub_lines.append(line)
            # Keep class definitions with their methods
            elif line.startswith("class "):
                stub_lines.append(line)
            # Keep function definitions with type hints
            elif line.startswith("def ") and ":
                # Add only the function signature
                if ":" in line:
                    stub_lines.append(line.split(":")[0] + ": ...")
                else:
                    stub_lines.append(line)
            # Keep empty lines for readability
            elif not line.strip():
                stub_lines.append(line)

        # Write stub file
        with open(stub_file, "w", encoding="utf-8") as f:
            f.write("\n".join(stub_lines))


if __name__ == "__main__":
    create_stub_files()
