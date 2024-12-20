#!/bin/bash

# Set environment variables for testing
export FLASK_ENV=testing
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Create test results directory if it doesn't exist
mkdir -p test_results

# Install test dependencies
echo "Installing test dependencies..."
pip install -r tests/requirements-test.txt

# Run linting
echo "Running linting checks..."
flake8 src tests
mypy src tests
black --check src tests

# Run security checks
echo "Running security checks..."
bandit -r src -f json -o test_results/security_report.json
safety check

# Run tests with coverage
echo "Running tests with coverage..."
pytest tests/ \
    --cov=src \
    --cov-report=html:test_results/coverage \
    --cov-report=xml:test_results/coverage.xml \
    --cov-report=term-missing \
    --junitxml=test_results/junit.xml \
    -v \
    --durations=10

# Run performance tests separately
echo "Running performance tests..."
pytest tests/performance/ \
    -v \
    --durations=0 \
    --junitxml=test_results/performance.xml

# Generate test summary
echo "Generating test summary..."
coverage report --fail-under=80

# Check for test failures
if [ $? -eq 0 ]; then
    echo "All tests passed successfully!"
    exit 0
else
    echo "Tests failed! Check test_results directory for details."
    exit 1
fi 