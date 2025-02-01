import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("pinned_files.log"), logging.StreamHandler()],
)


class PinnedFile:
    def __init__(self, path: str, purpose: str, update_frequency: str, priority: str):
        self.path = Path(path)
        self.purpose = purpose
        self.update_frequency = update_frequency
        self.priority = priority
        self.last_modified: Optional[datetime] = None
        self.exists: bool = False
        self.status: str = "Unknown"
        self.update_status()

    def update_status(self):
        """Update the status of the pinned file."""
        if not self.path.exists():
            self.exists = False
            self.status = "Missing"
            return

        self.exists = True
        self.last_modified = datetime.fromtimestamp(self.path.stat().st_mtime)

        # Check if file needs attention based on update frequency
        days_since_update = (datetime.now() - self.last_modified).days

        if "daily" in self.update_frequency.lower():
            if days_since_update > 1:
                self.status = "Needs Update"
            else:
                self.status = "Current"
        elif "monthly" in self.update_frequency.lower():
            if days_since_update > 30:
                self.status = "Needs Update"
            else:
                self.status = "Current"
        elif "automated" in self.update_frequency.lower():
            if days_since_update > 1:
                self.status = "Automation Check Required"
            else:
                self.status = "Current"
        else:
            self.status = "Current"  # For "as needed" or other frequencies


class PinnedFileMonitor:
    def __init__(self):
        """Initialize the pinned file monitor."""
        self.base_path = Path("docs/PINNED_FILES.md")
        self.pinned_files: Dict[str, PinnedFile] = {}
        self.load_pinned_files()

    def parse_markdown_table(self, content: str) -> List[Dict[str, str]]:
        """Parse markdown tables into a list of dictionaries."""
        tables = []
        current_table = []
        in_table = False
        headers = []

        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue

            if line.startswith("|"):
                if not in_table:
                    # First row is headers
                    headers = [h.strip() for h in line.strip("|").split("|")]
                    in_table = True
                elif "---" in line:
                    # Separator row, skip
                    continue
                else:
                    # Data row
                    values = [v.strip() for v in line.strip("|").split("|")]
                    if len(values) == len(headers):
                        row = dict(zip(headers, values))
                        current_table.append(row)
            else:
                if in_table:
                    # End of table
                    if current_table:
                        tables.extend(current_table)
                        current_table = []
                    in_table = False

        if current_table:
            tables.extend(current_table)

        return tables

    def load_pinned_files(self):
        """Load pinned files from the markdown file."""
        if not self.base_path.exists():
            logging.error(f"Pinned files list not found at {self.base_path}")
            return

        content = self.base_path.read_text()
        tables = self.parse_markdown_table(content)

        for row in tables:
            path = row.get("File Path", "").strip("`")
            if path:
                self.pinned_files[path] = PinnedFile(
                    path=path,
                    purpose=row.get("Purpose", ""),
                    update_frequency=row.get("Update Frequency", ""),
                    priority=row.get("Priority", "Low"),
                )

    def check_files(self) -> Tuple[List[str], List[str], List[str]]:
        """Check all pinned files and return lists of missing, outdated, and current files."""
        missing = []
        outdated = []
        current = []

        for path, pinned_file in self.pinned_files.items():
            pinned_file.update_status()

            if not pinned_file.exists:
                missing.append(path)
            elif pinned_file.status == "Needs Update":
                outdated.append(path)
            elif pinned_file.status == "Current":
                current.append(path)

        return missing, outdated, current

    def generate_report(self):
        """Generate a report of pinned files status."""
        missing, outdated, current = self.check_files()

        logging.info("\nPinned Files Status Report")
        logging.info("=========================")

        if missing:
            logging.warning("\nMissing Files:")
            for path in missing:
                file = self.pinned_files[path]
                logging.warning(f"- {path} (Priority: {file.priority})")
                logging.warning(f"  Purpose: {file.purpose}")

        if outdated:
            logging.warning("\nOutdated Files:")
            for path in outdated:
                file = self.pinned_files[path]
                logging.warning(f"- {path} (Last Modified: {file.last_modified})")
                logging.warning(f"  Update Frequency: {file.update_frequency}")
                logging.warning(f"  Priority: {file.priority}")

        if current:
            logging.info("\nCurrent Files:")
            for path in current:
                file = self.pinned_files[path]
                logging.info(f"- {path} (Last Modified: {file.last_modified})")

        logging.info("\nSummary:")
        logging.info(f"Total Files: {len(self.pinned_files)}")
        logging.info(f"Missing: {len(missing)}")
        logging.info(f"Outdated: {len(outdated)}")
        logging.info(f"Current: {len(current)}")

    def export_status(self):
        """Export the current status to YAML for other tools."""
        status = {
            "timestamp": datetime.now().isoformat(),
            "files": {
                path: {
                    "exists": file.exists,
                    "status": file.status,
                    "last_modified": file.last_modified.isoformat() if file.last_modified else None,
                    "priority": file.priority,
                    "update_frequency": file.update_frequency,
                    "purpose": file.purpose,
                }
                for path, file in self.pinned_files.items()
            },
        }

        with open("pinned_files_status.yaml", "w") as f:
            yaml.dump(status, f, default_flow_style=False)


def main():
    monitor = PinnedFileMonitor()
    monitor.generate_report()
    monitor.export_status()


if __name__ == "__main__":
    main()
