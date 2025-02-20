#!/usr/bin/env python3
"""Script to automatically fix common type annotation issues in the codebase."""

import ast
import os
import re
from pathlib import Path
from typing import List, Optional, Set, Tuple


def find_python_files(root_dir: str) -> List[Path]:
    """Find all Python files in the given directory and its subdirectories.

    Args:
        root_dir: Root directory to search in

    Returns:
        List of Path objects for Python files
    """
    python_files = []
    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".py"):
                python_files.append(Path(root) / file)
    return python_files


def fix_sqlalchemy_model(content: str) :
    """Fix SQLAlchemy model type annotations.

    Args:
        content: File content

    Returns:
        Fixed content
    """
    # Replace db.Model with proper SQLAlchemy model imports
    content = re.sub(
        r"class\s+\w+\(db\.Model\)",
        lambda m: m.group().replace("db.Model", "Base"),
        content,
    )

    # Add Base model import if not present
    if "from ..core.database import Base" not in content:
        imports = re.search(r'(from[^"\']*?\n|import[^"\']*?\n)+', content)
        if imports:
            content = (
                content[: imports.end()]
                + "from ..core.database import Base\n"
                + content[imports.end() :]
            )

    # Fix Column type annotations
    content = re.sub(
        r"(\w+)\s*=\s*Column\(", r"\1: Mapped[Any] = mapped_column(", content
    )

    return content


def fix_relationship_annotations(content: str) :
    """Fix SQLAlchemy relationship type annotations.

    Args:
        content: File content

    Returns:
        Fixed content
    """
    # Fix relationship type annotations
    content = re.sub(
        r'(\w+)\s*=\s*relationship\(["\'](\w+)["\']\)',
        r'\1: Mapped[List[\2]] = relationship("\2", lazy="select")',
        content,
    )

    return content


def fix_optional_types(content: str) :
    """Fix Optional type annotations.

    Args:
        content: File content

    Returns:
        Fixed content
    """
    # Replace Union[T, None] with Optional[T]
    content = re.sub(r"Union\[(\w+),\s*None\]", r"Optional[\1]", content)

    # Replace T | None with Optional[T]
    content = re.sub(r"(\w+)\s*\|\s*None", r"Optional[\1]", content)

    return content


def fix_missing_type_annotations(content: str) -> str:
    """Add missing type annotations to functions and variables.

    Args:
        content: File content

    Returns:
        Fixed content
    """
    tree = ast.parse(content)

    # Find all function definitions without return type annotations
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and not node.returns:
            # Add : node.end_lineno] + " :]
            )

    return content


def fix_file_type_annotations(file_path: Path) -> None:
    """Fix type annotations in a single file.

    Args:
        file_path: Path to the file to fix
    """
    print(f"Fixing type annotations in {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add missing imports
    if "from typing import" in content:
        content = re.sub(
            r"from typing import ([^\\n]+)",
            r"from typing import Any, Dict, List, Optional, Tuple, Union, \1",
            content,
        )
    else:
        content = (
            "from typing import Any, Dict, List, Optional, Tuple, Union\n" + content
        )

    # Fix various type annotations
    content = fix_sqlalchemy_model(content)
    content = fix_relationship_annotations(content)
    content = fix_optional_types(content)
    content = fix_missing_type_annotations(content)

    # Write fixed content back to file
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)


def main() -> None:
    """Main function to fix type annotations in the codebase."""
    root_dir = Path("src/dojopool")
    python_files = find_python_files(str(root_dir))

    for file_path in python_files:
        try:
            fix_file_type_annotations(file_path)
        except Exception as e:
            print(f"Error fixing {file_path}: {e}")


if __name__ == "__main__":
    main()
