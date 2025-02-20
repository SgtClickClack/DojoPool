"""
Secret cleanup script for DojoPool project.
Handles removal of exposed secrets and migration to environment variables.
"""

import json
import logging
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional


class SecretCleaner:
    def __init__(self, root_dir: str | Path):
        self.root_dir = Path(root_dir)
        self.setup_logging()
        self.env_vars = {}
        self.files_to_update = []

    def setup_logging(self):
        """Set up logging configuration."""
        log_dir = self.root_dir / "logs" / "cleanup"
        log_dir.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(
                    log_dir
                    / f"secret_cleanup_{datetime.now(timezone.utc).strftime('%Y%m%d')}.log"
                ),
                logging.StreamHandler(),
            ],
        )

    def load_client_secrets(self):
        """Load client secrets from existing configuration."""
        try:
            client_secret_file = self.root_dir / "instance" / "client_secret.json"
            if client_secret_file.exists():
                with open(client_secret_file) as f:
                    secrets = json.load(f)
                    self.env_vars.update(
                        {
                            "GOOGLE_CLIENT_ID": secrets.get("web", {}).get(
                                "client_id", ""
                            ),
                            "GOOGLE_CLIENT_SECRET": secrets.get("web", {}).get(
                                "client_secret", ""
                            ),
                        }
                    )
                logging.info("Loaded client secrets from client_secret.json")
        except Exception as e:
            logging.error(f"Error loading client secrets: {str(e)}")

    def find_files_to_update(self):
        """Find files containing secrets that need to be updated."""
        secret_patterns = [
            (r"api[_-]?key.*['\"]([a-zA-Z0-9_\-]{32,})['\"]", "API_KEY"),
            (r"secret[_-]?key.*['\"]([a-zA-Z0-9_\-]{32,})['\"]", "SECRET_KEY"),
            (r"os.getenv('PASSWORD_17')"),
            (r"token.*['\"]([a-zA-Z0-9_\-]{32,})['\"]", "TOKEN"),
        ]

        exclude_dirs = {
            ".git",
            "node_modules",
            "__pycache__",
            "venv",
            ".venv",
            "build",
            "dist",
        }

        for root, dirs, files in os.walk(self.root_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file.endswith((".py", ".js", ".json", ".yaml", ".yml")):
                    try:
                        file_path = Path(root) / file
                        with open(file_path) as f:
                            content = f.read()

                        for pattern, var_type in secret_patterns:
                            matches = re.finditer(pattern, content)
                            for match in matches:
                                secret_value = match.group(1)
                                var_name = f"{var_type}_{len(self.env_vars)}"
                                self.env_vars[var_name] = secret_value
                                self.files_to_update.append(
                                    {
                                        "file": file_path,
                                        "pattern": pattern,
                                        "var_name": var_name,
                                    }
                                )
                    except Exception as e:
                        logging.error(f"Error checking file {file_path}: {str(e)}")

    def generate_env_file(self):
        """Generate .env file with collected secrets."""
        try:
            env_file = self.root_dir / ".env"
            env_test_file = self.root_dir / ".env.test"

            # Update production .env
            env_content = []
            for var_name, value in self.env_vars.items():
                env_content.append(f"{var_name}={value}")

            with open(env_file, "a") as f:
                f.write("\n".join(env_content) + "\n")

            # Create test .env with placeholder values
            test_content = []
            for var_name in self.env_vars:
                test_content.append(f"{var_name}=test_{var_name.lower()}")

            with open(env_test_file, "w") as f:
                f.write("\n".join(test_content) + "\n")

            logging.info(f"Generated environment files: {env_file}, {env_test_file}")

        except Exception as e:
            logging.error(f"Error generating environment files: {str(e)}")

    def create_backup(self, file_path: Path) -> Optional[Path]:
        """Create a backup of a file before modifying it."""
        try:
            backup_dir = (
                self.root_dir
                / "backups"
                / datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            )
            backup_dir.mkdir(parents=True, exist_ok=True)

            relative_path = file_path.relative_to(self.root_dir)
            backup_file = backup_dir / relative_path
            backup_file.parent.mkdir(parents=True, exist_ok=True)

            shutil.copy2(file_path, backup_file)
            logging.info(f"Created backup of {file_path} at {backup_file}")
            return backup_file

        except Exception as e:
            logging.error(f"Error creating backup of {file_path}: {str(e)}")
            return None

    def update_file_contents(self, file_path: Path, updates: List[Dict]) :
        """Update file contents to use environment variables."""
        try:
            with open(file_path) as f:
                content = f.read()

            for update in updates:
                pattern = update["pattern"]
                var_name = update["var_name"]

                # Replace the secret with an environment variable reference
                if file_path.suffix == ".py":
                    content = re.sub(pattern, f'os.getenv("{var_name}")', content)
                elif file_path.suffix == ".js":
                    content = re.sub(pattern, f"process.env.{var_name}", content)
                else:
                    content = re.sub(pattern, f"${{{var_name}}}", content)

            with open(file_path, "w") as f:
                f.write(content)

            logging.info(f"Updated {file_path} to use environment variables")
            return True

        except Exception as e:
            logging.error(f"Error updating {file_path}: {str(e)}")
            return False

    def cleanup_secrets(self):
        """Main method to handle secret cleanup."""
        try:
            # Load existing secrets
            self.load_client_secrets()

            # Find files containing secrets
            self.find_files_to_update()

            if not self.files_to_update:
                logging.info("No secrets found that need to be cleaned up")
                return True

            # Generate environment files
            self.generate_env_file()

            # Update files
            success = True
            for file_info in self.files_to_update:
                file_path = file_info["file"]

                # Create backup
                if not self.create_backup(file_path):
                    logging.error(f"Failed to create backup of {file_path}")
                    success = False
                    continue

                # Update file contents
                updates = [u for u in self.files_to_update if u["file"] == file_path]
                if not self.update_file_contents(file_path, updates):
                    logging.error(f"Failed to update {file_path}")
                    success = False
                    continue

            return success

        except Exception as e:
            logging.error(f"Secret cleanup failed: {str(e)}")
            return False


def main():
    """Main entry point for secret cleanup script."""
    try:
        root_dir = Path(__file__).parent.parent.parent.parent
        cleaner = SecretCleaner(root_dir)
        success = cleaner.cleanup_secrets()
        sys.exit(0 if success else 1)
    except Exception as e:
        logging.error(f"Secret cleanup failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
