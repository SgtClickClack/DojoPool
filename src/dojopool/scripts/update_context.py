import logging
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List

import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("context_updates.log"), logging.StreamHandler()],
)

# This is the core context update system that automatically tracks and documents
# changes across the codebase. It monitors file modifications, analyzes their
# impact, and updates documentation accordingly. The system supports multiple
# file types and integrates with Git hooks for automated validation.


@dataclass
class CodeChange:
    """Represents a code change detected in the repository."""

    file_path: str
    change_type: str  # 'added', 'modified', 'deleted'
    lines_added: int
    lines_removed: int


class ContextUpdate:
    """Represents a context update that needs to be made."""

    def __init__(self, file_path: str, section: str, content: str, reason: str):
        self.file_path = Path(file_path)
        self.section = section
        self.content = content
        self.reason = reason
        self.timestamp = datetime.now()

    def to_dict(self) -> dict:
        return {
            "file_path": str(self.file_path),
            "section": self.section,
            "content": self.content,
            "reason": self.reason,
            "timestamp": self.timestamp.isoformat(),
        }


class ContextManager:
    """Manages context updates across the project."""

    def __init__(self):
        self.updates_file = Path("context_updates.yaml")
        self.pending_updates: List[ContextUpdate] = []
        self.load_pending_updates()

    def load_pending_updates(self):
        """Load pending updates from YAML file."""
        if self.updates_file.exists():
            with open(self.updates_file, "r") as f:
                data = yaml.safe_load(f) or {}
                for update in data.get("pending_updates", []):
                    self.pending_updates.append(
                        ContextUpdate(
                            update["file_path"],
                            update["section"],
                            update["content"],
                            update["reason"],
                        )
                    )

    def save_pending_updates(self):
        """Save pending updates to YAML file."""
        data = {
            "last_updated": datetime.now().isoformat(),
            "pending_updates": [update.to_dict() for update in self.pending_updates],
        }
        with open(self.updates_file, "w") as f:
            yaml.dump(data, f, default_flow_style=False)

    def get_code_changes(self) -> List[CodeChange]:
        """Get list of code changes since last commit."""
        changes = []
        try:
            # Get staged files
            staged = subprocess.check_output(["git", "diff", "--cached", "--numstat"]).decode()
            for line in staged.splitlines():
                if line.strip():
                    added, removed, file_path = line.split("\t")
                    changes.append(
                        CodeChange(
                            file_path=file_path,
                            change_type="modified",
                            lines_added=int(added) if added != "-" else 0,
                            lines_removed=int(removed) if removed != "-" else 0,
                        )
                    )

            # Get unstaged changes
            unstaged = subprocess.check_output(["git", "diff", "--numstat"]).decode()
            for line in unstaged.splitlines():
                if line.strip():
                    added, removed, file_path = line.split("\t")
                    changes.append(
                        CodeChange(
                            file_path=file_path,
                            change_type="modified",
                            lines_added=int(added) if added != "-" else 0,
                            lines_removed=int(removed) if removed != "-" else 0,
                        )
                    )
        except subprocess.CalledProcessError as e:
            logging.error(f"Error getting code changes: {e}")

        return changes

    def analyze_changes(self, changes: List[CodeChange]):
        """Analyze code changes and create appropriate context updates."""
        for change in changes:
            # Skip certain files
            if any(skip in change.file_path for skip in [".git", "__pycache__", ".pyc"]):
                continue

            # Determine the type of update needed
            if change.file_path.endswith(".py"):
                self._handle_python_change(change)
            elif change.file_path.endswith((".js", ".ts")):
                self._handle_javascript_change(change)
            elif change.file_path.endswith(".md"):
                self._handle_documentation_change(change)

    def _handle_python_change(self, change: CodeChange):
        """Handle changes to Python files."""
        if change.lines_added + change.lines_removed > 10:
            self.add_update(
                "docs/DEVELOPMENT_TRACKING.md",
                "Daily Updates",
                f"- Modified `{change.file_path}`: {change.lines_added} lines added, {change.lines_removed} removed",
                "Significant changes to Python file",
            )

    def _handle_javascript_change(self, change: CodeChange):
        """Handle changes to JavaScript/TypeScript files."""
        if change.lines_added + change.lines_removed > 10:
            self.add_update(
                "docs/DEVELOPMENT_TRACKING.md",
                "Daily Updates",
                f"- Modified `{change.file_path}`: {change.lines_added} lines added, {change.lines_removed} removed",
                "Significant changes to JavaScript/TypeScript file",
            )

    def _handle_documentation_change(self, change: CodeChange):
        """Handle changes to documentation files."""
        self.add_update(
            "docs/DOCUMENTATION_INDEX.md",
            "Recent Updates",
            f"- Updated `{change.file_path}`",
            "Documentation changes",
        )

    def add_update(self, file_path: str, section: str, content: str, reason: str):
        """Add a new context update."""
        update = ContextUpdate(file_path, section, content, reason)
        self.pending_updates.append(update)
        self.save_pending_updates()

        # Log the update
        logging.info(f"New context update added for {file_path}")
        logging.info(f"Section: {section}")
        logging.info(f"Reason: {reason}")

        # Update development tracking
        self._update_development_tracking(update)

    def _update_development_tracking(self, update: ContextUpdate):
        """Update the development tracking file with context changes."""
        tracking_file = Path("docs/DEVELOPMENT_TRACKING.md")
        if not tracking_file.exists():
            return

        content = tracking_file.read_text()
        today = datetime.now().strftime("%Y-%m-%d")

        # Create the new entry
        new_entry = f"- {update.content}\n  - {update.reason}"

        # Try to add to today's section if it exists
        if f"### {today}" in content:
            # Add under today's section
            parts = content.split(f"### {today}")
            content = f"{parts[0]}### {today}\n{new_entry}\n{parts[1]}"
        else:
            # Create new section for today
            if "### Daily Updates" in content:
                parts = content.split("### Daily Updates")
                content = f"{parts[0]}### Daily Updates\n\n### {today}\n{new_entry}\n{parts[1]}"
            else:
                content += f"\n### Daily Updates\n\n### {today}\n{new_entry}\n"

        tracking_file.write_text(content)


def main():
    manager = ContextManager()
    changes = manager.get_code_changes()
    manager.analyze_changes(changes)
    return 0


if __name__ == "__main__":
    main()
