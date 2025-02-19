#!/bin/bash
# This script automatically fixes common code issues:
# - Removes unused imports and variables using autoflake.
# - Sorts the imports using isort.
# - Formats code using black.
# - Runs Mypy to display any remaining type errors.

set -e  # Exit immediately if any command fails

echo "Running autoflake to remove unused imports and variables..."
autoflake --in-place --recursive --remove-unused-variables --remove-all-unused-imports .

echo "Running isort to sort imports..."
isort .

echo "Running black to format the code..."
black .

echo "Running mypy for type checking..."
mypy .

echo "Automatic fixing complete!" 