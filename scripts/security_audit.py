#!/usr/bin/env python3
"""Security audit script to verify security remediations."""

import ast
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class SecurityAuditor:
    """Security auditor to verify security remediations."""

    def __init__(self, root_dir: Path):
        """Initialize security auditor.

        Args:
            root_dir: Root directory to scan
        """
        self.root_dir = root_dir
        self.results = {
            "file_permissions": [],
            "network_bindings": [],
            "process_execution": [],
            "hash_usage": [],
            "debug_mode": [],
            "eval_usage": [],
            "xml_parsing": [],
            "jinja2_config": [],
            "temp_dirs": [],
            "overall_status": "pending",
        }

    def check_file_permissions(self) -> None:
        """Check file permissions for sensitive files."""
        sensitive_paths = [
            "instance",
            "config",
            "keys",
            "certificates",
            "*.db",
            "*.key",
            "*.pem",
        ]

        for path in self.root_dir.rglob("*"):
            if any(path.match(pattern) for pattern in sensitive_paths):
                mode = path.stat().st_mode
                if path.is_dir() and (mode & 0o777) != 0o755:
                    self.results["file_permissions"].append(
                        {
                            "path": str(path),
                            "current_mode": oct(mode & 0o777),
                            "required_mode": "0o755" if path.is_dir() else "0o644",
                            "status": "failed",
                        }
                    )
                elif path.is_file() and (mode & 0o777) != 0o644:
                    self.results["file_permissions"].append(
                        {
                            "path": str(path),
                            "current_mode": oct(mode & 0o777),
                            "required_mode": "0o644",
                            "status": "failed",
                        }
                    )

    def check_network_bindings(self) :
        """Check for hardcoded network bindings."""
        for py_file in self.root_dir.rglob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                if "0.0.0.0" in content and "host=" in content:
                    if "os.environ.get(" not in content:
                        self.results["network_bindings"].append(
                            {
                                "file": str(py_file),
                                "issue": "Hardcoded binding to all interfaces",
                                "status": "failed",
                            }
                        )

    def check_process_execution(self) -> None:
        """Check for insecure process execution."""
        for py_file in self.root_dir.rglob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                if "os.system(" in content or "shell=True" in content:
                    self.results["process_execution"].append(
                        {
                            "file": str(py_file),
                            "issue": "Insecure process execution detected",
                            "status": "failed",
                        }
                    )

    def check_hash_usage(self) -> None:
        """Check for weak hash usage."""
        for py_file in self.root_dir.rglob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                if "hashlib.md5(" in content:
                    # Check if it's documented as non-security usage
                    if "# Non-security usage" not in content:
                        self.results["hash_usage"].append(
                            {
                                "file": str(py_file),
                                "issue": "MD5 hash usage without documentation",
                                "status": "failed",
                            }
                        )

    def check_debug_mode(self) -> None:
        """Check for debug mode configuration."""
        for py_file in self.root_dir.rglob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                if "debug=True" in content:
                    if "os.environ.get(" not in content:
                        self.results["debug_mode"].append(
                            {
                                "file": str(py_file),
                                "issue": "Debug mode hardcoded",
                                "status": "failed",
                            }
                        )

    def check_eval_usage(self) -> None:
        """Check for unsafe eval usage."""
        for py_file in self.root_dir.rglob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                if "eval(" in content:
                    if "ast.literal_eval(" not in content:
                        self.results["eval_usage"].append(
                            {
                                "file": str(py_file),
                                "issue": "Unsafe eval usage",
                                "status": "failed",
                            }
                        )

    def check_xml_parsing(self) -> None:
        """Check for insecure XML parsing."""
        for py_file in self.root_dir.rglob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                if "xml.etree.ElementTree" in content:
                    if "defusedxml" not in content:
                        self.results["xml_parsing"].append(
                            {
                                "file": str(py_file),
                                "issue": "Insecure XML parsing",
                                "status": "failed",
                            }
                        )

    def check_jinja2_config(self) -> None:
        """Check Jinja2 configuration."""
        for py_file in self.root_dir.rglob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                if "jinja2" in content.lower():
                    if "autoescape=select_autoescape" not in content:
                        self.results["jinja2_config"].append(
                            {
                                "file": str(py_file),
                                "issue": "Jinja2 autoescape not configured",
                                "status": "failed",
                            }
                        )

    def check_temp_dirs(self) -> None:
        """Check temporary directory usage."""
        for py_file in self.root_dir.rglob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
                if "/tmp" in content:
                    if "tempfile." not in content:
                        self.results["temp_dirs"].append(
                            {
                                "file": str(py_file),
                                "issue": "Hardcoded temporary directory",
                                "status": "failed",
                            }
                        )

    def run_bandit_scan(self) -> None:
        """Run Bandit security scanner."""
        try:
            result = subprocess.run(
                ["bandit", "-r", str(self.root_dir), "-f", "json"],
                capture_output=True,
                text=True,
                check=True,
            )
            self.results["bandit_scan"] = json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            self.results["bandit_scan"] = {"error": str(e), "output": e.output}

    def generate_report(self) -> str:
        """Generate security audit report.

        Returns:
            Markdown formatted report
        """
        # Determine overall status
        failed_checks = sum(
            1
            for category in self.results.values()
            if isinstance(category, list) and len(category) > 0
        )

        self.results["overall_status"] = "failed" if failed_checks > 0 else "passed"

        # Generate markdown report
        report = [
            "# Security Audit Report",
            f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"\nOverall Status: {'✅ PASSED' if self.results['overall_status'] == 'passed' else '❌ FAILED'}",
            "\n## Security Checks\n",
        ]

        for category, issues in self.results.items():
            if category in ["overall_status", "bandit_scan"]:
                continue

            status = "✅ PASSED" if not issues else "❌ FAILED"
            report.append(f"\n### {category.replace('_', ' ').title()} {status}")

            if issues:
                report.append("\nIssues found:")
                for issue in issues:
                    report.append(f"- {issue['file']}: {issue['issue']}")
            else:
                report.append("\nNo issues found.")

        if "bandit_scan" in self.results:
            report.append("\n## Bandit Scan Results")
            scan_results = self.results["bandit_scan"]
            if "error" in scan_results:
                report.append(f"\nError running Bandit: {scan_results['error']}")
            else:
                report.append(f"\nTotal issues: {len(scan_results.get('results', []))}")

        return "\n".join(report)


def main():
    """Main function."""
    root_dir = Path(__file__).parent.parent
    auditor = SecurityAuditor(root_dir)

    print("Running security audit...")
    auditor.check_file_permissions()
    auditor.check_network_bindings()
    auditor.check_process_execution()
    auditor.check_hash_usage()
    auditor.check_debug_mode()
    auditor.check_eval_usage()
    auditor.check_xml_parsing()
    auditor.check_jinja2_config()
    auditor.check_temp_dirs()
    auditor.run_bandit_scan()

    report = auditor.generate_report()
    report_path = root_dir / "reports" / "security" / "audit_report.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\nSecurity audit completed. Report saved to: {report_path}")

    if auditor.results["overall_status"] == "failed":
        sys.exit(1)


if __name__ == "__main__":
    main()
