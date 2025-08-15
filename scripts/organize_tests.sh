#!/bin/bash

# Create main tests directory if it doesn't exist
mkdir -p tests

# Move files from test/ to tests/unit/
mkdir -p tests/unit
mv test/* tests/unit/ 2>/dev/null || true

# Move files from __tests__/ to tests/integration/
mkdir -p tests/integration
mv __tests__/* tests/integration/ 2>/dev/null || true

# Move files from __mocks__/ to tests/mocks/
mkdir -p tests/mocks
mv __mocks__/* tests/mocks/ 2>/dev/null || true

# Remove empty directories
rmdir test 2>/dev/null || true
rmdir __tests__ 2>/dev/null || true
rmdir __mocks__ 2>/dev/null || true

echo "Test directories have been consolidated into tests/" 