#!/usr/bin/env python3
"""Script to fix SQLAlchemy-specific type issues in the codebase."""

import ast
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union

from base_type_fixer import BaseTypeFixer


class SQLAlchemyTypeFixer(BaseTypeFixer):
    """Class to fix SQLAlchemy type issues."""

    COLUMN_TYPES_MAP = {
        "Integer": "int",
        "String": "str",
        "Text": "str",
        "Boolean": "bool",
        "DateTime": "datetime",
        "Date": "date",
        "Float": "float",
        "Numeric": "Decimal",
        "JSON": "Dict[str, Any]",
        "JSONB": "Dict[str, Any]",
        "LargeBinary": "bytes",
        "Enum": "str",  # This is a simplification, might need to be more specific
        "UUID": "UUID",
        "ARRAY": "List[Any]",
        "BigInteger": "int",
        "SmallInteger": "int",
        "Time": "time",
        "Interval": "timedelta",
    }

    RELATIONSHIP_TYPES_MAP = {
        "one_to_many": "List[{related_model}]",
        "many_to_one": "{related_model}",
        "one_to_one": "{related_model}",
        "many_to_many": "List[{related_model}]",
    }

    def __init__(self, file_path: Path):
        """Initialize the fixer."""
        super().__init__(file_path)
        self.needed_imports = {
            "from datetime import datetime, date, time, timedelta",
            "from decimal import Decimal",
            "from typing import Any, Dict, List, Optional, Set, Union",
            "from uuid import UUID",
            "from sqlalchemy import ForeignKey",
            "from sqlalchemy.orm import Mapped, mapped_column, relationship",
        }

    def fix_model_inheritance(self) -> None:
        """Fix model inheritance to use proper base class."""
        if "db.Model" in self.content:
            self.content = re.sub(
                r"class\s+(\w+)\s*\(\s*db\.Model\s*\)", r"class \1(Base)", self.content
            )
            self.needed_imports.add("from ..core.database import Base")
            self.modified = True

    def fix_column_types(self) :
        """Fix column type annotations."""
        # Fix basic column definitions
        for sa_type, py_type in self.COLUMN_TYPES_MAP.items():
            pattern = rf"(\w+)\s*=\s*(?:Column|mapped_column)\(\s*{sa_type}"
            replacement = rf"\1: Mapped[{py_type}] = mapped_column({sa_type}"
            if re.search(pattern, self.content):
                self.content = re.sub(pattern, replacement, self.content)
                self.modified = True

        # Fix nullable columns
        nullable_pattern = r"(\w+)\s*=\s*(?:Column|mapped_column)\(([^)]+),\s*nullable\s*=\s*True[^)]*\)"
        if re.search(nullable_pattern, self.content):
            self.content = re.sub(
                nullable_pattern,
                lambda m: f"{m.group(1)}: Mapped[Optional[{self._get_type_from_column(m.group(2))}]] = mapped_column({m.group(2)}, nullable=True)",
                self.content,
            )
            self.modified = True

    def fix_relationships(self) :
        """Fix relationship type annotations."""
        # Fix one-to-many relationships
        one_to_many_pattern = r'(\w+)\s*=\s*relationship\(["\'](\w+)["\'],\s*back_populates\s*=\s*["\'](\w+)["\']\)'
        if re.search(one_to_many_pattern, self.content):
            self.content = re.sub(
                one_to_many_pattern,
                r'\1: Mapped[List[\2]] = relationship("\2", back_populates="\3")',
                self.content,
            )
            self.modified = True

        # Fix many-to-one relationships
        many_to_one_pattern = r'(\w+)\s*=\s*relationship\(["\'](\w+)["\'],\s*back_populates\s*=\s*["\'](\w+)["\'],\s*uselist\s*=\s*False\)'
        if re.search(many_to_one_pattern, self.content):
            self.content = re.sub(
                many_to_one_pattern,
                r'\1: Mapped[\2] = relationship("\2", back_populates="\3", uselist=False)',
                self.content,
            )
            self.modified = True

        # Fix one-to-one relationships
        one_to_one_pattern = r'(\w+)\s*=\s*relationship\(["\'](\w+)["\'],\s*back_populates\s*=\s*["\'](\w+)["\'],\s*uselist\s*=\s*False,\s*single_parent\s*=\s*True\)'
        if re.search(one_to_one_pattern, self.content):
            self.content = re.sub(
                one_to_one_pattern,
                r'\1: Mapped[\2] = relationship("\2", back_populates="\3", uselist=False, single_parent=True)',
                self.content,
            )
            self.modified = True

    def fix_foreign_keys(self) -> None:
        """Fix foreign key type annotations."""
        fk_pattern = r'(\w+)_id\s*=\s*(?:Column|mapped_column)\((?:Integer|BigInteger),\s*ForeignKey\(["\'](\w+)\.id["\']\)'
        if re.search(fk_pattern, self.content):
            self.content = re.sub(
                fk_pattern,
                r'\1_id: Mapped[int] = mapped_column(ForeignKey("\2.id"))',
                self.content,
            )
            self.modified = True

    def fix_composite_keys(self) :
        """Fix composite key type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.ClassDef):
                # Check for __table_args__ with composite keys
                for child in node.body:
                    if isinstance(child, ast.Assign) and len(child.targets) == 1:
                        target = child.targets[0]
                        if (
                            isinstance(target, ast.Name)
                            and target.id == "__table_args__"
                        ):
                            # Add type annotation
                            assign_source = ast.get_source_segment(self.content, child)
                            if assign_source and "=" in assign_source:
                                self.content = self.content.replace(
                                    assign_source,
                                    assign_source.replace(
                                        "=", ": Tuple[Any, ...] =", 1
                                    ),
                                )
                                self.modified = True

    def _get_type_from_column(self, column_def: str) :
        """Get Python type from SQLAlchemy column definition."""
        for sa_type, py_type in self.COLUMN_TYPES_MAP.items():
            if sa_type in column_def:
                return py_type
        return "Any"

    def fix(self) :
        """Fix all SQLAlchemy type issues in the file."""
        print(f"Fixing SQLAlchemy types in {self.file_path}")

        # Add imports first
        self.fix_imports(self.needed_imports)

        # Fix model-specific issues
        self.fix_model_inheritance()
        self.fix_column_types()
        self.fix_relationships()
        self.fix_foreign_keys()
        self.fix_composite_keys()

        # Fix general type issues
        self.fix_function_return_types()
        self.fix_variable_annotations()
        self.fix_class_attributes()

        # Save changes
        self.save()


def main() -> None:
    """Main function to fix SQLAlchemy type issues in the codebase."""
    root_dir = Path("src/dojopool")

    # Find all Python files that might contain SQLAlchemy models
    model_files = []
    for path in root_dir.rglob("*.py"):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            if "from sqlalchemy" in content or "import sqlalchemy" in content:
                model_files.append(path)

    # Fix each file
    for file_path in model_files:
        try:
            fixer = SQLAlchemyTypeFixer(file_path)
            fixer.fix()
        except Exception as e:
            print(f"Error fixing {file_path}: {e}")


if __name__ == "__main__":
    main()
