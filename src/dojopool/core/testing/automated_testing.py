from multiprocessing import Pool
import gc
from multiprocessing import Pool
import gc
"""Automated testing system for comprehensive test execution and reporting."""

import json
import logging
import shutil
import smtplib
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List, Optional

import coverage
import jinja2
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import pytest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AutomatedTesting:
    """Automated testing system for managing and executing tests."""

    def __init__(self, base_path: str):
        """Initialize automated testing system.

        Args:
            base_path: Base path for test execution and reports
        """
        self.base_path = Path(base_path)
        self.reports_dir = self.base_path / "test_reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.history_file = self.base_path / "test_history.json"
        self.config_file = self.base_path / "test_config.json"
        self.logger = logging.getLogger(__name__)

        # Load or create configuration
        self.config = self._load_config()

        self.results_dir = self.base_path / "results"
        self.results_dir.mkdir(exist_ok=True)
        self.cov = coverage.Coverage()

    def run_tests(
        self,
        test_types: Optional[List[str]] = None,
        parallel: bool = True,
        coverage: bool = True,
        notify: bool = True,
    ) -> Dict[str, Any]:
        """Run specified types of tests.

        Args:
            test_types: List of test types to run (unit, integration, e2e)
            parallel: Whether to run tests in parallel
            coverage: Whether to collect coverage data
            notify: Whether to send notifications

        Returns:
            dict: Test execution results
        """
        if test_types is None:
            test_types = ["unit", "integration", "e2e"]

        results = {}
        start_time = datetime.now()

        try:
            if parallel and len(test_types) > 1:
                results = self._run_parallel_tests(test_types, coverage)
            else:
                results = self._run_sequential_tests(test_types, coverage)

            # Generate report
            report = self._generate_report(results, start_time)

            # Save history
            self._save_history(report)

            # Send notifications if enabled
            if notify:
                self._send_notifications(report)

            return report

        except Exception as e:
            self.logger.error(f"Error running tests: {str(e)}")
            raise

    def analyze_results(
        self, time_period: Optional[timedelta] = None
    ) -> Dict[str, Any]:
        """Analyze test results over time.

        Args:
            time_period: Time period to analyze

        Returns:
            dict: Analysis results
        """
        history = self._load_history()

        if time_period:
            cutoff = datetime.now() - time_period
            history = [
                h for h in history if datetime.fromisoformat(h["timestamp"]) > cutoff
            ]

        analysis = {
            "total_runs": len(history),
            "success_rate": self._calculate_success_rate(history),
            "test_duration_stats": self._analyze_duration(history),
            "coverage_trends": self._analyze_coverage(history),
            "failure_patterns": self._analyze_failures(history),
            "performance_trends": self._analyze_performance(history),
        }

        return analysis

    def generate_visualizations(
        self, time_period: Optional[timedelta] = None
    ) -> Dict[str, str]:
        """Generate visualizations of test results.

        Args:
            time_period: Time period to visualize

        Returns:
            dict: Paths to generated visualization files
        """
        analysis = self.analyze_results(time_period)
        plots_dir = self.reports_dir / "plots"
        plots_dir.mkdir(exist_ok=True)

        plots = {}

        # Success rate over time
        plots["success_rate"] = self._plot_success_rate(
            analysis["success_rate"], plots_dir
        )

        # Coverage trends
        plots["coverage"] = self._plot_coverage_trends(
            analysis["coverage_trends"], plots_dir
        )

        # Test duration trends
        plots["duration"] = self._plot_duration_trends(
            analysis["test_duration_stats"], plots_dir
        )

        # Failure patterns
        plots["failures"] = self._plot_failure_patterns(
            analysis["failure_patterns"], plots_dir
        )

        return plots

    def _run_parallel_tests(self, test_types: List[str], collect_coverage: bool):
        """Run tests in parallel using thread pool."""
        results = {}

        with ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(
                    self._run_test_type, test_type, collect_coverage
                ): test_type
                for test_type in test_types
            }

            for future in futures:
                test_type = futures[future]
                try:
                    results[test_type] = future.result()
                except Exception as e:
                    self.logger.error(f"Error running {test_type} tests: {str(e)}")
                    results[test_type] = {"status": "error", "error": str(e)}

        return results

    def _run_sequential_tests(self, test_types: List[str], collect_coverage: bool):
        """Run tests sequentially."""
        results = {}

        for test_type in test_types:
            try:
                results[test_type] = self._run_test_type(test_type, collect_coverage)
            except Exception as e:
                self.logger.error(f"Error running {test_type} tests: {str(e)}")
                results[test_type] = {"status": "error", "error": str(e)}

        return results

    def _run_test_type(self, test_type: str, collect_coverage: bool):
        """Run specific type of tests."""
        test_dir = self.base_path / "tests" / test_type

        if not test_dir.exists():
            raise ValueError(f"Test directory not found: {test_dir}")

        # Set up coverage if enabled
        if collect_coverage:
            self.cov.start()

        # Run tests with pytest
        result = pytest.main(
            [
                str(test_dir),
                "-v",
                "--junitxml=" + str(self.reports_dir / f"{test_type}_results.xml"),
            ]
        )

        # Collect coverage if enabled
        coverage_data = None
        if collect_coverage:
            self.cov.stop()
            self.cov.save()
            coverage_data = self.cov.report()

        return {
            "status": "success" if result == 0 else "failure",
            "coverage": coverage_data if collect_coverage else None,
            "timestamp": datetime.now().isoformat(),
        }

    def _generate_report(
        self, results: Dict[str, Any], start_time: datetime
    ) -> Dict[str, Any]:
        """Generate comprehensive test report."""
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        report = {
            "timestamp": end_time.isoformat(),
            "duration": duration,
            "results": results,
            "summary": {
                "total_tests": len(results),
                "successful": sum(
                    1 for r in results.values() if r["status"] == "success"
                ),
                "failed": sum(1 for r in results.values() if r["status"] == "failure"),
                "errors": sum(1 for r in results.values() if r["status"] == "error"),
            },
        }

        # Calculate average coverage if available
        coverages = [
            r["coverage"] for r in results.values() if r["coverage"] is not None
        ]
        if coverages:
            report["summary"]["average_coverage"] = sum(coverages) / len(coverages)

        return report

    def _load_config(self) -> Dict[str, Any]:
        """Load or create test configuration."""
        if self.config_file.exists():
            with open(self.config_file, "r") as f:
                return json.load(f)

        # Default configuration
        config = {
            "notification_email": None,
            "coverage_threshold": 80.0,
            "test_timeout": 300,
            "parallel_execution": True,
            "retry_failed": True,
            "max_retries": 3,
        }

        with open(self.config_file, "w") as f:
            json.dump(config, f, indent=4)

        return config

    def _load_history(self):
        """Load test execution history."""
        if self.history_file.exists():
            with open(self.history_file, "r") as f:
                return json.load(f)
        return []

    def _save_history(self, report: Dict[str, Any]):
        """Save test execution report to history."""
        history = self._load_history()
        history.append(report)

        with open(self.history_file, "w") as f:
            json.dump(history, f, indent=4)

    def _send_notifications(self, report: Dict[str, Any]):
        """Send test results notifications."""
        if not self.config["notification_email"]:
            return

        # Create email message
        msg = MIMEMultipart()
        msg["Subject"] = f"Test Results - {report['timestamp']}"
        msg["From"] = "testing@dojopool.com"
        msg["To"] = self.config["notification_email"]

        # Create HTML content
        template = jinja2.Template(
            """
            <h2>Test Results Summary</h2>
            <p>Timestamp: {{ report.timestamp }}</p>
            <p>Duration: {{ report.duration }} seconds</p>

            <h3>Summary</h3>
            <ul>
                <li>Total Tests: {{ report.summary.total_tests }}</li>
                <li>Successful: {{ report.summary.successful }}</li>
                <li>Failed: {{ report.summary.failed }}</li>
                <li>Errors: {{ report.summary.errors }}</li>
                {% if report.summary.average_coverage %}
                <li>Average Coverage: {{ "%.2f"|format(report.summary.average_coverage) }}%</li>
                {% endif %}
            </ul>

            <h3>Detailed Results</h3>
            {% for test_type, result in report.results.items() %}
            <h4>{{ test_type }}</h4>
            <ul>
                <li>Status: {{ result.status }}</li>
                {% if result.coverage %}
                <li>Coverage: {{ "%.2f"|format(result.coverage) }}%</li>
                {% endif %}
                {% if result.error %}
                <li>Error: {{ result.error }}</li>
                {% endif %}
            </ul>
            {% endfor %}
        """
        )

        html_content = template.render(report=report)
        msg.attach(MIMEText(html_content, "html"))

        # Send email
        with smtplib.SMTP("localhost") as server:
            server.send_message(msg)

    def _calculate_success_rate(
        self, history: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate success rate trends."""
        if not history:
            return {}

        df = pd.DataFrame(
            [
                {
                    "timestamp": h["timestamp"],
                    "success_rate": (
                        h["summary"]["successful"] / h["summary"]["total_tests"] * 100
                    ),
                }
                for h in history
            ]
        )
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        return {
            "overall": float(df["success_rate"].mean()),
            "trend": float(np.polyfit(range(len(df)), df["success_rate"].values, 1)[0]),
            "daily": df.set_index("timestamp")
            .resample("D")["success_rate"]
            .mean()
            .to_dict(),
        }

    def _analyze_duration(self, history: List[Dict[str, Any]]):
        """Analyze test execution duration trends."""
        if not history:
            return {}

        durations = [h["duration"] for h in history]

        return {
            "mean": float(np.mean(durations)),
            "std": float(np.std(durations)),
            "min": float(np.min(durations)),
            "max": float(np.max(durations)),
            "trend": float(np.polyfit(range(len(durations)), durations, 1)[0]),
        }

    def _analyze_coverage(self, history: List[Dict[str, Any]]):
        """Analyze code coverage trends."""
        if not history:
            return {}

        coverages = [
            {
                "timestamp": h["timestamp"],
                "coverage": h["summary"].get("average_coverage"),
            }
            for h in history
            if "average_coverage" in h["summary"]
        ]

        if not coverages:
            return {}

        df = pd.DataFrame(coverages)
        df["timestamp"] = pd.to_datetime(df["timestamp"])

        return {
            "current": float(df["coverage"].iloc[-1]),
            "trend": float(np.polyfit(range(len(df)), df["coverage"].values, 1)[0]),
            "daily": df.set_index("timestamp")
            .resample("D")["coverage"]
            .mean()
            .to_dict(),
        }

    def _analyze_failures(self, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze test failure patterns."""
        if not history:
            return {}

        failures = []
        for h in history:
            for test_type, result in h["results"].items():
                if result["status"] in ["failure", "error"]:
                    failures.append(
                        {
                            "timestamp": h["timestamp"],
                            "test_type": test_type,
                            "error": result.get("error", "Unknown error"),
                        }
                    )

        if not failures:
            return {}

        df = pd.DataFrame(failures)

        return {
            "by_type": df["test_type"].value_counts().to_dict(),
            "common_errors": df["error"].value_counts().head(5).to_dict(),
            "total": len(failures),
        }

    def _analyze_performance(self, history: List[Dict[str, Any]]):
        """Analyze test performance trends."""
        if not history:
            return {}

        df = pd.DataFrame(
            [
                {
                    "timestamp": h["timestamp"],
                    "duration": h["duration"],
                    "total_tests": h["summary"]["total_tests"],
                }
                for h in history
            ]
        )
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df["tests_per_second"] = df["total_tests"] / df["duration"]

        return {
            "mean_tests_per_second": float(df["tests_per_second"].mean()),
            "trend": float(
                np.polyfit(range(len(df)), df["tests_per_second"].values, 1)[0]
            ),
            "daily": df.set_index("timestamp")
            .resample("D")["tests_per_second"]
            .mean()
            .to_dict(),
        }

    def _plot_success_rate(self, success_rate: Dict[str, Any], plots_dir: Path):
        """Plot success rate trends."""
        plt.figure(figsize=(10, 6))
        dates = list(success_rate["daily"].keys())
        rates = list(success_rate["daily"].values())

        plt.plot(dates, rates, marker="o")
        plt.title("Test Success Rate Over Time")
        plt.xlabel("Date")
        plt.ylabel("Success Rate (%)")
        plt.xticks(rotation=45)
        plt.tight_layout()

        plot_path = plots_dir / "success_rate.png"
        plt.savefig(plot_path)
        plt.close()

        return str(plot_path)

    def _plot_coverage_trends(self, coverage: Dict[str, Any], plots_dir: Path):
        """Plot code coverage trends."""
        plt.figure(figsize=(10, 6))
        dates = list(coverage["daily"].keys())
        coverages = list(coverage["daily"].values())

        plt.plot(dates, coverages, marker="o")
        plt.title("Code Coverage Over Time")
        plt.xlabel("Date")
        plt.ylabel("Coverage (%)")
        plt.xticks(rotation=45)
        plt.tight_layout()

        plot_path = plots_dir / "coverage.png"
        plt.savefig(plot_path)
        plt.close()

        return str(plot_path)

    def _plot_duration_trends(
        self, duration_stats: Dict[str, float], plots_dir: Path
    ) -> str:
        """Plot test duration trends."""
        plt.figure(figsize=(10, 6))

        categories = ["Mean", "Min", "Max"]
        values = [duration_stats["mean"], duration_stats["min"], duration_stats["max"]]

        plt.bar(categories, values)
        plt.title("Test Duration Statistics")
        plt.ylabel("Duration (seconds)")
        plt.tight_layout()

        plot_path = plots_dir / "duration.png"
        plt.savefig(plot_path)
        plt.close()

        return str(plot_path)

    def _plot_failure_patterns(self, failures: Dict[str, Any], plots_dir: Path):
        """Plot test failure patterns."""
        if not failures:
            return ""

        plt.figure(figsize=(10, 6))

        types = list(failures["by_type"].keys())
        counts = list(failures["by_type"].values())

        plt.bar(types, counts)
        plt.title("Test Failures by Type")
        plt.xlabel("Test Type")
        plt.ylabel("Number of Failures")
        plt.xticks(rotation=45)
        plt.tight_layout()

        plot_path = plots_dir / "failures.png"
        plt.savefig(plot_path)
        plt.close()

        return str(plot_path)

    def generate_report(
        self, results: Dict[str, Any], report_path: Optional[Path] = None
    ):
        """
        Generate a detailed HTML report from test results.

        Args:
            results: Dictionary containing test results
            report_path: Optional custom path for the report

        Returns:
            Path to the generated report
        """
        if report_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_path = self.results_dir / f"test_report_{timestamp}.html"

        with open(report_path, "w") as f:
            f.write("<html><head><title>Test Report</title></head><body>")
            f.write(f"<h1>Test Report - {results['timestamp']}</h1>")

            if results["status"] == "completed":
                f.write("<h2>Coverage Report</h2>")
                f.write("<pre>")
                for module, coverage in results["coverage"].items():
                    f.write(f"{module}: {coverage:.2f}%\n")
                f.write("</pre>")
            else:
                f.write(f"<h2>Error: {results.get('error', 'Unknown error')}</h2>")

            f.write("</body></html>")

        return report_path

    def get_coverage_report(self) -> Dict[str, float]:
        """
        Get detailed coverage information for each module.

        Returns:
            Dictionary mapping module names to coverage percentages
        """
        coverage_data = {}
        for filename in self.cov.get_data().measured_files():
            file_coverage = self.cov.analysis2(filename)
            total_lines = len(file_coverage[1]) + len(file_coverage[2])
            if total_lines > 0:
                coverage_pct = (len(file_coverage[1]) / total_lines) * 100
                coverage_data[Path(filename).name] = coverage_pct
        return coverage_data

    def get_test_history(self) -> List[Dict[str, Any]]:
        """
        Retrieve history of test runs from stored results.

        Returns:
            List of historical test results
        """
        history = []
        for result_file in self.results_dir.glob("*.json"):
            with open(result_file) as f:
                history.append(json.load(f))
        return sorted(history, key=lambda x: x["timestamp"])

    def compare_results(self, previous_run: str, current_run: str):
        """
        Compare two test runs and generate a diff report.

        Args:
            previous_run: Path or ID of previous test run
            current_run: Path or ID of current test run

        Returns:
            Dictionary containing comparison results
        """
        prev_results = None
        curr_results = None

        # Load previous results
        prev_path = self.results_dir / f"{previous_run}.json"
        if prev_path.exists():
            with open(prev_path) as f:
                prev_results = json.load(f)

        # Load current results
        curr_path = self.results_dir / f"{current_run}.json"
        if curr_path.exists():
            with open(curr_path) as f:
                curr_results = json.load(f)

        if not (prev_results and curr_results):
            raise ValueError("Could not load one or both test results")

        comparison = {
            "timestamp": datetime.now().isoformat(),
            "coverage_diff": {},
            "regression_tests": [],
            "new_passing_tests": [],
        }

        # Compare coverage
        for module in set(prev_results["coverage"].keys()) | set(
            curr_results["coverage"].keys()
        ):
            prev_cov = prev_results["coverage"].get(module, 0)
            curr_cov = curr_results["coverage"].get(module, 0)
            comparison["coverage_diff"][module] = curr_cov - prev_cov

        return comparison

    def send_report_email(self, recipients: List[str], report_path: Path) -> bool:
        """
        Email test report to specified recipients.

        Args:
            recipients: List of email addresses
            report_path: Path to the report file

        Returns:
            Boolean indicating success/failure
        """
        try:
            msg = MIMEMultipart()
            msg["Subject"] = (
                f'Test Report - {datetime.now().strftime("%Y-%m-%d %H:%M")}'
            )
            msg["From"] = "dojopool-testing@example.com"
            msg["To"] = ", ".join(recipients)

            # Attach the report
            with open(report_path) as f:
                attachment = MIMEApplication(f.read(), _subtype="html")
                attachment.add_header(
                    "Content-Disposition", "attachment", filename=report_path.name
                )
                msg.attach(attachment)

            # Add summary in email body
            body = MIMEText("Please find attached the latest test report.")
            msg.attach(body)

            # Send email (configure SMTP settings as needed)
            with smtplib.SMTP("localhost") as s:
                s.send_message(msg)

            return True

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    def plot_metrics(self, metrics: Dict[str, List[float]]) -> None:
        """
        Generate plots for test metrics over time.

        Args:
            metrics: Dictionary mapping metric names to lists of values
        """
        plt.figure(figsize=(12, 6))

        for metric_name, values in metrics.items():
            plt.plot(values, label=metric_name)

        plt.title("Test Metrics Over Time")
        plt.xlabel("Test Run")
        plt.ylabel("Value")
        plt.legend()

        plot_path = self.results_dir / "metrics_plot.png"
        plt.savefig(plot_path)
        plt.close()

    def cleanup_old_reports(self, days_to_keep: int = 30):
        """
        Remove test reports older than specified number of days.

        Args:
            days_to_keep: Number of days to retain reports
        """
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)

        for report_file in self.results_dir.glob("*"):
            if report_file.is_file():
                file_time = datetime.fromtimestamp(report_file.stat().st_mtime)
                if file_time < cutoff_date:
                    try:
                        report_file.unlink()
                        logger.info(f"Deleted old report: {report_file}")
                    except Exception as e:
                        logger.error(f"Failed to delete {report_file}: {str(e)}")
