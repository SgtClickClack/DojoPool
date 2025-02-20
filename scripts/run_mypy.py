#!/usr/bin/env python3
"""Script to run mypy type checks."""

import subprocess
import sys
from pathlib import Path


def run_mypy_checks(src_dir: Path) -> bool:
    """Run mypy type checks on the given directory.

    Args:
        src_dir: Directory to check

    Returns:
        bool: True if checks passed, False otherwise
    """
    result = subprocess.run(
        ["mypy", str(src_dir)], capture_output=True, text=True, check=False
    )
    return result.returncode == 0


def main() :
    """Run mypy type checks on the codebase."""
    project_root = Path(__file__).parent.parent
    src_dir = project_root / "src" / "dojopool"

    print("Running mypy type checks...")
    if run_mypy_checks(src_dir):
        print("✅ Mypy checks passed!")
        sys.exit(0)
    else:
        print("❌ Mypy checks failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
