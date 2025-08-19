"""Test runner for matchmaking tests.

This script runs all tests for the matchmaking module and generates coverage reports.
"""

import os
import sys

import pytest


def main():
    """Run all matchmaking tests."""
    # Add src directory to Python path
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    if src_dir not in sys.path:
        sys.path.insert(0, src_dir)

    # Configure test arguments
    args = [
        # Test files
        os.path.dirname(__file__),
        # Verbosity
        "-v",
        # Show local variables in tracebacks
        "--showlocals",
        # Show slow tests
        "--durations=5",
        # Run coverage
        "--cov=src/core/matchmaking",
        # Coverage report formats
        "--cov-report=term-missing",
        "--cov-report=html:coverage_html_report",
        # Fail if coverage is below 90%
        "--cov-fail-under=90",
        # Parallel execution
        "-n",
        "auto",
        # Randomize test order
        "--randomly-seed=1234",
        # Set timeout
        "--timeout=30",
        # Show warnings
        "-W",
        "error",
    ]

    # Run tests
    return pytest.main(args)


if __name__ == "__main__":
    sys.exit(main())
