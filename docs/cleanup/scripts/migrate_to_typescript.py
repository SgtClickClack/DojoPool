"""Script to assist in migrating JavaScript files to TypeScript."""

import json
import os
import re
from pathlib import Path
from typing import Dict, List


class TypeScriptMigrator:
    """Assists in migrating JavaScript files to TypeScript."""

    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.js_files: List[Path] = []
        self.type_definitions: Dict[str, str] = {}
        self.ignored_dirs = {
            ".git",
            "__pycache__",
            "node_modules",
            "venv",
            "build",
            "dist",
        }

    def find_js_files(self) -> None:
        """Find all JavaScript files that need migration."""
        for path in self.root_dir.rglob("*.js"):
            path_str = str(path)
            if not any(
                ignored in path_str.split(os.sep) for ignored in self.ignored_dirs
            ):
                if "test" not in path_str and "config" not in path_str:
                    self.js_files.append(path)

    def analyze_file(self, file_path: Path) :
        """Analyze a JavaScript file for type information."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        analysis = {
            "functions": [],
            "classes": [],
            "variables": [],
            "imports": [],
            "exports": [],
        }

        # Extract function declarations
        func_pattern = r"(?:function|const)\s+(\w+)\s*\((.*?)\)"
        for match in re.finditer(func_pattern, content):
            func_name = match.group(1)
            params = match.group(2).split(",")
            analysis["functions"].append(
                {
                    "name": func_name,
                    "params": [p.strip() for p in params if p.strip()],
                    "return_type": "any",  # Default to any, will be refined later
                }
            )

        # Extract class declarations
        class_pattern = r"class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{"
        for match in re.finditer(class_pattern, content):
            class_name = match.group(1)
            parent_class = match.group(2)
            analysis["classes"].append(
                {"name": class_name, "extends": parent_class, "properties": []}
            )

        # Extract variable declarations
        var_pattern = r"(?:const|let|var)\s+(\w+)\s*="
        for match in re.finditer(var_pattern, content):
            var_name = match.group(1)
            analysis["variables"].append(
                {
                    "name": var_name,
                    "type": "any",
                }  # Default to any, will be refined later
            )

        # Extract imports
        import_pattern = r'import\s+.*?from\s+[\'"](.+?)[\'"]'
        for match in re.finditer(import_pattern, content):
            module = match.group(1)
            analysis["imports"].append(module)

        # Extract exports
        export_pattern = r"export\s+(?:default\s+)?(?:const|class|function)?\s*(\w+)"
        for match in re.finditer(export_pattern, content):
            export_name = match.group(1)
            analysis["exports"].append(export_name)

        return analysis

    def generate_types(self, analysis: Dict) -> Dict[str, str]:
        """Generate TypeScript type definitions from analysis."""
        types = {}

        # Generate function types
        for func in analysis["functions"]:
            param_types = [f"{p}: any" for p in func.get("params", [])]
            types[
                func["name"]
            ] = f"""
function {func['name']}({', '.join(param_types)}): {func['return_type']} {{
    // Implementation
}}"""

        # Generate class types
        for cls in analysis["classes"]:
            extends = f" extends {cls['extends']}" if cls["extends"] else ""
            types[
                cls["name"]
            ] = f"""
class {cls['name']}{extends} {{
    // Properties and methods
}}"""

        # Generate interface types for exports
        for export in analysis["exports"]:
            if export not in types:
                types[
                    export
                ] = f"""
interface {export} {{
    // Properties
}}"""

        return types

    def migrate_file(
        self, file_path: Path, analysis: Dict, types: Dict[str, str]
    ) :
        """Migrate a JavaScript file to TypeScript."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Add type imports
        type_imports = set()
        for module in analysis["imports"]:
            if module.startswith("."):
                type_imports.add(f"// TODO: Import types from {module}")

        # Add type annotations to functions
        for func in analysis["functions"]:
            old_sig = f"function {func['name']}({','.join(func['params'])})"
            new_sig = f"function {func['name']}({', '.join(f'{p}: any' for p in func['params'])}): {func['return_type']}"
            content = content.replace(old_sig, new_sig)

        # Add type annotations to variables
        for var in analysis["variables"]:
            old_decl = f"const {var['name']} ="
            new_decl = f"const {var['name']}: {var['type']} ="
            content = content.replace(old_decl, new_decl)

        # Add type definitions at the top
        type_definitions = "\n".join(types.values())

        # Combine everything
        ts_content = f"""// Generated type definitions
{type_definitions}

// Type imports
{chr(10).join(type_imports)}

{content}"""

        return ts_content

    def process_files(self) -> None:
        """Process all JavaScript files and migrate them to TypeScript."""
        self.find_js_files()

        for js_file in self.js_files:
            # Analyze the file
            analysis = self.analyze_file(js_file)

            # Generate type definitions
            types = self.generate_types(analysis)

            # Create TypeScript version
            ts_content = self.migrate_file(js_file, analysis, types)

            # Write the new TypeScript file
            ts_file = js_file.with_suffix(".ts")
            with open(ts_file, "w", encoding="utf-8") as f:
                f.write(ts_content)

            # Create backup of original JS file
            backup_dir = self.root_dir / "backups" / "js_migration"
            backup_dir.mkdir(parents=True, exist_ok=True)
            backup_file = backup_dir / js_file.name
            with open(backup_file, "w", encoding="utf-8") as f:
                with open(js_file, "r", encoding="utf-8") as src:
                    f.write(src.read())

            # Generate migration report
            report_dir = self.root_dir / "docs" / "migration"
            report_dir.mkdir(parents=True, exist_ok=True)

            report = {
                "original_file": str(js_file),
                "typescript_file": str(ts_file),
                "backup_file": str(backup_file),
                "analysis": analysis,
                "generated_types": types,
            }

            report_file = report_dir / f"{js_file.stem}_migration_report.json"
            with open(report_file, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)


if __name__ == "__main__":
    migrator = TypeScriptMigrator("src/dojopool")
    migrator.process_files()
