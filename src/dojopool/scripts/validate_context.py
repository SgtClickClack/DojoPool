import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Set

import yaml

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


class ContextValidator:
    """Validates context consistency across documentation."""

    def __init__(self):
        self.base_path = Path(".")
        self.docs_path = self.base_path / "docs"
        self.references: Dict[str, Set[str]] = {}
        self.broken_links: List[Dict] = []
        self.inconsistencies: List[Dict] = []

    def extract_references(self, content: str) -> Set[str]:
        """Extract file references from markdown content."""
        # Match markdown links and code blocks with file paths
        patterns = [
            r"\[([^\]]+)\]\(([^)]+)\)",  # Markdown links
            r"`([^`]+)`",  # Code blocks
            r'\b(src/[^\s\'"]+)',  # Source paths
            r'\b(docs/[^\s\'"]+)',  # Doc paths
        ]

        refs = set()
        for pattern in patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                # Get the file path from the match
                path = match.group(2) if len(match.groups()) > 1 else match.group(1)
                if any(ext in path.lower() for ext in [".md", ".py", ".html", ".css", ".js"]):
                    refs.add(path)

        return refs

    def check_file_references(self):
        """Check all file references in documentation."""
        for doc_file in self.docs_path.rglob("*.md"):
            try:
                content = doc_file.read_text(encoding="utf-8")
                refs = self.extract_references(content)
                self.references[str(doc_file)] = refs

                # Check each reference
                for ref in refs:
                    ref_path = self.base_path / ref
                    if not ref_path.exists():
                        self.broken_links.append(
                            {
                                "source": str(doc_file),
                                "broken_ref": ref,
                                "line_number": self._find_line_number(content, ref),
                            }
                        )
            except Exception as e:
                logging.error(f"Error processing {doc_file}: {e}")

    def _find_line_number(self, content: str, reference: str) -> int:
        """Find the line number where a reference appears."""
        lines = content.split("\n")
        for i, line in enumerate(lines, 1):
            if reference in line:
                return i
        return 0

    def check_cross_references(self):
        """Check for cross-reference consistency."""
        # Build a map of all documented files
        documented_files = set()
        for refs in self.references.values():
            documented_files.update(refs)

        # Check pinned files
        pinned_file = self.base_path / "docs" / "PINNED_FILES.md"
        if pinned_file.exists():
            content = pinned_file.read_text(encoding="utf-8")
            pinned_refs = self.extract_references(content)

            # Check for files that are referenced but not pinned
            for doc_file in documented_files:
                if doc_file not in pinned_refs and self._is_important_file(doc_file):
                    self.inconsistencies.append(
                        {
                            "type": "unpinned_file",
                            "file": doc_file,
                            "message": "Referenced file not in PINNED_FILES.md",
                        }
                    )

    def _is_important_file(self, file_path: str) -> bool:
        """Check if a file should be pinned based on its characteristics."""
        important_patterns = [
            r"docs/.*\.md$",
            r"src/.*/config\.py$",
            r"src/.*/scripts/.*\.py$",
            r"requirements\.txt$",
        ]
        return any(re.search(pattern, file_path) for pattern in important_patterns)

    def check_documentation_dates(self):
        """Check for outdated documentation."""
        tracking_file = self.docs_path / "DEVELOPMENT_TRACKING.md"
        if tracking_file.exists():
            content = tracking_file.read_text(encoding="utf-8")
            # Check if there's a recent entry (within last 2 days)
            today = datetime.now().strftime("%Y-%m-%d")
            yesterday = (datetime.now().date() - timedelta(days=1)).strftime("%Y-%m-%d")

            if not any(date in content for date in [today, yesterday]):
                self.inconsistencies.append(
                    {
                        "type": "outdated_tracking",
                        "file": str(tracking_file),
                        "message": "Development tracking not updated recently",
                    }
                )

    def validate(self) -> bool:
        """Run all validation checks and return True if everything is consistent."""
        self.check_file_references()
        self.check_cross_references()
        self.check_documentation_dates()

        is_valid = not (self.broken_links or self.inconsistencies)

        # Generate report
        report = {
            "timestamp": datetime.now().isoformat(),
            "is_valid": is_valid,
            "broken_links": self.broken_links,
            "inconsistencies": self.inconsistencies,
        }

        # Save report
        report_file = self.base_path / "context_validation.yaml"
        with open(report_file, "w") as f:
            yaml.dump(report, f, default_flow_style=False)

        return is_valid

    def print_report(self):
        """Print validation results."""
        if self.broken_links:
            logging.warning("\nBroken References:")
            for link in self.broken_links:
                logging.warning(
                    f"- In {link['source']} line {link['line_number']}: {link['broken_ref']}"
                )

        if self.inconsistencies:
            logging.warning("\nInconsistencies:")
            for issue in self.inconsistencies:
                logging.warning(f"- {issue['file']}: {issue['message']}")

        if not (self.broken_links or self.inconsistencies):
            logging.info("\nContext validation passed! All documentation is consistent.")


def main():
    validator = ContextValidator()
    is_valid = validator.validate()
    validator.print_report()
    return 0 if is_valid else 1


if __name__ == "__main__":
    main()
