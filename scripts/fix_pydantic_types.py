#!/usr/bin/env python3
"""Script to fix Pydantic model type issues in the codebase."""

import ast
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union

from base_type_fixer import BaseTypeFixer


class PydanticTypeFixer(BaseTypeFixer):
    """Class to fix Pydantic type issues."""

    FIELD_TYPES_MAP = {
        "str": "str",
        "int": "int",
        "float": "float",
        "bool": "bool",
        "list": "List",
        "dict": "Dict",
        "datetime": "datetime",
        "date": "date",
        "uuid": "UUID",
        "bytes": "bytes",
        "decimal": "Decimal",
        "set": "Set",
        "tuple": "Tuple",
        "frozenset": "FrozenSet",
        "path": "Path",
        "ipaddress": "IPAddress",
        "url": "AnyUrl",
        "email": "EmailStr",
        "json": "Json",
        "color": "Color",
        "secret": "SecretStr",
    }

    def __init__(self, file_path: Path):
        """Initialize the fixer."""
        super().__init__(file_path)
        self.needed_imports = {
            "from datetime import datetime, date",
            "from decimal import Decimal",
            "from pathlib import Path",
            "from typing import Any, Dict, List, Optional, Set, Tuple, Union, FrozenSet",
            "from uuid import UUID",
            "from pydantic import BaseModel, Field, validator, EmailStr, AnyUrl, Json, SecretStr",
            "from pydantic.color import Color",
            "from pydantic.networks import IPAddress",
        }
        self.current_class: Optional[str] = None

    def fix_model_inheritance(self) -> None:
        """Fix model inheritance to use proper base class."""
        if re.search(r"class\s+\w+\s*\(\s*\):", self.content):
            self.content = re.sub(
                r"class\s+(\w+)\s*\(\s*\):", r"class \1(BaseModel):", self.content
            )
            self.modified = True

    def fix_field_types(self) :
        """Fix Pydantic field type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.ClassDef):
                self.current_class = node.name
                # Check if this is a Pydantic model
                is_pydantic = any(
                    isinstance(base, ast.Name) and base.id == "BaseModel"
                    for base in node.bases
                )

                if is_pydantic:
                    # Fix field annotations
                    for child in node.body:
                        if isinstance(child, ast.AnnAssign):
                            field_source = ast.get_source_segment(self.content, child)
                            if not field_source:
                                continue

                            # Add Field() if missing
                            if "=" not in field_source:
                                field_name = field_source.split(":")[0].strip()
                                field_type = field_source.split(":")[1].strip()
                                self.content = self.content.replace(
                                    field_source,
                                    f"{field_name}: {field_type} = Field()",
                                )
                                self.modified = True

    def fix_validators(self) :
        """Fix Pydantic validator decorators and type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef):
                # Check if this is a validator
                has_validator = any(
                    isinstance(d, ast.Call)
                    and isinstance(d.func, ast.Name)
                    and d.func.id == "validator"
                    for d in node.decorator_list
                )

                if has_validator:
                    # Get the function's source code
                    func_source = ast.get_source_segment(self.content, node)
                    if not func_source:
                        continue

                    # Add return type annotation if missing
                    if not node.returns:
                        self.content = self.content.replace(
                            func_source, func_source.replace(":", " :", 1)
                        )
                        self.modified = True

    def fix_config_class(self) -> None:
        """Fix Pydantic Config class."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.ClassDef):
                # Check if this is a Config class
                if node.name == "Config":
                    config_source = ast.get_source_segment(self.content, node)
                    if not config_source:
                        continue

                    # Add type annotations to Config class attributes
                    for child in node.body:
                        if isinstance(child, ast.Assign):
                            assign_source = ast.get_source_segment(self.content, child)
                            if not assign_source:
                                continue

                            # Add type annotation based on value
                            for target in child.targets:
                                if isinstance(target, ast.Name):
                                    name = target.id
                                    value = ast.get_source_segment(
                                        self.content, child.value
                                    )
                                    if value:
                                        type_annotation = self._get_config_type(value)
                                        self.content = self.content.replace(
                                            f"{name} = {value}",
                                            f"{name}: {type_annotation} = {value}",
                                        )
                                        self.modified = True

    def fix_model_methods(self) :
        """Fix Pydantic model method type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.ClassDef):
                self.current_class = node.name
                # Check if this is a Pydantic model
                is_pydantic = any(
                    isinstance(base, ast.Name) and base.id == "BaseModel"
                    for base in node.bases
                )

                if is_pydantic:
                    # Fix method annotations
                    for child in node.body:
                        if isinstance(child, ast.FunctionDef):
                            # Get the function's source code
                            func_source = ast.get_source_segment(self.content, node)
                            if not func_source:
                                continue

                            # Add return type annotation if missing
                            if not child.returns:
                                return_type = self._determine_method_return_type(child)
                                self.content = self.content.replace(
                                    func_source,
                                    func_source.replace(":", f":", 1),
                                )
                                self.modified = True

    def _determine_method_return_type(self, node: ast.FunctionDef) :
        """Determine return type for a Pydantic model method."""
        # Check for common Pydantic method patterns
        if node.name == "dict":
            return "Dict[str, Any]"
        elif node.name == "json":
            return "str"
        elif node.name == "copy":
            return self.current_class if self.current_class else "Any"
        elif node.name.startswith("validate_"):
            return "Any"  # Validators can return any type
        else:
            return self._determine_function_return_type(node)

    def _get_config_type(self, value: str) :
        """Get type annotation for Config class attribute."""
        if value.startswith('"') or value.startswith("'"):
            return "str"
        elif value in ("True", "False"):
            return "bool"
        elif value.isdigit():
            return "int"
        elif value == "...":
            return "Any"
        elif value.startswith("(") and value.endswith(")"):
            return "Tuple[Any, ...]"
        elif value.startswith("[") and value.endswith("]"):
            return "List[Any]"
        elif value.startswith("{") and value.endswith("}"):
            return "Dict[str, Any]"
        else:
            return "Any"

    def fix(self) -> None:
        """Fix all Pydantic type issues in the file."""
        print(f"Fixing Pydantic types in {self.file_path}")

        # Add imports first
        self.fix_imports(self.needed_imports)

        # Fix Pydantic-specific issues
        self.fix_model_inheritance()
        self.fix_field_types()
        self.fix_validators()
        self.fix_config_class()
        self.fix_model_methods()

        # Fix general type issues
        self.fix_function_return_types()
        self.fix_variable_annotations()
        self.fix_class_attributes()

        # Save changes
        self.save()


def main() -> None:
    """Main function to fix Pydantic type issues in the codebase."""
    root_dir = Path("src/dojopool")

    # Find all Python files that might contain Pydantic models
    model_files = []
    for path in root_dir.rglob("*.py"):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            if "from pydantic import" in content or "import pydantic" in content:
                model_files.append(path)

    # Fix each file
    for file_path in model_files:
        try:
            fixer = PydanticTypeFixer(file_path)
            fixer.fix()
        except Exception as e:
            print(f"Error fixing {file_path}: {e}")


if __name__ == "__main__":
    main()
