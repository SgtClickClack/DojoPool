#!/usr/bin/env python
"""Script to fix file encoding issues by detecting and converting files to UTF-8."""

import logging
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

import chardet


class EncodingFixer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.setup_logging()
        self.ignored_dirs = {
            "node_modules",
            "venv",
            ".git",
            "__pycache__",
            "build",
            "dist",
            ".pytest_cache",
            ".venv",
            "venv_new",
        }
        self.target_extensions = {".py", ".js", ".json", ".md", ".txt", ".html", ".css"}
        self.fixed_files = []
        self.failed_files = []

    def setup_logging(self):
        """Set up logging configuration."""
        log_dir = self.root_dir / "logs"
        log_dir.mkdir(exist_ok=True)

        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(
                    log_dir
                    / f'encoding_fix_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
                ),
                logging.StreamHandler(),
            ],
        )
        self.logger = logging.getLogger(__name__)

    def should_process_file(self, file_path: Path) -> bool:
        """Check if the file should be processed based on extension and directory."""
        if any(ignored in file_path.parts for ignored in self.ignored_dirs):
            return False
        return file_path.suffix.lower() in self.target_extensions

    def detect_encoding(self, file_path: Path) :
        """Detect the encoding of a file using chardet."""
        try:
            with open(file_path, "rb") as f:
                raw_data = f.read()
                result = chardet.detect(raw_data)
                return result["encoding"] or "utf-8"
        except Exception as e:
            self.logger.error(f"Error detecting encoding for {file_path}: {str(e)}")
            return "utf-8"

    def create_backup(self, file_path: Path) -> Path:
        """Create a backup of the file before modifying it."""
        backup_dir = (
            self.root_dir
            / "backups"
            / "encoding_fixes"
            / datetime.now().strftime("%Y%m%d_%H%M%S")
        )
        backup_dir.mkdir(parents=True, exist_ok=True)

        relative_path = file_path.relative_to(self.root_dir)
        backup_path = backup_dir / relative_path
        backup_path.parent.mkdir(parents=True, exist_ok=True)

        shutil.copy2(file_path, backup_path)
        return backup_path

    def fix_file_encoding(self, file_path: Path) :
        """Fix the encoding of a single file by converting it to UTF-8."""
        if not self.should_process_file(file_path):
            return True

        try:
            # Detect current encoding
            current_encoding = self.detect_encoding(file_path)

            # Read content with detected encoding
            with open(file_path, "r", encoding=current_encoding, errors="replace") as f:
                content = f.read()

            # Create backup
            self.create_backup(file_path)

            # Write content in UTF-8
            with open(file_path, "w", encoding="utf-8", newline="") as f:
                f.write(content)

            self.logger.info(
                f"Successfully converted {file_path} from {current_encoding} to UTF-8"
            )
            self.fixed_files.append(file_path)
            return True

        except Exception as e:
            self.logger.error(f"Failed to fix encoding for {file_path}: {str(e)}")
            self.failed_files.append((file_path, str(e)))
            return False

    def fix_all_files(self):
        """Fix encoding for all files in the project."""
        total_files = 0
        fixed_count = 0

        for file_path in self.root_dir.rglob("*"):
            if file_path.is_file() and self.should_process_file(file_path):
                total_files += 1
                if self.fix_file_encoding(file_path):
                    fixed_count += 1

                if total_files % 100 == 0:
                    self.logger.info(f"Processed {total_files} files...")

        self.generate_report(total_files, fixed_count)

    def generate_report(self, total_files: int, fixed_count: int):
        """Generate a report of the encoding fixes."""
        report_path = self.root_dir / "docs" / "cleanup" / "encoding_fix_report.md"
        report_path.parent.mkdir(parents=True, exist_ok=True)

        with open(report_path, "w", encoding="utf-8") as f:
            f.write("# File Encoding Fix Report\n\n")
            f.write(f"Generated at: {datetime.now().isoformat()}\n\n")

            f.write("## Summary\n")
            f.write(f"- Total files processed: {total_files}\n")
            f.write(f"- Files fixed: {fixed_count}\n")
            f.write(f"- Failed files: {len(self.failed_files)}\n\n")

            if self.fixed_files:
                f.write("## Successfully Fixed Files\n")
                for file_path in self.fixed_files:
                    f.write(f"- {file_path.relative_to(self.root_dir)}\n")
                f.write("\n")

            if self.failed_files:
                f.write("## Failed Files\n")
                for file_path, error in self.failed_files:
                    f.write(f"- {file_path.relative_to(self.root_dir)}: {error}\n")


def main():
    """Main entry point for the script."""
    if len(sys.argv) > 1:
        root_dir = sys.argv[1]
    else:
        root_dir = os.getcwd()

    fixer = EncodingFixer(root_dir)
    fixer.fix_all_files()


if __name__ == "__main__":
    main()
