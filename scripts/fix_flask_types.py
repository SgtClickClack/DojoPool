#!/usr/bin/env python3
"""Script to fix Flask-specific type issues in the codebase."""

import ast
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union

from base_type_fixer import BaseTypeFixer


class FlaskTypeFixer(BaseTypeFixer):
    """Class to fix Flask type issues."""

    ROUTE_RETURN_TYPES = {
        "jsonify": "Response",
        "render_template": "str",
        "redirect": "Response",
        "send_file": "Response",
        "make_response": "Response",
        "abort": "NoReturn",
        "send_from_directory": "Response",
        "url_for": "str",
        "flash": "None",
    }

    def __init__(self, file_path: Path):
        """Initialize the fixer."""
        super().__init__(file_path)
        self.needed_imports = {
            "from typing import Any, Dict, List, Optional, Tuple, Union, NoReturn",
            "from flask import Response, Request, current_app",
            "from flask.typing import ResponseReturnValue",
            "from werkzeug.wrappers import Response as WerkzeugResponse",
        }

    def fix_route_types(self) -> None:
        """Fix Flask route return type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef):
                # Check if this is a route function
                has_route_decorator = any(
                    isinstance(d, ast.Call)
                    and isinstance(d.func, ast.Attribute)
                    and d.func.attr == "route"
                    for d in node.decorator_list
                )

                if has_route_decorator:
                    # Get the function's source code
                    func_source = ast.get_source_segment(self.content, node)
                    if not func_source:
                        continue

                    # Determine return type based on function body
                    return_type = self._determine_route_return_type(node)

                    # Add or update return type annotation
                    if not node.returns:
                        self.content = self.content.replace(
                            func_source,
                            func_source.replace(":", f" :", 1),
                        )
                        self.modified = True
                    else:
                        old_return = ast.get_source_segment(self.content, node.returns)
                        if old_return:
                            self.content = self.content.replace(old_return, return_type)
                            self.modified = True

    def _determine_route_return_type(self, node: ast.FunctionDef) :
        """Determine appropriate return type for a route function."""
        return_funcs = set()
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    return_funcs.add(child.func.id)
                elif isinstance(child.func, ast.Attribute):
                    return_funcs.add(child.func.attr)

        # Check for known return types
        for func, return_type in self.ROUTE_RETURN_TYPES.items():
            if func in return_funcs:
                return return_type

        # Default to ResponseReturnValue for routes
        return "ResponseReturnValue"

    def fix_request_handling(self) :
        """Fix Flask request handling type annotations."""
        # Fix request.args access
        args_pattern = r"request\.args\.get\(([^)]+)\)"
        if re.search(args_pattern, self.content):
            self.content = re.sub(
                args_pattern, r"request.args.get(\1, type=str)", self.content
            )
            self.modified = True

        # Fix request.form access
        form_pattern = r"request\.form\.get\(([^)]+)\)"
        if re.search(form_pattern, self.content):
            self.content = re.sub(
                form_pattern, r"request.form.get(\1, type=str)", self.content
            )
            self.modified = True

        # Fix request.json access
        json_pattern = r"request\.json\[([^\]]+)\]"
        if re.search(json_pattern, self.content):
            self.content = re.sub(json_pattern, r"request.json.get(\1)", self.content)
            self.modified = True

    def fix_app_context(self) -> None:
        """Fix Flask app context type annotations."""
        # Fix current_app access
        app_pattern = r"current_app\.config\[([^\]]+)\]"
        if re.search(app_pattern, self.content):
            self.content = re.sub(
                app_pattern, r"current_app.config.get(\1)", self.content
            )
            self.modified = True

        # Fix g object access
        g_pattern = r"g\.([a-zA-Z_][a-zA-Z0-9_]*)"
        if re.search(g_pattern, self.content):
            self.content = re.sub(g_pattern, r'getattr(g, "\1", None)', self.content)
            self.modified = True

    def fix_error_handlers(self) -> None:
        """Fix Flask error handler type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef):
                # Check if this is an error handler
                has_error_handler = any(
                    isinstance(d, ast.Call)
                    and isinstance(d.func, ast.Attribute)
                    and d.func.attr == "errorhandler"
                    for d in node.decorator_list
                )

                if has_error_handler:
                    # Get the function's source code
                    func_source = ast.get_source_segment(self.content, node)
                    if not func_source:
                        continue

                    # Add return type annotation if missing
                    if not node.returns:
                        self.content = self.content.replace(
                            func_source,
                            func_source.replace(":", " :", 1),
                        )
                        self.modified = True

    def fix_view_classes(self) :
        """Fix Flask view class type annotations."""
        for node in ast.walk(self.tree):
            if isinstance(node, ast.ClassDef):
                # Check if this is a view class
                is_view = any(
                    isinstance(base, ast.Name) and base.id in ("View", "MethodView")
                    for base in node.bases
                )

                if is_view:
                    # Fix dispatch_request method
                    for child in node.body:
                        if (
                            isinstance(child, ast.FunctionDef)
                            and child.name == "dispatch_request"
                        ):
                            # Get the function's source code
                            func_source = ast.get_source_segment(self.content, child)
                            if not func_source:
                                continue

                            # Add return type annotation if missing
                            if not child.returns:
                                self.content = self.content.replace(
                                    func_source,
                                    func_source.replace(
                                        ":", " :", 1
                                    ),
                                )
                                self.modified = True

    def fix(self) -> None:
        """Fix all Flask type issues in the file."""
        print(f"Fixing Flask types in {self.file_path}")

        # Add imports first
        self.fix_imports(self.needed_imports)

        # Fix Flask-specific issues
        self.fix_route_types()
        self.fix_request_handling()
        self.fix_app_context()
        self.fix_error_handlers()
        self.fix_view_classes()

        # Fix general type issues
        self.fix_function_return_types()
        self.fix_variable_annotations()
        self.fix_class_attributes()

        # Save changes
        self.save()


def main() -> None:
    """Main function to fix Flask type issues in the codebase."""
    root_dir = Path("src/dojopool")

    # Find all Python files that might contain Flask code
    flask_files = []
    for path in root_dir.rglob("*.py"):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            if "from flask import" in content or "import flask" in content:
                flask_files.append(path)

    # Fix each file
    for file_path in flask_files:
        try:
            fixer = FlaskTypeFixer(file_path)
            fixer.fix()
        except Exception as e:
            print(f"Error fixing {file_path}: {e}")


if __name__ == "__main__":
    main()
