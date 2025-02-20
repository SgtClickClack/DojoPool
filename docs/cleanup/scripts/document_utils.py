"""Generate detailed documentation for utility files with high import counts."""

import ast
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class FunctionInfo:
    name: str
    docstring: Optional[str]
    params: List[str]
    return_type: Optional[str]
    decorators: List[str]
    line_count: int
    complexity: int


@dataclass
class ClassInfo:
    name: str
    docstring: Optional[str]
    methods: List[FunctionInfo]
    base_classes: List[str]
    decorators: List[str]
    line_count: int


class UtilityAnalyzer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.target_files = [
            "src/dojopool/core/realtime/room_logging.py",
            "src/dojopool/core/db_optimization.py",
            "src/dojopool/core/logging/utils.py",
        ]
        self.docs_dir = self.root_dir / "docs" / "cleanup" / "utils_documentation"
        self.docs_dir.mkdir(parents=True, exist_ok=True)

    def calculate_complexity(self, node: ast.AST) -> int:
        """Calculate cyclomatic complexity of an AST node."""
        complexity = 1
        for child in ast.walk(node):
            if isinstance(
                child,
                (
                    ast.If,
                    ast.While,
                    ast.For,
                    ast.Try,
                    ast.ExceptHandler,
                    ast.With,
                    ast.Assert,
                    ast.Raise,
                    ast.Return,
                ),
            ):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        return complexity

    def get_decorators(self, node: ast.AST) -> List[str]:
        """Extract decorator names from an AST node."""
        decorators = []
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Name):
                    decorators.append(decorator.id)
                elif isinstance(decorator, ast.Call):
                    if isinstance(decorator.func, ast.Name):
                        decorators.append(decorator.func.id)
        return decorators

    def analyze_function(self, node: ast.FunctionDef) :
        """Analyze a function node and return its information."""
        docstring = ast.get_docstring(node)
        params = [arg.arg for arg in node.args.args]

        # Try to get return type from type annotation
        return_type = None
        if node.returns:
            if isinstance(node.returns, ast.Name):
                return_type = node.returns.id
            elif isinstance(node.returns, ast.Constant):
                return_type = str(node.returns.value)

        # Get line numbers safely
        start_line = getattr(node, "lineno", 0)
        end_line = getattr(node, "end_lineno", start_line)
        line_count = max(1, end_line - start_line + 1)

        return FunctionInfo(
            name=node.name,
            docstring=docstring,
            params=params,
            return_type=return_type,
            decorators=self.get_decorators(node),
            line_count=line_count,
            complexity=self.calculate_complexity(node),
        )

    def analyze_class(self, node: ast.ClassDef) -> ClassInfo:
        """Analyze a class node and return its information."""
        docstring = ast.get_docstring(node)
        methods = []
        for child in node.body:
            if isinstance(child, ast.FunctionDef):
                methods.append(self.analyze_function(child))

        base_classes = []
        for base in node.bases:
            if isinstance(base, ast.Name):
                base_classes.append(base.id)

        # Get line numbers safely
        start_line = getattr(node, "lineno", 0)
        end_line = getattr(node, "end_lineno", start_line)
        line_count = max(1, end_line - start_line + 1)

        return ClassInfo(
            name=node.name,
            docstring=docstring,
            methods=methods,
            base_classes=base_classes,
            decorators=self.get_decorators(node),
            line_count=line_count,
        )

    def analyze_file(self, file_path: Path) -> Dict:
        """Analyze a Python file and return its structure."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        tree = ast.parse(content)
        imports = []
        functions = []
        classes = []

        # First get all module-level nodes
        module_nodes = tree.body

        # Process module-level nodes
        for node in module_nodes:
            if isinstance(node, ast.Import):
                for name in node.names:
                    imports.append(name.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for name in node.names:
                    imports.append(f"{module}.{name.name}")
            elif isinstance(node, ast.FunctionDef):
                functions.append(self.analyze_function(node))
            elif isinstance(node, ast.ClassDef):
                classes.append(self.analyze_class(node))

        return {
            "file_path": str(file_path.relative_to(self.root_dir)),
            "imports": imports,
            "functions": functions,
            "classes": classes,
        }

    def generate_markdown(self, analysis: Dict) -> str:
        """Generate markdown documentation from analysis results."""
        md = [f"# Utility File Documentation: {analysis['file_path']}\n"]
        md.append(f"Generated at: {datetime.now().isoformat()}\n")

        md.append("## Overview\n")
        md.append(f"- Functions: {len(analysis['functions'])}")
        md.append(f"- Classes: {len(analysis['classes'])}")
        md.append(f"- Imports: {len(analysis['imports'])}\n")

        if analysis["imports"]:
            md.append("## Imports\n")
            for imp in sorted(analysis["imports"]):
                md.append(f"- `{imp}`")
            md.append("")

        if analysis["functions"]:
            md.append("## Functions\n")
            for func in analysis["functions"]:
                md.append(f"### `{func.name}`\n")
                if func.docstring:
                    md.append(f"{func.docstring}\n")
                md.append("**Details:**")
                md.append(f"- Parameters: {', '.join(func.params)}")
                if func.return_type:
                    md.append(f"- Returns: {func.return_type}")
                md.append(f"- Complexity: {func.complexity}")
                md.append(f"- Lines: {func.line_count}")
                if func.decorators:
                    md.append(f"- Decorators: {', '.join(func.decorators)}")
                md.append("")

        if analysis["classes"]:
            md.append("## Classes\n")
            for cls in analysis["classes"]:
                md.append(f"### `{cls.name}`\n")
                if cls.docstring:
                    md.append(f"{cls.docstring}\n")
                if cls.base_classes:
                    md.append(f"Inherits from: {', '.join(cls.base_classes)}\n")
                md.append("**Methods:**\n")
                for method in cls.methods:
                    md.append(f"#### `{method.name}`\n")
                    if method.docstring:
                        md.append(f"{method.docstring}\n")
                    md.append("**Details:**")
                    md.append(f"- Parameters: {', '.join(method.params)}")
                    if method.return_type:
                        md.append(f"- Returns: {method.return_type}")
                    md.append(f"- Complexity: {method.complexity}")
                    md.append(f"- Lines: {method.line_count}")
                    if method.decorators:
                        md.append(f"- Decorators: {', '.join(method.decorators)}")
                    md.append("")

        md.append("## Recommendations\n")
        recommendations = []

        # Add recommendations based on analysis
        for func in analysis["functions"]:
            if func.complexity > 10:
                recommendations.append(
                    f"- Consider splitting complex function `{func.name}` (complexity: {func.complexity})"
                )
            if func.line_count > 50:
                recommendations.append(
                    f"- Consider breaking down large function `{func.name}` ({func.line_count} lines)"
                )
            if not func.docstring:
                recommendations.append(
                    f"- Add documentation for function `{func.name}`"
                )

        for cls in analysis["classes"]:
            if not cls.docstring:
                recommendations.append(f"- Add documentation for class `{cls.name}`")
            for method in cls.methods:
                if method.complexity > 10:
                    recommendations.append(
                        f"- Consider splitting complex method `{cls.name}.{method.name}` (complexity: {method.complexity})"
                    )
                if method.line_count > 50:
                    recommendations.append(
                        f"- Consider breaking down large method `{cls.name}.{method.name}` ({method.line_count} lines)"
                    )
                if not method.docstring:
                    recommendations.append(
                        f"- Add documentation for method `{cls.name}.{method.name}`"
                    )

        if len(analysis["imports"]) > 20:
            recommendations.append("- Consider organizing imports into logical groups")
            recommendations.append("- Check for unused imports")

        if recommendations:
            md.extend(recommendations)
        else:
            md.append("- No immediate improvements needed")

        return "\n".join(md)

    def analyze_all(self):
        """Analyze all target utility files and generate documentation."""
        print("Analyzing utility files...")
        for file_path in self.target_files:
            full_path = self.root_dir / file_path
            if not full_path.exists():
                print(f"Warning: File not found: {file_path}")
                continue

            print(f"Analyzing {file_path}...")
            analysis = self.analyze_file(full_path)

            # Generate markdown documentation
            markdown = self.generate_markdown(analysis)
            doc_path = self.docs_dir / f"{full_path.stem}_documentation.md"
            with open(doc_path, "w") as f:
                f.write(markdown)

            print(f"Documentation generated: {doc_path}")


def main():
    """Main function to run the utility analysis."""
    root_dir = str(Path.cwd())
    analyzer = UtilityAnalyzer(root_dir)
    analyzer.analyze_all()
    print(
        "Analysis complete. Check docs/cleanup/utils_documentation/ for detailed documentation."
    )


if __name__ == "__main__":
    main()
