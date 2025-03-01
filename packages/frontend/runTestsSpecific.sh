#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==== Running DojoPool Frontend Tests ====${NC}"
echo -e "${YELLOW}==== $(date) ====${NC}"
echo ""

# Run tests with npx to ensure we use the local jest installation
echo -e "${YELLOW}Running tests with ts-jest preset...${NC}"
npx jest --preset=ts-jest --testEnvironment=jsdom

# Check if all tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
else
  echo -e "${RED}Some tests failed. See above for details.${NC}"
fi

echo ""
echo -e "${YELLOW}==== Test Run Complete ====${NC}"
echo -e "${YELLOW}==== $(date) ====${NC}" 