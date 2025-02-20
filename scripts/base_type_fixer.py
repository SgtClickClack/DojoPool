#!/usr/bin/env python3
"""Base type fixer class with common functionality."""

import ast
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union


class BaseTypeFixer:
    """Base class for type fixers with common functionality."""

    def __init__(self, file_path: Path):
        """Initialize the fixer.

        Args:
            file_path: Path to the file to fix
        """
        self.file_path = file_path
        self.content = self.file_path.read_text(encoding="utf-8")
        self.tree = ast.parse(self.content)
        self.imports_to_add: Set[str] = set()
        self.modified = False

    def fix_imports(self, needed_imports: Set[str]) -> None:
        """Fix imports by adding missing ones.

        Args:
            needed_imports: Set of import statements to ensure exist
        """
        existing_imports = set(
            re.findall(r"^from .* import .*$", self.content, re.MULTILINE)
        )
        missing_imports = needed_imports - existing_imports

        if missing_imports:
            import_section = "\n".join(sorted(missing_imports))
            matches = list(
                re.finditer(r"^from .* import .*$", self.content, re.MULTILINE)
            )
            if matches:
                last_import = matches[-1]
                pos = last_import.end()
                self.content = (
                    f"{self.content[:pos]}\n{import_section}\n{self.content[pos:]}"
                )
            else:
                self.content = f"{import_section}\n\n{self.content}"
            self.modified = True

    def fix_function_return_types(self) -> None:
        """Fix missing function return type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef) and not node.returns:
                # Get the function's source code
                func_source = ast.get_source_segment(self.content, node)
                if not func_source:
                    continue

                # Determine return type
                return_type = self._determine_function_return_type(node)

                # Add return type annotation
                self.content = self.content.replace(
                    func_source, func_source.replace(":", f" :", 1)
                )
                self.modified = True

    def _determine_function_return_type(self, node: ast.FunctionDef) :
        """Determine appropriate return type for a function.

        Args:
            node: AST node of the function

        Returns:
            Return type annotation string
        """
        # Check for return statements
        has_return = False
        return_values = []
        for child in ast.walk(node):
            if isinstance(child, ast.Return):
                has_return = True
                if child.value:
                    return_values.append(child.value)

        if not has_return:
            return "None"
        elif not return_values:
            return "None"
        else:
            # Try to determine type from return values
            types = set()
            for value in return_values:
                if isinstance(value, ast.Constant):
                    types.add(type(value.value).__name__)
                elif isinstance(value, ast.List):
                    types.add("List[Any]")
                elif isinstance(value, ast.Dict):
                    types.add("Dict[Any, Any]")
                elif isinstance(value, ast.Name):
                    types.add(value.id)
                else:
                    types.add("Any")

            if len(types) == 1:
                return next(iter(types))
            else:
                return "Union[" + ", ".join(sorted(types)) + "]"

    def fix_variable_annotations(self) :
        """Fix missing variable type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Assign) and not isinstance(
                node.targets[0], ast.Subscript
            ):
                # Get the assignment source code
                assign_source = ast.get_source_segment(self.content, node)
                if not assign_source:
                    continue

                # Determine variable type
                var_type = self._determine_variable_type(node.value)

                # Add type annotation
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        self.content = self.content.replace(
                            f"{target.id} = ", f"{target.id}: {var_type} = "
                        )
                        self.modified = True

    def _determine_variable_type(self, value: ast.AST) -> str:
        """Determine appropriate type for a variable.

        Args:
            value: AST node of the value

        Returns:
            Type annotation string
        """
        if isinstance(value, ast.Constant):
            return type(value.value).__name__
        elif isinstance(value, ast.List):
            return "List[Any]"
        elif isinstance(value, ast.Dict):
            return "Dict[Any, Any]"
        elif isinstance(value, ast.Set):
            return "Set[Any]"
        elif isinstance(value, ast.Call):
            if isinstance(value.func, ast.Name):
                return value.func.id
        return "Any"

    def fix_class_attributes(self) :
        """Fix missing class attribute type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.ClassDef):
                for child in node.body:
                    if isinstance(child, ast.Assign):
                        # Get the assignment source code
                        assign_source = ast.get_source_segment(self.content, child)
                        if not assign_source:
                            continue

                        # Determine attribute type
                        attr_type = self._determine_variable_type(child.value)

                        # Add type annotation
                        for target in child.targets:
                            if isinstance(target, ast.Name):
                                self.content = self.content.replace(
                                    f"{target.id} = ", f"{target.id}: {attr_type} = "
                                )
                                self.modified = True

    def save(self) :
        """Save changes to the file if modifications were made."""
        if self.modified:
            self.file_path.write_text(self.content, encoding="utf-8")
            print(f"Fixed types in {self.file_path}")
        else:
            print(f"No changes needed in {self.file_path}")

    def fix(self) -> None:
        """Fix all type issues in the file. Override in subclasses."""
        raise NotImplementedError("Subclasses must implement fix()")
