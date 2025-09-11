#!/usr/bin/env python3
"""
IWYU Runner for DojoPool

This script runs Include-What-You-Use analysis on all C++ source files
and generates a report of suggested header optimizations.
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple


class IWYUAnalyzer:
    def __init__(self, source_dirs: List[str], build_dir: str):
        self.source_dirs = source_dirs
        self.build_dir = build_dir
        self.iwyu_exe = self.find_iwyu()
        self.compile_commands = os.path.join(build_dir, "compile_commands.json")

    def find_iwyu(self) -> str:
        """Find the IWYU executable."""
        candidates = ["include-what-you-use", "iwyu"]
        for candidate in candidates:
            try:
                result = subprocess.run([candidate, "--version"],
                                      capture_output=True, text=True, check=True)
                return candidate
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue

        raise FileNotFoundError("Include-What-You-Use not found. Please install it first.")

    def find_source_files(self) -> List[str]:
        """Find all C++ source files."""
        source_files = []
        extensions = ('.cpp', '.cxx', '.cc', '.c++')

        for source_dir in self.source_dirs:
            if not os.path.exists(source_dir):
                continue

            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    if file.endswith(extensions):
                        source_files.append(os.path.join(root, file))

        return source_files

    def run_iwyu_on_file(self, source_file: str) -> Tuple[str, str, int]:
        """Run IWYU on a single file."""
        cmd = [
            self.iwyu_exe,
            "-Xiwyu", "--no_fwd_decls",
            "-Xiwyu", "--mapping_file=" + os.path.join(os.path.dirname(__file__), ".iwyu"),
            source_file
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.build_dir)
            return source_file, result.stdout + result.stderr, result.returncode
        except subprocess.CalledProcessError as e:
            return source_file, e.stderr, e.returncode

    def analyze_all_files(self) -> List[Tuple[str, str, int]]:
        """Analyze all source files."""
        source_files = self.find_source_files()
        results = []

        print(f"🔍 Running IWYU analysis on {len(source_files)} files...")

        for i, source_file in enumerate(source_files, 1):
            print(f"  [{i}/{len(source_files)}] Analyzing {os.path.basename(source_file)}")
            result = self.run_iwyu_on_file(source_file)
            results.append(result)

        return results

    def generate_report(self, results: List[Tuple[str, str, int]]) -> None:
        """Generate analysis report."""
        total_files = len(results)
        files_with_issues = 0
        total_suggestions = 0

        print("\n" + "="*60)
        print("📊 IWYU Analysis Report")
        print("="*60)

        for source_file, output, returncode in results:
            if returncode != 0 or output.strip():
                files_with_issues += 1
                print(f"\n🔧 {os.path.relpath(source_file)}")

                if output.strip():
                    print("   Suggestions:")
                    lines = output.strip().split('\n')
                    for line in lines:
                        if line.strip():
                            print(f"   {line}")
                            total_suggestions += 1

        print("\n" + "="*60)
        print("📈 Summary:")
        print(f"   Total files analyzed: {total_files}")
        print(f"   Files with suggestions: {files_with_issues}")
        print(f"   Total suggestions: {total_suggestions}")

        if files_with_issues == 0:
            print("🎉 No header optimization suggestions found!")
            return 0
        else:
            print(f"\n💡 {files_with_issues} files could benefit from header optimization")
            return 1


def main():
    """Main entry point."""
    if len(sys.argv) < 3:
        print("Usage: python run_iwyu.py <build_dir> <source_dir> [source_dir...]", file=sys.stderr)
        sys.exit(1)

    build_dir = sys.argv[1]
    source_dirs = sys.argv[2:]

    try:
        analyzer = IWYUAnalyzer(source_dirs, build_dir)
        results = analyzer.analyze_all_files()
        exit_code = analyzer.generate_report(results)
        sys.exit(exit_code)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
