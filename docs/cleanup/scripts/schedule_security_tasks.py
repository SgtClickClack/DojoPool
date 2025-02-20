"""
Task scheduler for DojoPool security maintenance.
Handles scheduling and execution of security-related tasks.
"""

import json
import logging
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import schedule


class SecurityTaskScheduler:
    def __init__(self, root_dir: str | Path):
        self.root_dir = Path(root_dir)
        self.setup_logging()

    def setup_logging(self):
        """Set up logging configuration."""
        log_dir = self.root_dir / "logs" / "scheduler"
        log_dir.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(
                    log_dir
                    / f"scheduler_{datetime.now(timezone.utc).strftime('%Y%m%d')}.log"
                ),
                logging.StreamHandler(),
            ],
        )

    def run_security_check(self):
        """Run the automated security check script."""
        try:
            script_path = (
                self.root_dir
                / "docs"
                / "cleanup"
                / "scripts"
                / "automated_security_check.py"
            )
            subprocess.run(
                ["python", str(script_path)], capture_output=True, text=True, check=True
            )
            logging.info("Security check completed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logging.error(f"Security check failed: {e.stderr}")
            return False

    def run_certificate_rotation(self):
        """Run the certificate rotation script."""
        try:
            script_path = (
                self.root_dir
                / "docs"
                / "cleanup"
                / "scripts"
                / "certificate_rotation.py"
            )
            subprocess.run(
                ["python", str(script_path)], capture_output=True, text=True, check=True
            )
            logging.info("Certificate rotation completed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logging.error(f"Certificate rotation failed: {e.stderr}")
            return False

    def check_documentation_age(self):
        """Check if security documentation needs review."""
        try:
            doc_file = self.root_dir / "docs" / "security" / "SECURITY.md"
            if not doc_file.exists():
                logging.warning("Security documentation not found")
                return

            last_modified = datetime.fromtimestamp(
                doc_file.stat().st_mtime, tz=timezone.utc
            )
            days_since_update = (datetime.now(timezone.utc) - last_modified).days

            if days_since_update > 30:
                logging.warning(
                    f"Security documentation is {days_since_update} days old and needs review"
                )
            else:
                logging.info(
                    f"Security documentation is up to date (last updated {days_since_update} days ago)"
                )

        except Exception as e:
            logging.error(f"Error checking documentation age: {str(e)}")

    def generate_status_report(self):
        """Generate a status report of security tasks."""
        try:
            report = {"timestamp": datetime.now(timezone.utc).isoformat(), "tasks": []}

            # Check security reports
            reports_dir = self.root_dir / "docs" / "cleanup" / "security_reports"
            if reports_dir.exists():
                latest_report = max(
                    reports_dir.glob("*.json"),
                    key=lambda x: x.stat().st_mtime,
                    default=None,
                )
                if latest_report:
                    with open(latest_report) as f:
                        report["latest_security_check"] = json.load(f)

            # Check certificate logs
            cert_logs_dir = self.root_dir / "logs" / "certificates"
            if cert_logs_dir.exists():
                latest_log = max(
                    cert_logs_dir.glob("*.log"),
                    key=lambda x: x.stat().st_mtime,
                    default=None,
                )
                if latest_log:
                    report["latest_certificate_rotation"] = datetime.fromtimestamp(
                        latest_log.stat().st_mtime, tz=timezone.utc
                    ).isoformat()

            # Save report
            status_dir = self.root_dir / "docs" / "cleanup" / "status_reports"
            status_dir.mkdir(parents=True, exist_ok=True)

            report_file = (
                status_dir
                / f"security_status_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
            )
            with open(report_file, "w") as f:
                json.dump(report, f, indent=2)

            logging.info(f"Generated status report at {report_file}")

        except Exception as e:
            logging.error(f"Error generating status report: {str(e)}")

    def schedule_tasks(self):
        """Schedule all security-related tasks."""
        # Daily tasks
        schedule.every().day.at("00:00").do(self.run_security_check)
        schedule.every().day.at("00:30").do(self.generate_status_report)

        # Weekly tasks
        schedule.every().monday.at("01:00").do(self.run_certificate_rotation)

        # Monthly tasks
        schedule.every(30).days.at("02:00").do(self.check_documentation_age)

        logging.info("Scheduled security tasks:")
        logging.info("- Daily security check at 00:00")
        logging.info("- Daily status report at 00:30")
        logging.info("- Weekly certificate rotation on Monday at 01:00")
        logging.info("- Monthly documentation check")

    def run_scheduler(self):
        """Run the task scheduler."""
        self.schedule_tasks()

        try:
            while True:
                schedule.run_pending()
                time.sleep(60)
        except KeyboardInterrupt:
            logging.info("Scheduler stopped by user")
        except Exception as e:
            logging.error(f"Scheduler error: {str(e)}")
            raise


def main():
    """Main entry point for security task scheduler."""
    try:
        root_dir = Path(__file__).parent.parent.parent.parent
        scheduler = SecurityTaskScheduler(root_dir)
        scheduler.run_scheduler()
    except Exception as e:
        logging.error(f"Task scheduler failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
