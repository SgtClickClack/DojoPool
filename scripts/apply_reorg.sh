#!/bin/bash
# This script reorganizes the project structure by:
#   1. Ensuring the `src/` directory exists.
#   2. Moving the `dojopool` package from the project root into `src/` (if necessary).
#   3. Updating all Python import statements to remove the `src.` prefix for `dojopool` imports.
#
# Usage: From the project root, run:
#   bash scripts/apply_reorg.sh

set -e

echo "Starting project reorganization..."

# 1. Ensure the 'src' directory exists.
if [ ! -d "src" ]; then
    echo "'src' directory not found. Creating 'src' directory..."
    mkdir src
fi

# 2. Move 'dojopool' package to 'src' if it's in the project root.
if [ -d "src/dojopool" ]; then
    echo "'src/dojopool' already exists. Skipping move."
elif [ -d "dojopool" ]; then
    echo "Moving 'dojopool' package to 'src/' directory..."
    mv dojopool src/
else
    echo "ERROR: 'dojopool' package not found in the project root."
    exit 1
fi

# 3. Update Python import statements in all .py files.
echo "Updating Python import statements to remove 'src.' prefix for dojopool imports..."
# For GNU sed:
if sed --version >/dev/null 2>&1; then
    find . -type f -name "*.py" -exec sed -i 's/from src\.dojopool/from dojopool/g' {} +
    find . -type f -name "*.py" -exec sed -i 's/import src\.dojopool/import dojopool/g' {} +
else
    # For BSD sed (e.g., on macOS):
    find . -type f -name "*.py" -exec sed -i '' 's/from src\.dojopool/from dojopool/g' {} +
    find . -type f -name "*.py" -exec sed -i '' 's/import src\.dojopool/import dojopool/g' {} +
fi

echo "Project reorganization complete!"
echo "Next steps: Review the changes, then run 'mypy .' and your test suite to ensure everything works as expected." 