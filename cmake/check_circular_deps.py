#!/usr/bin/env python3
"""
Circular Dependency Checker for DojoPool

This script analyzes C++ header files to detect circular dependencies
in the include graph.
"""

import os
import re
import sys
from collections import defaultdict, deque
from typing import Dict, List, Set, Tuple


class CircularDependencyChecker:
    def __init__(self, source_dirs: List[str]):
        self.source_dirs = source_dirs
        self.include_graph: Dict[str, List[str]] = defaultdict(list)
        self.file_to_module: Dict[str, str] = {}
        self.header_files: Set[str] = set()

    def find_header_files(self) -> None:
        """Find all header files in the source directories."""
        for source_dir in self.source_dirs:
            if not os.path.exists(source_dir):
                continue

            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    if file.endswith(('.hpp', '.hxx', '.h')):
                        full_path = os.path.join(root, file)
                        self.header_files.add(full_path)

                        # Map file to module
                        rel_path = os.path.relpath(full_path, source_dir)
                        module = rel_path.split(os.sep)[0] if os.sep in rel_path else 'root'
                        self.file_to_module[full_path] = module

    def parse_includes(self, file_path: str) -> List[str]:
        """Parse include directives from a header file."""
        includes = []
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Find all #include directives
            include_pattern = r'#include\s*["<]([^">]+)[">]'
            matches = re.findall(include_pattern, content)

            for include in matches:
                # Resolve relative includes
                if include.startswith('.'):
                    dir_path = os.path.dirname(file_path)
                    resolved = os.path.normpath(os.path.join(dir_path, include))
                else:
                    # Look for the header in all source directories
                    resolved = None
                    for source_dir in self.source_dirs:
                        candidate = os.path.join(source_dir, include)
                        if os.path.exists(candidate):
                            resolved = candidate
                            break

                if resolved and resolved in self.header_files:
                    includes.append(resolved)

        except (IOError, OSError) as e:
            print(f"Warning: Could not read {file_path}: {e}", file=sys.stderr)

        return includes

    def build_dependency_graph(self) -> None:
        """Build the include dependency graph."""
        for header_file in self.header_files:
            includes = self.parse_includes(header_file)
            self.include_graph[header_file] = includes

    def detect_cycles(self) -> List[List[str]]:
        """Detect circular dependencies using DFS."""
        cycles = []
        visited = set()
        rec_stack = set()
        path = []

        def dfs(node: str) -> None:
            visited.add(node)
            rec_stack.add(node)
            path.append(node)

            for neighbor in self.include_graph[node]:
                if neighbor not in visited:
                    dfs(neighbor)
                elif neighbor in rec_stack:
                    # Found a cycle
                    cycle_start = path.index(neighbor)
                    cycle = path[cycle_start:] + [neighbor]
                    cycles.append(cycle)

            path.pop()
            rec_stack.remove(node)

        for node in self.include_graph:
            if node not in visited:
                dfs(node)

        return cycles

    def analyze_module_dependencies(self) -> Dict[str, Set[str]]:
        """Analyze dependencies between modules."""
        module_deps: Dict[str, Set[str]] = defaultdict(set)

        for file, includes in self.include_graph.items():
            module = self.file_to_module[file]
            for include in includes:
                include_module = self.file_to_module[include]
                if module != include_module:
                    module_deps[module].add(include_module)

        return module_deps

    def check_module_cycles(self) -> List[List[str]]:
        """Check for circular dependencies between modules."""
        module_deps = self.analyze_module_dependencies()
        cycles = []

        def dfs_module(module: str, visited: Set[str], path: List[str]) -> None:
            if module in path:
                cycle_start = path.index(module)
                cycles.append(path[cycle_start:] + [module])
                return

            if module in visited:
                return

            visited.add(module)
            path.append(module)

            for dep in module_deps[module]:
                dfs_module(dep, visited, path)

            path.pop()

        visited = set()
        for module in module_deps:
            if module not in visited:
                dfs_module(module, visited, [])

        return cycles

    def report_cycles(self, cycles: List[List[str]], title: str) -> None:
        """Report detected cycles."""
        if not cycles:
            print(f"✅ No circular dependencies found in {title}")
            return

        print(f"❌ Found {len(cycles)} circular dependencies in {title}:")
        for i, cycle in enumerate(cycles, 1):
            print(f"  {i}. {' -> '.join([os.path.basename(f) for f in cycle])}")
            for file in cycle:
                module = self.file_to_module.get(file, 'unknown')
                print(f"     - {os.path.relpath(file)} (module: {module})")
        print()


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python check_circular_deps.py <source_dir> [source_dir...]", file=sys.stderr)
        sys.exit(1)

    source_dirs = sys.argv[1:]

    checker = CircularDependencyChecker(source_dirs)
    print("🔍 Analyzing circular dependencies...")

    # Find header files
    checker.find_header_files()
    print(f"📁 Found {len(checker.header_files)} header files")

    # Build dependency graph
    checker.build_dependency_graph()

    # Check for file-level cycles
    file_cycles = checker.detect_cycles()
    checker.report_cycles(file_cycles, "file includes")

    # Check for module-level cycles
    module_cycles = checker.check_module_cycles()
    if module_cycles:
        print("❌ Found circular dependencies between modules:")
        for i, cycle in enumerate(module_cycles, 1):
            print(f"  {i}. {' -> '.join(cycle)}")
    else:
        print("✅ No circular dependencies found between modules")

    # Exit with error if cycles found
    if file_cycles or module_cycles:
        sys.exit(1)

    print("🎉 All checks passed!")


if __name__ == "__main__":
    main()
