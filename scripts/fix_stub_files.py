#!/usr/bin/env python3
"""Script to fix type stub files and ensure proper class definitions."""

import os
from pathlib import Path
from typing import List, Set


def fix_stub_file(stub_file: Path) -> None:
    """Fix a stub file by ensuring proper class definitions and indentation."""
    try:
        with open(stub_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        fixed_lines: List[str] = []
        in_class = False
        class_name = ""

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Handle class definitions
            if stripped.startswith("class "):
                in_class = True
                class_name = stripped.split("(")[0].split(":")[0].split()[1]
                fixed_lines.append(line)

                # Look ahead to see if there's content
                next_lines = [l.strip() for l in lines[i + 1 :] if l.strip()]
                if not next_lines or all(
                    l.startswith(("class ", "def ", "from ", "import "))
                    for l in next_lines
                ):
                    fixed_lines.append("    pass\n")
                    in_class = False

            # Handle empty lines in class
            elif in_class and not stripped:
                fixed_lines.append(line)

                # Look ahead to see if class is empty
                next_lines = [l.strip() for l in lines[i + 1 :] if l.strip()]
                if not next_lines or all(
                    l.startswith(("class ", "def ", "from ", "import "))
                    for l in next_lines
                ):
                    fixed_lines.append("    pass\n")
                    in_class = False

            # Handle other lines
            else:
                fixed_lines.append(line)
                if stripped and not stripped.startswith(("from ", "import ")):
                    in_class = False

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
