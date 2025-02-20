#!/usr/bin/env python3
"""Script to fix all type stub files and ensure proper syntax."""

import os
from pathlib import Path
from typing import List, Set


def fix_stub_file(stub_file: Path) -> None:
    """Fix a stub file by ensuring proper syntax and class definitions."""
    try:
        with open(stub_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        fixed_lines: List[str] = []
        in_class = False
        paren_count = 0

        for line in lines:
            # Count parentheses
            paren_count += line.count("(") - line.count(")")

            # Handle class definitions
            if line.strip().startswith("class "):
                in_class = True
                if not line.strip().endswith(":"):
                    line = line.rstrip() + ":\n"
                fixed_lines.append(line)

                # Add pass if next line is empty or doesn't exist
                if (
                    len(lines) <= lines.index(line) + 1
                    or not lines[lines.index(line) + 1].strip()
                ):
                    fixed_lines.append("    pass\n")
                    in_class = False

            # Handle function definitions
            elif line.strip().startswith("def "):
                if paren_count > 0:
                    # Close any unclosed parentheses
                    line = line.rstrip() + ")" * paren_count + ": ...\n"
                    paren_count = 0
                elif not line.strip().endswith("..."):
                    line = line.rstrip() + ": ...\n"
                fixed_lines.append(line)

            # Handle other lines
            else:
                fixed_lines.append(line)

        # Write fixed content
        with open(stub_file, "w", encoding="utf-8") as f:
            f.writelines(fixed_lines)

    except Exception as e:
        print(f"Error fixing {stub_file}: {e}")


def get_stub_files(directory: Path) -> Set[Path]:
    """Get all .pyi files in directory and subdirectories."""
    stub_files = set()
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".pyi"):
                stub_files.add(Path(root) / file)
    return stub_files


def main() :
    """Main function to fix all stub files."""
    core_dir = Path("src/dojopool/core")

    if not core_dir.exists():
        print(f"Error: {core_dir} does not exist")
        return

    # Create py.typed file
    with open(core_dir / "py.typed", "w") as f:
        f.write("# This file marks the package as having type information\n")

    # Get all stub files
    stub_files = get_stub_files(core_dir)

    # Fix each stub file
    for stub_file in stub_files:
        print(f"Fixing {stub_file}")
        fix_stub_file(stub_file)


if __name__ == "__main__":
    main()
