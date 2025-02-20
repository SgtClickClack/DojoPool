#!/usr/bin/env python3
"""
Comprehensive security report generator for DojoPool.
Combines data from various security tools and checks to create detailed reports.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("security_report.log"), logging.StreamHandler()],
)

logger = logging.getLogger(__name__)


class SecurityReportGenerator:
    def __init__(self, root_dir: str | Path):
        self.root_dir = Path(root_dir)
        self.report_dir = self.root_dir / "reports" / "security"
        self.report_dir.mkdir(parents=True, exist_ok=True)

        # Initialize report data structure
        self.report_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": {},
            "vulnerability_scan": {},
            "security_audit": {},
            "configuration_check": {},
            "dependency_analysis": {},
            "certificate_status": {},
            "recommendations": [],
        }

    def collect_vulnerability_scan_results(self) -> None:
        """Collect results from vulnerability scanners."""
        try:
            # Check for Bandit results
            bandit_results = self.root_dir / "bandit-results.json"
            if bandit_results.exists():
                with open(bandit_results) as f:
                    self.report_data["vulnerability_scan"]["bandit"] = json.load(f)

            # Check for npm audit results
            npm_audit = self.root_dir / "npm-audit.json"
            if npm_audit.exists():
                with open(npm_audit) as f:
                    self.report_data["vulnerability_scan"]["npm"] = json.load(f)

            # Check for detect-secrets results
            secrets_results = self.root_dir / "secrets-results.txt"
            if secrets_results.exists():
                with open(secrets_results) as f:
                    self.report_data["vulnerability_scan"]["secrets"] = f.read()

        except Exception as e:
            logger.error(f"Error collecting vulnerability scan results: {e}")

    def collect_security_audit_results(self) -> None:
        """Collect results from security audits."""
        try:
            audit_report = (
                self.root_dir / "docs" / "cleanup" / "security_audit_report.md"
            )
            if audit_report.exists():
                with open(audit_report) as f:
                    self.report_data["security_audit"]["report"] = f.read()

            # Collect results from automated security checks
            security_reports_dir = (
                self.root_dir / "docs" / "cleanup" / "security_reports"
            )
            if security_reports_dir.exists():
                latest_report = max(
                    security_reports_dir.glob("security_check_*_summary.json"),
                    key=lambda x: x.stat().st_mtime,
                    default=None,
                )
                if latest_report:
                    with open(latest_report) as f:
                        self.report_data["security_audit"]["automated_checks"] = (
                            json.load(f)
                        )

        except Exception as e:
            logger.error(f"Error collecting security audit results: {e}")

    def analyze_dependencies(self) :
        """Analyze project dependencies for security issues."""
        try:
            # Check pip-audit results
            pip_audit_log = self.root_dir / "pip-audit.log"
            if pip_audit_log.exists():
                with open(pip_audit_log) as f:
                    self.report_data["dependency_analysis"]["pip_audit"] = f.read()

            # Check OWASP Dependency Check results
            dependency_check = (
                self.root_dir / "reports" / "dependency-check-report.json"
            )
            if dependency_check.exists():
                with open(dependency_check) as f:
                    self.report_data["dependency_analysis"]["owasp"] = json.load(f)

        except Exception as e:
            logger.error(f"Error analyzing dependencies: {e}")

    def check_certificate_status(self) -> None:
        """Check SSL/TLS certificate status."""
        try:
            cert_paths = [
                "certs",
                "ssl",
                "deployment/ssl",
                "deployment/nginx/test/ssl/certs",
                "nginx/ssl",
            ]

            cert_status = {}
            for cert_path in cert_paths:
                full_path = self.root_dir / cert_path
                if full_path.exists():
                    certs = list(full_path.glob("*.crt")) + list(
                        full_path.glob("*.pem")
                    )
                    for cert in certs:
                        cert_status[str(cert.relative_to(self.root_dir))] = {
                            "last_modified": datetime.fromtimestamp(
                                cert.stat().st_mtime, tz=timezone.utc
                            ).isoformat()
                        }

            self.report_data["certificate_status"] = cert_status

        except Exception as e:
            logger.error(f"Error checking certificate status: {e}")

    def generate_recommendations(self) :
        """Generate security recommendations based on findings."""
        recommendations = []

        # Check vulnerability findings
        if self.report_data.get("vulnerability_scan", {}).get("bandit"):
            vuln_count = len(
                self.report_data["vulnerability_scan"]["bandit"].get("results", [])
            )
            if vuln_count > 0:
                recommendations.append(
                    {
                        "priority": "high",
                        "category": "vulnerabilities",
                        "description": f"Address {vuln_count} security vulnerabilities found by Bandit",
                    }
                )

        # Check certificate age
        for cert_path, cert_info in self.report_data.get(
            "certificate_status", {}
        ).items():
            cert_date = datetime.fromisoformat(cert_info["last_modified"])
            age_days = (datetime.now(timezone.utc) - cert_date).days
            if age_days > 60:
                recommendations.append(
                    {
                        "priority": "medium",
                        "category": "certificates",
                        "description": f"Certificate {cert_path} is {age_days} days old. Consider rotation.",
                    }
                )

        self.report_data["recommendations"] = recommendations

    def generate_summary(self) -> None:
        """Generate executive summary of findings."""
        summary = {
            "total_vulnerabilities": 0,
            "critical_issues": 0,
            "high_issues": 0,
            "medium_issues": 0,
            "low_issues": 0,
            "certificates_expiring_soon": 0,
            "recommendation_count": len(self.report_data["recommendations"]),
        }

        # Count vulnerabilities
        if "bandit" in self.report_data.get("vulnerability_scan", {}):
            results = self.report_data["vulnerability_scan"]["bandit"].get(
                "results", []
            )
            summary["total_vulnerabilities"] += len(results)
            for result in results:
                severity = result.get("issue_severity", "").lower()
                if severity == "high":
                    summary["high_issues"] += 1
                elif severity == "medium":
                    summary["medium_issues"] += 1
                elif severity == "low":
                    summary["low_issues"] += 1

        self.report_data["summary"] = summary

    def generate_report(self) :
        """Generate the comprehensive security report."""
        try:
            logger.info("Collecting vulnerability scan results...")
            self.collect_vulnerability_scan_results()

            logger.info("Collecting security audit results...")
            self.collect_security_audit_results()

            logger.info("Analyzing dependencies...")
            self.analyze_dependencies()

            logger.info("Checking certificate status...")
            self.check_certificate_status()

            logger.info("Generating recommendations...")
            self.generate_recommendations()

            logger.info("Generating summary...")
            self.generate_summary()

            # Save the report
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_file = self.report_dir / f"security_report_{timestamp}.json"

            with open(report_file, "w") as f:
                json.dump(self.report_data, f, indent=2)

            # Generate HTML report
            html_report = self.generate_html_report()
            html_file = self.report_dir / f"security_report_{timestamp}.html"

            with open(html_file, "w") as f:
                f.write(html_report)

            logger.info(f"Report generated successfully: {report_file}")
            logger.info(f"HTML report generated: {html_file}")

        except Exception as e:
            logger.error(f"Error generating report: {e}")
            raise

    def generate_html_report(self) :
        """Generate an HTML version of the security report."""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>DojoPool Security Report - {datetime.now().strftime('%Y-%m-%d')}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1, h2 {{ color: #333; }}
                .summary {{ background: #f5f5f5; padding: 20px; border-radius: 5px; }}
                .high {{ color: #d9534f; }}
                .medium {{ color: #f0ad4e; }}
                .low {{ color: #5bc0de; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f5f5f5; }}
            </style>
        </head>
        <body>
            <h1>DojoPool Security Report</h1>
            <p>Generated at: {self.report_data['timestamp']}</p>
            
            <h2>Executive Summary</h2>
            <div class="summary">
                <p>Total Vulnerabilities: {self.report_data['summary']['total_vulnerabilities']}</p>
                <p>Critical Issues: <span class="high">{self.report_data['summary']['critical_issues']}</span></p>
                <p>High Issues: <span class="high">{self.report_data['summary']['high_issues']}</span></p>
                <p>Medium Issues: <span class="medium">{self.report_data['summary']['medium_issues']}</span></p>
                <p>Low Issues: <span class="low">{self.report_data['summary']['low_issues']}</span></p>
            </div>

            <h2>Recommendations</h2>
            <table>
                <tr>
                    <th>Priority</th>
                    <th>Category</th>
                    <th>Description</th>
                </tr>
        """

        for rec in self.report_data["recommendations"]:
            html += f"""
                <tr>
                    <td class="{rec['priority']}">{rec['priority'].upper()}</td>
                    <td>{rec['category']}</td>
                    <td>{rec['description']}</td>
                </tr>
            """

        html += """
            </table>
        </body>
        </html>
        """

        return html


def main():
    try:
        root_dir = Path(__file__).parent.parent
        generator = SecurityReportGenerator(root_dir)
        generator.generate_report()
    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
