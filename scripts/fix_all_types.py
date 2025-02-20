#!/usr/bin/env python3
"""Script to run all type fixers in sequence."""

from pathlib import Path
from typing import List

from fix_sqlalchemy_types import SQLAlchemyTypeFixer
from fix_flask_types import FlaskTypeFixer
from fix_pydantic_types import PydanticTypeFixer


def fix_all_types(root_dir: Path) -> None:
    """Run all type fixers on the codebase.

    Args:
        root_dir: Root directory of the codebase
    """
    # Find all Python files
    python_files = list(root_dir.rglob("*.py"))

    # Fix SQLAlchemy types
    print("\nFixing SQLAlchemy types...")
    for file_path in python_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                if "from sqlalchemy" in content or "import sqlalchemy" in content:
                    fixer = SQLAlchemyTypeFixer(file_path)
                    fixer.fix()
        except Exception as e:
            print(f"Error fixing SQLAlchemy types in {file_path}: {e}")

    # Fix Flask types
    print("\nFixing Flask types...")
    for file_path in python_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                if "from flask import" in content or "import flask" in content:
                    fixer = FlaskTypeFixer(file_path)
                    fixer.fix()
        except Exception as e:
            print(f"Error fixing Flask types in {file_path}: {e}")

    # Fix Pydantic types
    print("\nFixing Pydantic types...")
    for file_path in python_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                if "from pydantic import" in content or "import pydantic" in content:
                    fixer = PydanticTypeFixer(file_path)
                    fixer.fix()
        except Exception as e:
            print(f"Error fixing Pydantic types in {file_path}: {e}")


def main() -> None:
    """Main function to run all type fixers."""
    root_dir = Path("src/dojopool")
    print("Starting type fixing process...")
    fix_all_types(root_dir)
    print("\nCompleted type fixing process!")


if __name__ == "__main__":
    main()
