"""
Configuration file audit script for DojoPool cleanup.
This script analyzes all configuration files and generates a detailed report.
"""

import configparser
import json
import os
import re
from pathlib import Path
from typing import Any, Dict

import toml
import yaml


class ConfigAuditor:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.config_files = []
        self.settings_map = {}
        self.duplicates = []
        self.security_issues = []
        self.config_relationships = {}

    def find_config_files(self):
        """Find all configuration files in the project."""
        config_patterns = {
            ".yaml": "YAML",
            ".yml": "YAML",
            ".toml": "TOML",
            ".ini": "INI",
            ".json": "JSON",
            ".env": "ENV",
            ".conf": "CONF",
        }

        for path in self.root_dir.rglob("*"):
            if path.suffix in config_patterns:
                self.config_files.append(
                    {
                        "path": str(path),
                        "type": config_patterns[path.suffix],
                        "relative_path": str(path.relative_to(self.root_dir)),
                        "size": path.stat().st_size,
                    }
                )

    def parse_config_file(self, file_info: Dict[str, str]) -> Dict[str, Any]:
        """Parse a configuration file based on its type."""
        try:
            with open(file_info["path"], "r", encoding="utf-8") as f:
                content = f.read()
                if file_info["type"] == "YAML":
                    return yaml.safe_load(content) or {}
                elif file_info["type"] == "TOML":
                    return toml.loads(content)
                elif file_info["type"] == "JSON":
                    return json.loads(content)
                elif file_info["type"] == "INI":
                    config = configparser.ConfigParser()
                    config.read(file_info["path"])
                    return {s: dict(config.items(s)) for s in config.sections()}
                elif file_info["type"] in ["ENV", "CONF"]:
                    # Parse key-value pairs
                    settings = {}
                    for line in content.splitlines():
                        line = line.strip()
                        if line and not line.startswith("#"):
                            if "=" in line:
                                key, value = line.split("=", 1)
                                settings[key.strip()] = value.strip()
                    return settings
        except Exception as e:
            return {"error": str(e)}
        return {}

    def flatten_dict(self, d: Any, parent_key: str = "") -> Dict[str, Any]:
        """Flatten a nested dictionary or list."""
        items = []
        if isinstance(d, dict):
            for k, v in d.items():
                new_key = f"{parent_key}.{k}" if parent_key else k
                if isinstance(v, (dict, list)):
                    items.extend(self.flatten_dict(v, new_key).items())
                else:
                    items.append((new_key, v))
        elif isinstance(d, list):
            for i, v in enumerate(d):
                new_key = f"{parent_key}[{i}]"
                if isinstance(v, (dict, list)):
                    items.extend(self.flatten_dict(v, new_key).items())
                else:
                    items.append((new_key, v))
        else:
            items.append((parent_key, d))
        return dict(items)

    def find_duplicates(self):
        """Find duplicate settings across configuration files."""
        for file_info in self.config_files:
            settings = self.parse_config_file(file_info)
            flat_settings = self.flatten_dict(settings)

            for key, value in flat_settings.items():
                if key not in self.settings_map:
                    self.settings_map[key] = []
                self.settings_map[key].append(
                    {"file": file_info["relative_path"], "value": value}
                )

        # Find duplicates
        for key, occurrences in self.settings_map.items():
            if len(occurrences) > 1:
                values = {str(o["value"]) for o in occurrences}
                if len(values) > 1:  # Different values for same key
                    self.duplicates.append({"key": key, "occurrences": occurrences})

    def check_security_issues(self):
        """Check for potential security issues in configuration files."""
        security_patterns = {
            "api_key": r'api[_-]key.*=.*[\'"][\w\-]+[\'"]',
            "password": r'password.*=.*[\'"][\w\-]+[\'"]',
            "secret": r'secret.*=.*[\'"][\w\-]+[\'"]',
            "token": r'token.*=.*[\'"][\w\-]+[\'"]',
            "private_key": r'private[_-]key.*=.*[\'"][\w\-]+[\'"]',
        }

        for file_info in self.config_files:
            try:
                with open(file_info["path"], "r", encoding="utf-8") as f:
                    content = f.read()
                    for issue_type, pattern in security_patterns.items():
                        matches = re.finditer(pattern, content, re.IGNORECASE)
                        for match in matches:
                            self.security_issues.append(
                                {
                                    "file": file_info["relative_path"],
                                    "type": issue_type,
                                    "line": content.count("\n", 0, match.start()) + 1,
                                    "match": match.group(),
                                }
                            )
            except Exception as e:
                print(f"Error processing {file_info['path']}: {e}")

    def analyze_relationships(self):
        """Analyze relationships between configuration files."""
        for file_info in self.config_files:
            try:
                with open(file_info["path"], "r", encoding="utf-8") as f:
                    content = f.read()
                    # Look for references to other config files
                    for other_file in self.config_files:
                        if other_file["path"] != file_info["path"]:
                            if os.path.basename(other_file["path"]) in content:
                                if (
                                    file_info["relative_path"]
                                    not in self.config_relationships
                                ):
                                    self.config_relationships[
                                        file_info["relative_path"]
                                    ] = []
                                self.config_relationships[
                                    file_info["relative_path"]
                                ].append(other_file["relative_path"])
            except Exception as e:
                print(f"Error analyzing relationships in {file_info['path']}: {e}")

    def generate_report(self):
        """Generate a detailed report of the configuration audit."""
        report = f"""# Configuration Files Audit Report

## Overview
Total Configuration Files: {len(self.config_files)}

## Configuration Files by Type
"""
        # Group files by type
        files_by_type = {}
        for file_info in self.config_files:
            if file_info["type"] not in files_by_type:
                files_by_type[file_info["type"]] = []
            files_by_type[file_info["type"]].append(file_info)

        for file_type, files in files_by_type.items():
            report += f"\n### {file_type}\n"
            for file_info in files:
                report += (
                    f"- {file_info['relative_path']} ({file_info['size']} bytes)\n"
                )

        # Add security issues
        report += "\n## Security Issues\n"
        if self.security_issues:
            for issue in self.security_issues:
                report += f"- {issue['file']} (Line {issue['line']})\n"
                report += f"  - Type: {issue['type']}\n"
                report += f"  - Match: {issue['match']}\n"
        else:
            report += "No security issues found.\n"

        # Add duplicates
        report += "\n## Duplicate Settings\n"
        if self.duplicates:
            for dup in self.duplicates:
                report += f"\n### {dup['key']}\n"
                for occ in dup["occurrences"]:
                    report += f"- {occ['file']}: {occ['value']}\n"
        else:
            report += "No duplicate settings found.\n"

        # Add relationships
        report += "\n## Configuration Relationships\n"
        if self.config_relationships:
            for file, references in self.config_relationships.items():
                report += f"\n### {file}\nReferences:\n"
                for ref in references:
                    report += f"- {ref}\n"
        else:
            report += "No configuration relationships found.\n"

        # Save report
        report_file = self.root_dir / "docs" / "cleanup" / "config_audit_report.md"
        report_file.write_text(report, encoding="utf-8")
        print(f"Report generated: {report_file}")


def main():
    """Main function to run the configuration audit."""
    root_dir = Path(__file__).parent.parent.parent.parent
    auditor = ConfigAuditor(root_dir)

    print("Finding configuration files...")
    auditor.find_config_files()

    print("Checking for duplicates...")
    auditor.find_duplicates()

    print("Checking for security issues...")
    auditor.check_security_issues()

    print("Analyzing relationships...")
    auditor.analyze_relationships()

    print("Generating report...")
    auditor.generate_report()


if __name__ == "__main__":
    main()
