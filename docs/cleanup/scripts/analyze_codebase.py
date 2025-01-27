"""Analyze the codebase structure and generate a comprehensive inventory."""

import os
import json
from pathlib import Path
from typing import Dict, List, Set, Any
from dataclasses import dataclass, asdict
import re
from datetime import datetime

@dataclass
class FileInfo:
    path: str
    size: int
    extension: str
    last_modified: str
    imports: List[str]
    exports: List[str]
    dependencies: List[str]

class CodebaseAnalyzer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.ignored_dirs = {'.git', '__pycache__', 'node_modules', 'venv', '.venv', 'build', 'dist', '.pytest_cache'}
        self.file_inventory: Dict[str, FileInfo] = {}
        self.component_relationships: Dict[str, Set[str]] = {}
        
    def should_ignore(self, path: Path) -> bool:
        """Check if a path should be ignored."""
        return any(ignored in path.parts for ignored in self.ignored_dirs)
    
    def analyze_imports(self, content: str, file_ext: str) -> List[str]:
        """Extract imports from file content based on file type."""
        imports = []
        if file_ext in {'.ts', '.tsx', '.js', '.jsx'}:
            # Match ES6 imports and requires
            import_patterns = [
                r'import\s+.*?from\s+[\'"]([^\'"]+)[\'"]',
                r'require\([\'"]([^\'"]+)[\'"]\)'
            ]
            for pattern in import_patterns:
                imports.extend(re.findall(pattern, content))
        elif file_ext == '.py':
            # Match Python imports
            import_patterns = [
                r'from\s+(\S+)\s+import',
                r'import\s+(\S+)'
            ]
            for pattern in import_patterns:
                imports.extend(re.findall(pattern, content))
        return imports

    def analyze_exports(self, content: str, file_ext: str) -> List[str]:
        """Extract exports from file content based on file type."""
        exports = []
        if file_ext in {'.ts', '.tsx', '.js', '.jsx'}:
            # Match ES6 exports
            export_patterns = [
                r'export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)',
                r'export\s+{\s*(.+?)\s*}'
            ]
            for pattern in export_patterns:
                exports.extend(re.findall(pattern, content))
        elif file_ext == '.py':
            # Match Python exports (names that might be imported)
            export_pattern = r'(?:class|def)\s+([A-Z]\w*)'
            exports.extend(re.findall(export_pattern, content))
        return exports

    def analyze_file(self, file_path: Path) -> FileInfo:
        """Analyze a single file and return its information."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            return FileInfo(
                path=str(file_path.relative_to(self.root_dir)),
                size=file_path.stat().st_size,
                extension=file_path.suffix,
                last_modified=datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                imports=[],
                exports=[],
                dependencies=[]
            )

        return FileInfo(
            path=str(file_path.relative_to(self.root_dir)),
            size=file_path.stat().st_size,
            extension=file_path.suffix,
            last_modified=datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
            imports=self.analyze_imports(content, file_path.suffix),
            exports=self.analyze_exports(content, file_path.suffix),
            dependencies=[]
        )

    def analyze_codebase(self):
        """Analyze the entire codebase and generate inventory."""
        for root, dirs, files in os.walk(self.root_dir):
            # Remove ignored directories
            dirs[:] = [d for d in dirs if d not in self.ignored_dirs]
            
            path = Path(root)
            if self.should_ignore(path):
                continue

            for file in files:
                file_path = path / file
                if file_path.suffix in {'.ts', '.tsx', '.js', '.jsx', '.py', '.html', '.css', '.scss', '.json', '.md'}:
                    file_info = self.analyze_file(file_path)
                    self.file_inventory[file_info.path] = file_info

        # Analyze dependencies between files
        self.analyze_dependencies()

    def analyze_dependencies(self):
        """Analyze dependencies between files."""
        for file_path, file_info in self.file_inventory.items():
            dependencies = set()
            for imp in file_info.imports:
                # Try to match the import to a file in the inventory
                for other_path in self.file_inventory.keys():
                    if imp in other_path:
                        dependencies.add(other_path)
            self.file_inventory[file_path].dependencies = list(dependencies)

    def generate_report(self):
        """Generate a detailed report of the codebase analysis."""
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_files': len(self.file_inventory),
            'file_types': {},
            'files': {path: asdict(info) for path, info in self.file_inventory.items()},
            'statistics': self.generate_statistics()
        }

        # Count file types
        for file_info in self.file_inventory.values():
            ext = file_info.extension
            if ext not in report['file_types']:
                report['file_types'][ext] = 0
            report['file_types'][ext] += 1

        # Save detailed JSON report
        report_path = self.root_dir / 'docs' / 'cleanup' / 'codebase_analysis.json'
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        # Generate markdown summary
        self.generate_markdown_summary(report)

    def generate_statistics(self) -> Dict[str, Any]:
        """Generate statistics about the codebase."""
        stats = {
            'total_size': sum(info.size for info in self.file_inventory.values()),
            'avg_file_size': sum(info.size for info in self.file_inventory.values()) / len(self.file_inventory) if self.file_inventory else 0,
            'files_by_type': {},
            'most_imported_files': [],
            'most_dependent_files': []
        }

        # Count files by type
        for info in self.file_inventory.values():
            if info.extension not in stats['files_by_type']:
                stats['files_by_type'][info.extension] = 0
            stats['files_by_type'][info.extension] += 1

        # Find most imported files
        import_counts = {}
        for info in self.file_inventory.values():
            for dep in info.dependencies:
                if dep not in import_counts:
                    import_counts[dep] = 0
                import_counts[dep] += 1

        stats['most_imported_files'] = sorted(
            import_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        return stats

    def generate_markdown_summary(self, report: Dict[str, Any]):
        """Generate a markdown summary of the analysis."""
        summary_path = self.root_dir / 'docs' / 'cleanup' / 'codebase_analysis.md'
        
        with open(summary_path, 'w') as f:
            f.write('# Codebase Analysis Summary\n\n')
            f.write(f"Generated at: {report['timestamp']}\n\n")

            f.write('## Overview\n')
            f.write(f"- Total Files: {report['total_files']}\n")
            f.write(f"- Total Size: {report['statistics']['total_size'] / 1024:.2f} KB\n")
            f.write(f"- Average File Size: {report['statistics']['avg_file_size'] / 1024:.2f} KB\n\n")

            f.write('## File Types\n')
            for ext, count in report['file_types'].items():
                f.write(f"- {ext}: {count} files\n")
            f.write('\n')

            f.write('## Most Imported Files\n')
            for file, count in report['statistics']['most_imported_files']:
                f.write(f"- {file}: {count} imports\n")
            f.write('\n')

            f.write('## Next Steps\n')
            f.write('1. Review large files for potential splitting\n')
            f.write('2. Analyze heavily imported files for optimization\n')
            f.write('3. Check for duplicate functionality\n')
            f.write('4. Update documentation where needed\n')

def main():
    """Main function to run the codebase analysis."""
    root_dir = str(Path.cwd())
    analyzer = CodebaseAnalyzer(root_dir)
    print("Analyzing codebase...")
    analyzer.analyze_codebase()
    print("Generating report...")
    analyzer.generate_report()
    print("Analysis complete. Check docs/cleanup/codebase_analysis.md for summary.")

if __name__ == '__main__':
    main() 