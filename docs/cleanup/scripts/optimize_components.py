"""Script to analyze and optimize React components."""

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List


@dataclass
class ComponentAnalysis:
    """Analysis results for a React component."""

    name: str
    file_path: str
    props_count: int
    state_count: int
    effect_count: int
    render_complexity: int
    dependencies: List[str]
    patterns: List[str]
    suggestions: List[str]


class ComponentOptimizer:
    """Analyzes and optimizes React components."""

    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.components: Dict[str, ComponentAnalysis] = {}
        self.common_patterns: Dict[str, List[str]] = {}
        self.optimization_suggestions: Dict[str, List[str]] = {}
        self.ignored_dirs = {
            ".git",
            "__pycache__",
            "node_modules",
            "venv",
            "build",
            "dist",
        }

    def find_component_files(self) -> List[Path]:
        """Find all React component files."""
        component_files = []
        for ext in [".tsx", ".jsx"]:
            for path in self.root_dir.rglob(f"*{ext}"):
                if not any(
                    ignored in str(path).split(os.sep) for ignored in self.ignored_dirs
                ):
                    component_files.append(path)
        return component_files

    def analyze_component(self, file_path: Path) :
        """Analyze a single React component."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract component name
        name = file_path.stem

        # Count props
        props_count = len(re.findall(r"interface\s+\w+Props|type\s+\w+Props", content))

        # Count state hooks
        state_count = len(re.findall(r"useState[<(]", content))

        # Count effect hooks
        effect_count = len(re.findall(r"useEffect\(", content))

        # Calculate render complexity (number of JSX elements)
        render_complexity = len(re.findall(r"<[A-Z]\w+", content))

        # Extract dependencies
        dependencies = []
        for line in content.split("\n"):
            if line.strip().startswith("import"):
                dependencies.append(line.strip())

        # Identify patterns
        patterns = []
        if "useState" in content and "useEffect" in content:
            patterns.append("state-effect-pattern")
        if "useMemo" in content or "useCallback" in content:
            patterns.append("memoization-pattern")
        if "children" in content:
            patterns.append("composition-pattern")
        if re.search(r"<\w+\s+{\.\.\.props}", content):
            patterns.append("props-spreading")

        # Generate suggestions
        suggestions = []
        if state_count > 3:
            suggestions.append("Consider using useReducer for complex state")
        if effect_count > 2:
            suggestions.append("Consider consolidating effects")
        if render_complexity > 20:
            suggestions.append("Consider splitting into smaller components")
        if "props-spreading" in patterns:
            suggestions.append(
                "Consider explicit prop passing for better maintainability"
            )

        return ComponentAnalysis(
            name=name,
            file_path=str(file_path),
            props_count=props_count,
            state_count=state_count,
            effect_count=effect_count,
            render_complexity=render_complexity,
            dependencies=dependencies,
            patterns=patterns,
            suggestions=suggestions,
        )

    def find_common_patterns(self) -> None:
        """Identify common patterns across components."""
        pattern_components: Dict[str, List[str]] = {}

        for name, analysis in self.components.items():
            for pattern in analysis.patterns:
                if pattern not in pattern_components:
                    pattern_components[pattern] = []
                pattern_components[pattern].append(name)

        self.common_patterns = pattern_components

    def generate_optimization_suggestions(self) :
        """Generate optimization suggestions based on analysis."""
        # Group similar components
        similar_components: Dict[str, List[str]] = {}

        for name, analysis in self.components.items():
            key = f"{len(analysis.patterns)}_{analysis.render_complexity}"
            if key not in similar_components:
                similar_components[key] = []
            similar_components[key].append(name)

        # Generate suggestions for similar components
        for key, components in similar_components.items():
            if len(components) > 1:
                self.optimization_suggestions[key] = [
                    f"Consider creating a shared base component for: {', '.join(components)}",
                    "Extract common logic into custom hooks",
                    "Implement consistent prop interfaces",
                ]

    def generate_report(self) -> None:
        """Generate optimization report."""
        report_dir = self.root_dir / "docs" / "optimization"
        report_dir.mkdir(parents=True, exist_ok=True)

        # Component analysis report
        with open(report_dir / "component_analysis.md", "w", encoding="utf-8") as f:
            f.write("# React Component Analysis\n\n")

            for name, analysis in self.components.items():
                f.write(f"## {name}\n\n")
                f.write(f"**File:** `{analysis.file_path}`\n\n")
                f.write("**Complexity Metrics:**\n")
                f.write(f"- Props Count: {analysis.props_count}\n")
                f.write(f"- State Hooks: {analysis.state_count}\n")
                f.write(f"- Effect Hooks: {analysis.effect_count}\n")
                f.write(f"- Render Complexity: {analysis.render_complexity}\n\n")

                if analysis.patterns:
                    f.write("**Patterns Used:**\n")
                    for pattern in analysis.patterns:
                        f.write(f"- {pattern}\n")
                    f.write("\n")

                if analysis.suggestions:
                    f.write("**Optimization Suggestions:**\n")
                    for suggestion in analysis.suggestions:
                        f.write(f"- {suggestion}\n")
                    f.write("\n")

                f.write("---\n\n")

        # Common patterns report
        with open(report_dir / "common_patterns.md", "w", encoding="utf-8") as f:
            f.write("# Common React Patterns\n\n")

            for pattern, components in self.common_patterns.items():
                f.write(f"## {pattern}\n\n")
                f.write("**Used in components:**\n")
                for component in components:
                    f.write(f"- {component}\n")
                f.write("\n")

        # Optimization suggestions report
        with open(
            report_dir / "optimization_suggestions.md", "w", encoding="utf-8"
        ) as f:
            f.write("# Component Optimization Suggestions\n\n")

            for key, suggestions in self.optimization_suggestions.items():
                f.write(f"## Component Group {key}\n\n")
                for suggestion in suggestions:
                    f.write(f"- {suggestion}\n")
                f.write("\n")

    def process_components(self) -> None:
        """Process all components and generate optimization report."""
        component_files = self.find_component_files()

        # Analyze each component
        for file_path in component_files:
            analysis = self.analyze_component(file_path)
            self.components[analysis.name] = analysis

        # Find common patterns
        self.find_common_patterns()

        # Generate optimization suggestions
        self.generate_optimization_suggestions()

        # Generate report
        self.generate_report()


if __name__ == "__main__":
    optimizer = ComponentOptimizer("src/dojopool")
    optimizer.process_components()
