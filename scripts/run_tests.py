#!/usr/bin/env python
"""Test runner script for local development.

This script sets up the test environment and runs the test suite with
the same configuration used in CI.
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

def setup_test_environment():
    """Set up test environment variables."""
    os.environ.update({
        'FLASK_ENV': 'testing',
        'DATABASE_URL': 'postgresql://postgres:postgres@localhost:5432/test_db',
        'REDIS_URL': 'redis://localhost:6379/1',
        'SECRET_KEY': 'test-secret-key',
        'JWT_SECRET_KEY': 'test-jwt-secret'
    })

def run_tests(test_type: str, coverage: bool = True, parallel: bool = False):
    """Run the specified test suite.
    
    Args:
        test_type: Type of tests to run (unit, integration, performance, or all)
        coverage: Whether to generate coverage reports
        parallel: Whether to run tests in parallel
    """
    pytest_args = ['-v']
    
    if coverage:
        pytest_args.extend(['--cov=src', '--cov-report=term-missing', '--cov-report=html'])
    
    if parallel:
        pytest_args.extend(['-n', 'auto'])
    
    if test_type == 'all':
        test_path = 'tests'
    else:
        test_path = f'tests/{test_type}'
    
    cmd = ['pytest'] + pytest_args + [test_path]
    return subprocess.run(cmd).returncode

def run_linters():
    """Run code quality checks."""
    print("\nRunning code quality checks...")
    
    linters = [
        ['flake8', 'src', 'tests'],
        ['black', '--check', 'src', 'tests'],
        ['isort', '--check-only', 'src', 'tests'],
        ['mypy', 'src']
    ]
    
    for cmd in linters:
        print(f"\nRunning {cmd[0]}...")
        result = subprocess.run(cmd)
        if result.returncode != 0:
            return result.returncode
    
    return 0

def run_security_checks():
    """Run security checks."""
    print("\nRunning security checks...")
    
    checks = [
        ['bandit', '-r', 'src'],
        ['safety', 'check']
    ]
    
    for cmd in checks:
        print(f"\nRunning {cmd[0]}...")
        result = subprocess.run(cmd)
        if result.returncode != 0:
            return result.returncode
    
    return 0

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Run test suite')
    parser.add_argument(
        'test_type',
        choices=['unit', 'integration', 'performance', 'all'],
        help='Type of tests to run'
    )
    parser.add_argument(
        '--no-coverage',
        action='store_true',
        help='Disable coverage reporting'
    )
    parser.add_argument(
        '--parallel',
        action='store_true',
        help='Run tests in parallel'
    )
    parser.add_argument(
        '--lint',
        action='store_true',
        help='Run linters'
    )
    parser.add_argument(
        '--security',
        action='store_true',
        help='Run security checks'
    )
    
    args = parser.parse_args()
    
    # Set up environment
    setup_test_environment()
    
    # Run linters if requested
    if args.lint:
        result = run_linters()
        if result != 0:
            sys.exit(result)
    
    # Run security checks if requested
    if args.security:
        result = run_security_checks()
        if result != 0:
            sys.exit(result)
    
    # Run tests
    result = run_tests(
        args.test_type,
        coverage=not args.no_coverage,
        parallel=args.parallel
    )
    
    sys.exit(result)

if __name__ == '__main__':
    main() 