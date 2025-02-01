"""
Security audit script for DojoPool cleanup.
This script analyzes security-related files and configurations.
"""

import re
from datetime import datetime
from pathlib import Path


class SecurityAuditor:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.security_files = []
        self.potential_secrets = []
        self.certificate_files = []
        self.security_configs = []
        self.issues = []
        # Add ignored directories
        self.ignored_dirs = {".git", "__pycache__", "node_modules", "venv", "env", ".venv", ".env"}

    def should_ignore_dir(self, path: Path) -> bool:
        """Check if directory should be ignored."""
        return any(ignored in path.parts for ignored in self.ignored_dirs)

    def find_security_files(self):
        """Find all security-related files in the project."""
        security_patterns = {
            ".key": "Private Key",
            ".pem": "PEM Certificate",
            ".crt": "Certificate",
            ".cert": "Certificate",
            ".p12": "PKCS12 Certificate",
            ".jks": "Java Keystore",
            ".keystore": "Keystore",
            ".pub": "Public Key",
        }

        for path in self.root_dir.rglob("*"):
            if self.should_ignore_dir(path):
                continue
            if path.suffix in security_patterns:
                print(f"Found security file: {path.relative_to(self.root_dir)}")
                self.security_files.append(
                    {
                        "path": str(path),
                        "type": security_patterns[path.suffix],
                        "relative_path": str(path.relative_to(self.root_dir)),
                        "size": path.stat().st_size,
                        "last_modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
                    }
                )

    def scan_for_secrets(self):
        """Scan files for potential secrets and sensitive information."""
        secret_patterns = {
            "api_key": r'(?i)(api[_-]?key|apikey)["\']?\s*(?:=|:)\s*["\']([^"\']+)["\']',
            "password": r'(?i)(password|passwd|pwd)["\']?\s*(?:=|:)\s*["\']([^"\']+)["\']',
            "secret": r'(?i)(secret|token)["\']?\s*(?:=|:)\s*["\']([^"\']+)["\']',
        }

        # Files to check (add more extensions as needed)
        file_extensions = {".py", ".js", ".json", ".yaml", ".yml", ".ini", ".conf", ".env"}
        files_checked = 0

        for path in self.root_dir.rglob("*"):
            if self.should_ignore_dir(path):
                continue
            if path.suffix in file_extensions:
                files_checked += 1
                if files_checked % 100 == 0:
                    print(f"Checked {files_checked} files...")
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                        for secret_type, pattern in secret_patterns.items():
                            matches = re.finditer(pattern, content)
                            for match in matches:
                                print(
                                    f"Found potential secret in: {path.relative_to(self.root_dir)}"
                                )
                                self.potential_secrets.append(
                                    {
                                        "file": str(path.relative_to(self.root_dir)),
                                        "type": secret_type,
                                        "line": content.count("\n", 0, match.start()) + 1,
                                        "match": match.group(),
                                        "risk_level": (
                                            "HIGH"
                                            if secret_type in ["api_key", "secret"]
                                            else "MEDIUM"
                                        ),
                                    }
                                )
                except Exception as e:
                    self.issues.append(
                        {
                            "file": str(path.relative_to(self.root_dir)),
                            "error": str(e),
                            "type": "file_read_error",
                        }
                    )

    def generate_report(self):
        """Generate a detailed security audit report."""
        report = f"""# Security Audit Report
Generated at: {datetime.now().isoformat()}

## Overview
- Security Files Found: {len(self.security_files)}
- Potential Secrets Found: {len(self.potential_secrets)}
- Issues Found: {len(self.issues)}

## Security Files
"""
        # Add security files
        for file_info in self.security_files:
            report += f"- {file_info['relative_path']}\n"
            report += f"  - Type: {file_info['type']}\n"
            report += f"  - Size: {file_info['size']} bytes\n"
            report += f"  - Last Modified: {file_info['last_modified']}\n"

        # Add potential secrets
        report += "\n## Potential Secrets Found\n"
        if self.potential_secrets:
            for secret in self.potential_secrets:
                report += f"- {secret['file']} (Line {secret['line']})\n"
                report += f"  - Type: {secret['type']}\n"
                report += f"  - Risk Level: {secret['risk_level']}\n"
        else:
            report += "No potential secrets found.\n"

        # Add issues
        report += "\n## Issues Found\n"
        if self.issues:
            for issue in self.issues:
                report += f"- {issue['file']}: {issue['error']}\n"
        else:
            report += "No issues found.\n"

        # Save report
        report_path = self.root_dir / "docs" / "cleanup" / "security_audit_report.md"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(report, encoding="utf-8")
        print(f"Report generated: {report_path}")


def main():
    """Main function to run the security audit."""
    root_dir = Path(__file__).parent.parent.parent.parent
    auditor = SecurityAuditor(root_dir)

    print("Finding security files...")
    auditor.find_security_files()

    print("Scanning for secrets...")
    auditor.scan_for_secrets()

    print("Generating report...")
    auditor.generate_report()


if __name__ == "__main__":
    main()
