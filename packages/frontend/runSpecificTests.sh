#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==== Running DojoPool Frontend Wallet & Tournament Tests ====${NC}"
echo -e "${YELLOW}==== $(date) ====${NC}"
echo ""

# Run only our specific tests
echo -e "${YELLOW}Running tests for wallet and tournament components...${NC}"

# Run specific tests with explicit config
npx jest "src/tests/(useWallet|crossChainTournamentService|TournamentRegistration)" --config=jest.config.js

# Check if all tests passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
else
  echo -e "${RED}Some tests failed. See above for details.${NC}"
fi

echo ""
echo -e "${YELLOW}==== Test Run Complete ====${NC}"
echo -e "${YELLOW}==== $(date) ====${NC}" 