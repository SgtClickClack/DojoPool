#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Install test dependencies
echo "Installing test dependencies..."
python -m pip install -r test-requirements.txt

# Run tests with coverage
echo -e "\nRunning tests with coverage..."
python -m pytest src/core/matchmaking/tests/run_tests.py -v --cov=src/core/matchmaking --cov-report=term-missing --cov-report=html

# Check test result
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed successfully!${NC}"
    
    # Open coverage report
    echo -e "\nOpening coverage report..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open coverage_html_report/index.html
    else
        # Linux
        xdg-open coverage_html_report/index.html
    fi
else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
fi
