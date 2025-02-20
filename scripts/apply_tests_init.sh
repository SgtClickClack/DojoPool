#!/bin/bash
# This script ensures that __init__.py files exist in the tests directories,
# which will help resolve duplicate module naming issues with MyPy.

echo "Creating __init__.py in tests/ directory (if not present)..."
# Create __init__.py in tests/ if it doesn't exist.
if [ ! -f "tests/__init__.py" ]; then
    touch tests/__init__.py
    echo "Created tests/__init__.py"
else
    echo "tests/__init__.py already exists."
fi

# Create __init__.py in tests/security/ if it doesn't exist.
if [ ! -d "tests/security" ]; then
    mkdir -p tests/security
fi

if [ ! -f "tests/security/__init__.py" ]; then
    touch tests/security/__init__.py
    echo "Created tests/security/__init__.py"
else
    echo "tests/security/__init__.py already exists."
fi

echo "__init__.py creation complete." 