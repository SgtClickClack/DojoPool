"""Main automation script for DojoPool.

This script coordinates all automated fixing and improvement tools.
"""

import concurrent.futures
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from .code_fixer import CodeFixer
from .dependency_fixer import DependencyFixer
from .performance_fixer import PerformanceFixer
from .security_fixer import SecurityFixer

logger = logging.getLogger(__name__)
console = Console()

class AutoFixer:
    """Main automation coordination tool."""

    def __init__(self, project_root: Path):
        """Initialize auto fixer.
        
        Args:
            project_root: Root directory of the project
        """
        self.project_root = project_root
        self.logger = logging.getLogger(__name__)
        self.start_time = None
        self.end_time = None
        
        # Initialize individual fixers
        self.code_fixer = CodeFixer(project_root)
        self.security_fixer = SecurityFixer(project_root)
        self.performance_fixer = PerformanceFixer(project_root)
        self.dependency_fixer = DependencyFixer(project_root)

    def fix_all(self, path: Optional[Path] = None, parallel: bool = True) -> Dict[str, Any]:
        """Run all automated fixes on the codebase.
        
        Args:
            path: Specific path to fix, or entire project if None
            parallel: Whether to run fixes in parallel
            
        Returns:
            Dict containing results of all fixes
        """
        self.start_time = datetime.now()
        results = {}

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            if parallel:
                results = self._run_parallel_fixes(path, progress)
            else:
                results = self._run_sequential_fixes(path, progress)

        self.end_time = datetime.now()
        summary = self._summarize_results(results)
        self._generate_report(summary)
        return summary

    def _run_parallel_fixes(self, path: Optional[Path], progress) -> Dict[str, Any]:
        """Run fixes in parallel using ThreadPoolExecutor."""
        results = {}
        task = progress.add_task("Running fixes in parallel...", total=4)

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_to_fixer = {
                executor.submit(self.dependency_fixer.fix_all, path): "dependencies",
                executor.submit(self.security_fixer.fix_all, path): "security",
                executor.submit(self.code_fixer.fix_all, path): "code",
                executor.submit(self.performance_fixer.fix_all, path): "performance"
            }

            for future in concurrent.futures.as_completed(future_to_fixer):
                fixer_name = future_to_fixer[future]
                try:
                    results[fixer_name] = future.result()
                    progress.advance(task)
                except Exception as e:
                    logger.error(f"Error in {fixer_name}: {str(e)}")
                    results[fixer_name] = {"error": str(e)}

        return results

    def _run_sequential_fixes(self, path: Optional[Path], progress) -> Dict[str, Any]:
        """Run fixes sequentially with progress tracking."""
        results = {}
        fixers = [
            ("dependencies", self.dependency_fixer),
            ("security", self.security_fixer),
            ("code", self.code_fixer),
            ("performance", self.performance_fixer)
        ]

        for name, fixer in fixers:
            task = progress.add_task(f"Running {name} fixes...", total=1)
            try:
                results[name] = fixer.fix_all(path)
            except Exception as e:
                logger.error(f"Error in {name}: {str(e)}")
                results[name] = {"error": str(e)}
            progress.advance(task)

        return results

    def _generate_report(self, results: Dict[str, Any]) -> None:
        """Generate detailed report of fixes applied."""
        report = {
            "summary": results,
            "timing": {
                "start": self.start_time.isoformat(),
                "end": self.end_time.isoformat(),
                "duration": str(self.end_time - self.start_time)
            }
        }

        # Save report to file
        report_path = self.project_root / "reports" / f"autofix_{self.start_time:%Y%m%d_%H%M%S}.json"
        report_path.parent.mkdir(exist_ok=True)
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        # Display summary table
        table = Table(title="Auto-Fixer Results")
        table.add_column("Category")
        table.add_column("Fixes Applied")

        for category, count in results["fixes_by_category"].items():
            table.add_row(category, str(count))

        console.print(table)
        console.print(f"\nTotal fixes applied: {results['total_fixes']}")
        console.print(f"Duration: {report['timing']['duration']}")
        console.print(f"Report saved to: {report_path}")

    def fix_path(self, path: Path) -> Dict[str, Any]:
        """Run all fixes on a specific path.
        
        Args:
            path: Path to fix
            
        Returns:
            Dict containing results of all fixes
        """
        return self.fix_all(path)
        
    def fix_file(self, file_path: Path) -> Dict[str, Any]:
        """Run all fixes on a specific file.
        
        Args:
            file_path: File to fix
            
        Returns:
            Dict containing results of all fixes
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        return self.fix_all(file_path)
        
    def _summarize_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize fix results.
        
        Args:
            results: Raw results from all fixers
            
        Returns:
            Dict containing summarized results
        """
        summary = {
            "total_fixes": 0,
            "fixes_by_category": {},
            "status": "completed",
        }
        
        # Aggregate fixes by category
        for category, result in results.items():
            if "fixes_applied" in result:
                fixes = result["fixes_applied"]
                summary["total_fixes"] += fixes
                summary["fixes_by_category"][category] = fixes
                
        return summary
        
def main():
    """Main entry point for auto-fixing."""
    import argparse
    
    parser = argparse.ArgumentParser(description="DojoPool Auto-Fixer")
    parser.add_argument(
        "--path",
        type=str,
        help="Path to fix (defaults to entire project)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )
    parser.add_argument(
        "--no-parallel",
        action="store_true",
        help="Disable parallel processing",
    )
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    
    # Get project root
    project_root = Path(__file__).parent.parent.parent
    
    # Initialize and run auto-fixer
    fixer = AutoFixer(project_root)
    
    try:
        path = Path(args.path) if args.path else None
        results = fixer.fix_all(path, parallel=not args.no_parallel)
        
    except Exception as e:
        logger.error(f"Auto-fixing failed: {str(e)}")
        raise
        
if __name__ == "__main__":
    main() 