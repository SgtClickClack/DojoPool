"""Script to analyze and document React/TypeScript components."""

import json
import os
import re
from pathlib import Path
from typing import Dict, List


class FrontendAnalyzer:
    """Analyzes React/TypeScript components and generates documentation."""

    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.components: Dict[str, Dict] = {}
        self.styles: Dict[str, Dict] = {}
        self.utils: Dict[str, Dict] = {}
        self.ignored_dirs = {
            ".git",
            "__pycache__",
            "node_modules",
            "venv",
            "build",
            "dist",
        }

    def should_ignore(self, path: Path) -> bool:
        """Check if path should be ignored."""
        return any(ignored in str(path).split(os.sep) for ignored in self.ignored_dirs)

    def find_frontend_files(self) :
        """Find all frontend-related files."""
        files = {"components": [], "styles": [], "utils": []}

        for ext in [".tsx", ".jsx", ".ts", ".js"]:
            for path in self.root_dir.rglob(f"*{ext}"):
                if not self.should_ignore(path):
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                        if "React" in content or "Component" in content:
                            files["components"].append(path)
                        elif "export" in content and "function" in content:
                            files["utils"].append(path)

        for ext in [".scss", ".css"]:
            for path in self.root_dir.rglob(f"*{ext}"):
                if not self.should_ignore(path):
                    files["styles"].append(path)

        return files

    def extract_component_info(self, file_path: Path) -> Dict:
        """Extract information about a React component."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract component name
        component_name = file_path.stem

        # Extract props interface/type
        props_match = re.search(r"interface\s+(\w+Props)\s*{([^}]+)}", content)
        props = props_match.group(2).strip() if props_match else None

        # Extract state interface/type
        state_match = re.search(r"interface\s+(\w+State)\s*{([^}]+)}", content)
        state = state_match.group(2).strip() if state_match else None

        # Extract imports
        imports = []
        for line in content.split("\n"):
            if line.strip().startswith("import"):
                imports.append(line.strip())

        # Extract hooks usage
        hooks = []
        hook_patterns = [
            "useState",
            "useEffect",
            "useContext",
            "useRef",
            "useMemo",
            "useCallback",
        ]
        for hook in hook_patterns:
            if hook in content:
                hooks.append(hook)

        return {
            "name": component_name,
            "props": props,
            "state": state,
            "imports": imports,
            "hooks": hooks,
            "file_path": str(file_path.relative_to(self.root_dir)),
        }

    def analyze_style_file(self, file_path: Path) -> Dict:
        """Analyze a style file for classes and variables."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract CSS classes
        classes = re.findall(r"\.([a-zA-Z][a-zA-Z0-9_-]*)\s*{", content)

        # Extract CSS variables
        variables = re.findall(r"--([a-zA-Z][a-zA-Z0-9_-]*)\s*:", content)

        # Extract media queries
        media_queries = re.findall(r"@media[^{]+{", content)

        return {
            "name": file_path.stem,
            "classes": classes,
            "variables": variables,
            "media_queries": media_queries,
            "file_path": str(file_path.relative_to(self.root_dir)),
        }

    def analyze_utility_file(self, file_path: Path) -> Dict:
        """Analyze a utility file for exported functions and types."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract exported functions
        functions = re.findall(r"export\s+(?:function|const)\s+(\w+)", content)

        # Extract exported types/interfaces
        types = re.findall(r"export\s+(?:type|interface)\s+(\w+)", content)

        # Extract imports
        imports = []
        for line in content.split("\n"):
            if line.strip().startswith("import"):
                imports.append(line.strip())

        return {
            "name": file_path.stem,
            "functions": functions,
            "types": types,
            "imports": imports,
            "file_path": str(file_path.relative_to(self.root_dir)),
        }

    def generate_docs(self) -> None:
        """Generate documentation for frontend code."""
        files = self.find_frontend_files()

        # Analyze components
        for file_path in files["components"]:
            self.components[str(file_path)] = self.extract_component_info(file_path)

        # Analyze styles
        for file_path in files["styles"]:
            self.styles[str(file_path)] = self.analyze_style_file(file_path)

        # Analyze utilities
        for file_path in files["utils"]:
            self.utils[str(file_path)] = self.analyze_utility_file(file_path)

        # Generate markdown documentation
        docs_dir = self.root_dir / "docs" / "frontend"
        docs_dir.mkdir(parents=True, exist_ok=True)

        # Components documentation
        with open(docs_dir / "components.md", "w", encoding="utf-8") as f:
            f.write("# React Components Documentation\n\n")

            for _, component in self.components.items():
                f.write(f"## {component['name']}\n\n")
                f.write(f"**File:** `{component['file_path']}`\n\n")

                if component["props"]:
                    f.write("### Props\n\n```typescript\n")
                    f.write(component["props"])
                    f.write("\n```\n\n")

                if component["state"]:
                    f.write("### State\n\n```typescript\n")
                    f.write(component["state"])
                    f.write("\n```\n\n")

                if component["hooks"]:
                    f.write("### Hooks Used\n\n")
                    for hook in component["hooks"]:
                        f.write(f"- {hook}\n")
                    f.write("\n")

                if component["imports"]:
                    f.write("### Dependencies\n\n")
                    for imp in component["imports"]:
                        f.write(f"```typescript\n{imp}\n```\n")
                    f.write("\n")

                f.write("---\n\n")

        # Styles documentation
        with open(docs_dir / "styles.md", "w", encoding="utf-8") as f:
            f.write("# Styles Documentation\n\n")

            for _, style in self.styles.items():
                f.write(f"## {style['name']}\n\n")
                f.write(f"**File:** `{style['file_path']}`\n\n")

                if style["classes"]:
                    f.write("### CSS Classes\n\n")
                    for cls in style["classes"]:
                        f.write(f"- `.{cls}`\n")
                    f.write("\n")

                if style["variables"]:
                    f.write("### CSS Variables\n\n")
                    for var in style["variables"]:
                        f.write(f"- `--{var}`\n")
                    f.write("\n")

                if style["media_queries"]:
                    f.write("### Media Queries\n\n")
                    for query in style["media_queries"]:
                        f.write(f"```css\n{query}\n```\n")
                    f.write("\n")

                f.write("---\n\n")

        # Utilities documentation
        with open(docs_dir / "utilities.md", "w", encoding="utf-8") as f:
            f.write("# Utilities Documentation\n\n")

            for _, util in self.utils.items():
                f.write(f"## {util['name']}\n\n")
                f.write(f"**File:** `{util['file_path']}`\n\n")

                if util["functions"]:
                    f.write("### Exported Functions\n\n")
                    for func in util["functions"]:
                        f.write(f"- `{func}`\n")
                    f.write("\n")

                if util["types"]:
                    f.write("### Exported Types\n\n")
                    for typ in util["types"]:
                        f.write(f"- `{typ}`\n")
                    f.write("\n")

                if util["imports"]:
                    f.write("### Dependencies\n\n")
                    for imp in util["imports"]:
                        f.write(f"```typescript\n{imp}\n```\n")
                    f.write("\n")

                f.write("---\n\n")

        # Generate JSON data
        with open(docs_dir / "frontend_analysis.json", "w", encoding="utf-8") as f:
            json.dump(
                {
                    "components": self.components,
                    "styles": self.styles,
                    "utils": self.utils,
                },
                f,
                indent=2,
            )


if __name__ == "__main__":
    analyzer = FrontendAnalyzer("src/dojopool")
    analyzer.generate_docs()
