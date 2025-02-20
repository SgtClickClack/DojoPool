"""Script to analyze and optimize CSS/SCSS styles."""

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Set


@dataclass
class StyleRule:
    """Represents a CSS/SCSS style rule."""

    selector: str
    properties: Dict[str, str]
    media_query: Optional[str] = None
    source_file: Optional[str] = None
    line_number: Optional[int] = None


@dataclass
class StyleAnalysis:
    """Analysis results for a style file."""

    file_path: str
    rules_count: int
    unique_selectors: Set[str]
    media_queries: Set[str]
    variables: Dict[str, str]
    duplicate_rules: List[tuple[str, List[str]]]
    suggestions: List[str]


class StyleOptimizer:
    """Analyzes and optimizes CSS/SCSS styles."""

    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.style_files: Dict[str, StyleAnalysis] = {}
        self.all_rules: List[StyleRule] = []
        self.global_variables: Dict[str, Set[str]] = {}
        self.duplicate_selectors: Dict[str, List[str]] = {}
        self.ignored_dirs = {
            ".git",
            "__pycache__",
            "node_modules",
            "venv",
            "build",
            "dist",
        }

    def find_style_files(self) -> List[Path]:
        """Find all style files."""
        style_files = []
        for ext in [".scss", ".css"]:
            for path in self.root_dir.rglob(f"*{ext}"):
                if not any(
                    ignored in str(path).split(os.sep) for ignored in self.ignored_dirs
                ):
                    style_files.append(path)
        return style_files

    def parse_style_file(
        self, file_path: Path
    ) :
        """Parse a style file and extract rules."""
        rules: List[StyleRule] = []

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract variables
        variable_pattern = r"--([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*([^;]+);"
        variables = {
            name: value.strip() for name, value in re.findall(variable_pattern, content)
        }

        # Extract media queries and their content
        media_pattern = r"@media[^{]+{([^}]+)}"
        for media_match in re.finditer(media_pattern, content):
            media_query = media_match.group(0).split("{")[0].strip()
            media_content = media_match.group(1)

            # Extract rules within media query
            rule_pattern = r"([^{]+){([^}]+)}"
            for rule_match in re.finditer(rule_pattern, media_content):
                selector = rule_match.group(1).strip()
                properties_text = rule_match.group(2)

                # Parse properties
                properties = {}
                for prop in properties_text.split(";"):
                    if ":" in prop:
                        key, value = prop.split(":", 1)
                        properties[key.strip()] = value.strip()

                rules.append(
                    StyleRule(
                        selector=selector,
                        properties=properties,
                        media_query=media_query,
                        source_file=str(file_path),
                        line_number=content[: rule_match.start()].count("\n") + 1,
                    )
                )

        # Extract rules outside media queries
        content_without_media = re.sub(media_pattern, "", content)
        rule_pattern = r"([^{]+){([^}]+)}"

        for rule_match in re.finditer(rule_pattern, content_without_media):
            selector = rule_match.group(1).strip()
            properties_text = rule_match.group(2)

            # Parse properties
            properties = {}
            for prop in properties_text.split(";"):
                if ":" in prop:
                    key, value = prop.split(":", 1)
                    properties[key.strip()] = value.strip()

            rules.append(
                StyleRule(
                    selector=selector,
                    properties=properties,
                    source_file=str(file_path),
                    line_number=content[: rule_match.start()].count("\n") + 1,
                )
            )

        return rules, variables

    def analyze_file(self, file_path: Path) -> StyleAnalysis:
        """Analyze a single style file."""
        rules, variables = self.parse_style_file(file_path)

        # Collect unique selectors and media queries
        unique_selectors = {rule.selector for rule in rules}
        media_queries = {rule.media_query for rule in rules if rule.media_query}

        # Find duplicate rules
        selector_rules: Dict[str, List[StyleRule]] = {}
        for rule in rules:
            if rule.selector not in selector_rules:
                selector_rules[rule.selector] = []
            selector_rules[rule.selector].append(rule)

        duplicate_rules = []
        for selector, rules_list in selector_rules.items():
            if len(rules_list) > 1:
                duplicate_rules.append(
                    (
                        selector,
                        [
                            f"{rule.source_file}:{rule.line_number}"
                            for rule in rules_list
                        ],
                    )
                )

        # Generate suggestions
        suggestions = []
        if duplicate_rules:
            suggestions.append(f"Found {len(duplicate_rules)} duplicate selectors")
        if len(variables) < 5:
            suggestions.append("Consider using CSS variables for consistent values")
        if len(media_queries) > 3:
            suggestions.append("Consider consolidating media queries")

        return StyleAnalysis(
            file_path=str(file_path),
            rules_count=len(rules),
            unique_selectors=unique_selectors,
            media_queries=media_queries,
            variables=variables,
            duplicate_rules=duplicate_rules,
            suggestions=suggestions,
        )

    def find_global_duplicates(self) -> None:
        """Find duplicate selectors across all files."""
        selector_files: Dict[str, List[str]] = {}

        for file_path, analysis in self.style_files.items():
            for selector in analysis.unique_selectors:
                if selector not in selector_files:
                    selector_files[selector] = []
                selector_files[selector].append(file_path)

        self.duplicate_selectors = {
            selector: files
            for selector, files in selector_files.items()
            if len(files) > 1
        }

    def generate_report(self) -> None:
        """Generate optimization report."""
        report_dir = self.root_dir / "docs" / "optimization"
        report_dir.mkdir(parents=True, exist_ok=True)

        # Style analysis report
        with open(report_dir / "style_analysis.md", "w", encoding="utf-8") as f:
            f.write("# CSS/SCSS Style Analysis\n\n")

            for file_path, analysis in self.style_files.items():
                f.write(f"## {os.path.basename(file_path)}\n\n")
                f.write(f"**File:** `{analysis.file_path}`\n\n")

                f.write("**Statistics:**\n")
                f.write(f"- Total Rules: {analysis.rules_count}\n")
                f.write(f"- Unique Selectors: {len(analysis.unique_selectors)}\n")
                f.write(f"- Media Queries: {len(analysis.media_queries)}\n")
                f.write(f"- Variables Defined: {len(analysis.variables)}\n\n")

                if analysis.duplicate_rules:
                    f.write("**Duplicate Rules:**\n")
                    for selector, locations in analysis.duplicate_rules:
                        f.write(f"- `{selector}` defined in:\n")
                        for location in locations:
                            f.write(f"  - {location}\n")
                    f.write("\n")

                if analysis.suggestions:
                    f.write("**Optimization Suggestions:**\n")
                    for suggestion in analysis.suggestions:
                        f.write(f"- {suggestion}\n")
                    f.write("\n")

                f.write("---\n\n")

        # Global duplicates report
        with open(report_dir / "style_duplicates.md", "w", encoding="utf-8") as f:
            f.write("# Global Style Duplicates\n\n")

            for selector, files in self.duplicate_selectors.items():
                f.write(f"## Selector: `{selector}`\n\n")
                f.write("**Defined in files:**\n")
                for file_path in files:
                    f.write(f"- `{file_path}`\n")
                f.write("\n")

        # Generate optimization suggestions
        with open(report_dir / "style_optimization.md", "w", encoding="utf-8") as f:
            f.write("# Style Optimization Suggestions\n\n")

            # Suggest creating a variables file
            f.write("## 1. CSS Variables\n\n")
            f.write("Consider creating a `variables.scss` file with common values:\n\n")
            f.write("```scss\n:root {\n")
            for var_name, _ in self.global_variables.items():
                f.write(f"  --{var_name}: value;\n")
            f.write("}\n```\n\n")

            # Suggest media query consolidation
            f.write("## 2. Media Queries\n\n")
            f.write("Consider using mixins for common media queries:\n\n")
            f.write("```scss\n")
            f.write("@mixin mobile {\n")
            f.write("  @media (max-width: 768px) { @content; }\n")
            f.write("}\n\n")
            f.write("@mixin tablet {\n")
            f.write(
                "  @media (min-width: 769px) and (max-width: 1024px) { @content; }\n"
            )
            f.write("}\n```\n\n")

            # Suggest selector optimization
            if self.duplicate_selectors:
                f.write("## 3. Selector Optimization\n\n")
                f.write(
                    "Consider consolidating these duplicate selectors into shared style files:\n\n"
                )
                for selector, files in self.duplicate_selectors.items():
                    f.write(f"- `{selector}` (used in {len(files)} files)\n")

    def process_styles(self) -> None:
        """Process all style files and generate optimization report."""
        style_files = self.find_style_files()

        # Analyze each file
        for file_path in style_files:
            analysis = self.analyze_file(file_path)
            self.style_files[str(file_path)] = analysis

            # Collect global variables
            for var_name, var_value in analysis.variables.items():
                if var_name not in self.global_variables:
                    self.global_variables[var_name] = set()
                self.global_variables[var_name].add(var_value)

        # Find global duplicates
        self.find_global_duplicates()

        # Generate report
        self.generate_report()


if __name__ == "__main__":
    optimizer = StyleOptimizer("src/dojopool")
    optimizer.process_styles()
