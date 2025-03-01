#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==== Running DojoPool Frontend Tests ====${NC}"
echo -e "${YELLOW}==== $(date) ====${NC}"
echo ""

# Install dependencies if needed
if [ "$1" == "--install" ] || [ "$1" == "-i" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
  echo ""
fi

# Run all tests
echo -e "${YELLOW}Running all tests...${NC}"
npm test

# Check if all tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
else
  echo -e "${RED}Some tests failed. See above for details.${NC}"
fi

# Run with coverage if requested
if [ "$1" == "--coverage" ] || [ "$1" == "-c" ]; then
  echo -e "${YELLOW}Running tests with coverage...${NC}"
  npm run test:coverage
  echo -e "${YELLOW}Coverage report generated in coverage/ directory${NC}"
fi

echo ""
echo -e "${YELLOW}==== Test Run Complete ====${NC}"
echo -e "${YELLOW}==== $(date) ====${NC}" 