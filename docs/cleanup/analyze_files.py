"""
File analysis script for DojoPool codebase cleanup.
This script systematically analyzes each file in the inventory,
updating the inventory with findings and generating reports.
"""

import difflib
import json
import re
from datetime import datetime
from pathlib import Path


class FileAnalyzer:
    def __init__(self, inventory_path):
        self.inventory_path = Path(inventory_path)
        with open(inventory_path, "r", encoding="utf-8") as f:
            self.inventory = json.load(f)

        self.analysis_results = {
            "started_at": datetime.now().isoformat(),
            "files_analyzed": 0,
            "issues_found": 0,
            "potential_duplicates": [],
            "dependency_graph": {},
            "issues_by_type": {},
        }

    def analyze_file(self, file_info):
        """Analyze a single file for issues and patterns."""
        file_path = Path(file_info["path"])

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            # Skip binary files
            return {
                "analyzed": True,
                "has_issues": False,
                "issues": ["Binary file - skipped analysis"],
                "status": "analyzed",
            }

        issues = []

        # Check file size
        if file_info["size"] > 1000000:  # 1MB
            issues.append("Large file size (>1MB)")

        # Check for potential security issues
        security_patterns = {
            "api_key": r"api[_-]key.*=.*['\"][\w\-]+['\"]",
            "password": r"password.*=.*['\"][\w\-]+['\"]",
            "secret": r"secret.*=.*['\"][\w\-]+['\"]",
        }

        for issue_type, pattern in security_patterns.items():
            if re.search(pattern, content, re.IGNORECASE):
                issues.append(f"Potential security issue: {issue_type}")

        # Check for TODO comments
        todos = re.findall(r"(?i)#?\s*todo:?\s*(.+)$", content, re.MULTILINE)
        if todos:
            issues.extend([f"TODO found: {todo.strip()}" for todo in todos])

        # Check for long lines
        long_lines = [
            i + 1 for i, line in enumerate(content.splitlines()) if len(line) > 100
        ]
        if long_lines:
            issues.append(f"Long lines found on lines: {long_lines}")

        # Find imports and dependencies
        dependencies = []
        if file_path.suffix in [".py", ".js", ".jsx", ".ts", ".tsx"]:
            # Python imports
            python_imports = re.findall(
                r"(?:from|import)\s+([\w.]+)(?:\s+import\s+[\w,\s]+)?", content
            )
            # JavaScript/TypeScript imports
            js_imports = re.findall(
                r'(?:import|require)\s*\(?\s*[\'"]([^\'\"]+)[\'\"]', content
            )
            dependencies.extend(python_imports + js_imports)

        return {
            "analyzed": True,
            "has_issues": bool(issues),
            "issues": issues,
            "dependencies": dependencies,
            "status": "has_issues" if issues else "analyzed",
        }

    def find_similar_files(self):
        """Find potentially duplicate or similar files."""
        files_by_size = {}

        # Group files by size first
        for file_info in self.inventory["files"]:
            size = file_info["size"]
            if size in files_by_size:
                files_by_size[size].append(file_info)
            else:
                files_by_size[size] = [file_info]

        # Compare files of similar size
        for size, files in files_by_size.items():
            if len(files) > 1:
                for i, file1 in enumerate(files):
                    for file2 in files[i + 1 :]:
                        if file1["hash"] == file2["hash"]:
                            self.analysis_results["potential_duplicates"].append(
                                {
                                    "file1": file1["path"],
                                    "file2": file2["path"],
                                    "match_type": "identical",
                                    "similarity": 1.0,
                                }
                            )
                        else:
                            # Compare content for similarity
                            try:
                                with (
                                    open(file1["path"], "r") as f1,
                                    open(file2["path"], "r") as f2,
                                ):
                                    similarity = difflib.SequenceMatcher(
                                        None, f1.read(), f2.read()
                                    ).ratio()
                                    if similarity > 0.8:  # 80% similar
                                        self.analysis_results[
                                            "potential_duplicates"
                                        ].append(
                                            {
                                                "file1": file1["path"],
                                                "file2": file2["path"],
                                                "match_type": "similar",
                                                "similarity": similarity,
                                            }
                                        )
                            except UnicodeDecodeError:
                                # Skip binary files
                                continue

    def analyze_all(self):
        """Analyze all files in the inventory."""
        for file_info in self.inventory["files"]:
            if not file_info["analyzed"]:
                results = self.analyze_file(file_info)
                file_info.update(results)

                self.analysis_results["files_analyzed"] += 1
                if results["has_issues"]:
                    self.analysis_results["issues_found"] += len(results["issues"])

                    # Group issues by type
                    for issue in results["issues"]:
                        issue_type = issue.split(":")[0]
                        if issue_type not in self.analysis_results["issues_by_type"]:
                            self.analysis_results["issues_by_type"][issue_type] = []
                        self.analysis_results["issues_by_type"][issue_type].append(
                            {"file": file_info["path"], "issue": issue}
                        )

        # Find similar files
        self.find_similar_files()

        # Save updated inventory
        with open(self.inventory_path, "w", encoding="utf-8") as f:
            json.dump(self.inventory, f, indent=2)

        # Generate analysis report
        self.generate_report()

    def generate_report(self):
        """Generate a markdown report of the analysis."""
        report = f"""# File Analysis Report
Generated at: {self.analysis_results['started_at']}

## Summary
- Files Analyzed: {self.analysis_results['files_analyzed']}
- Issues Found: {self.analysis_results['issues_found']}
- Potential Duplicates: {len(self.analysis_results['potential_duplicates'])}

## Issues by Type
"""

        for issue_type, issues in self.analysis_results["issues_by_type"].items():
            report += f"\n### {issue_type}\n"
            for issue in issues:
                report += f"- {issue['file']}: {issue['issue']}\n"

        report += "\n## Potential Duplicate Files\n"
        for dup in self.analysis_results["potential_duplicates"]:
            report += f"- {dup['file1']} ↔ {dup['file2']}\n"
            report += f"  - Match Type: {dup['match_type']}\n"
            report += f"  - Similarity: {dup['similarity']:.2%}\n"

        report_file = self.inventory_path.parent / "analysis_report.md"
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(report)


def main():
    """Main function to run the analysis."""
    inventory_path = Path(__file__).parent / "file_inventory.json"
    if not inventory_path.exists():
        print("Please run file_inventory.py first to generate the inventory.")
        return

    analyzer = FileAnalyzer(inventory_path)
    analyzer.analyze_all()


if __name__ == "__main__":
    main()
