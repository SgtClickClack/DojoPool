#!/bin/bash
# This script runs multiple fixes to handle many errors at once.
# It executes the following individual scripts:
# 1. apply_reorg.sh
# 2. apply_type_stubs.sh
# 3. apply_tests_init.sh
# 4. apply_stub_defs.sh
# 5. rename_auth_decorators.sh
# 6. rename_auth_jwt.sh
# 7. rename_auth_oauth.sh
# 8. rename_auth_password.sh
# 9. rename_auth_totp.sh
# 10. rename_mid_middleware.sh
# 11. rename_route_routes.sh
#
# Usage:
#   From your project root, run:
#       bash scripts/apply_all_fixes.sh

set -e

echo "Starting to apply all fixes..."

# Check and run the reorganization script.
if [ -f "scripts/apply_reorg.sh" ]; then
    echo "Applying project reorganization..."
    bash scripts/apply_reorg.sh
else
    echo "scripts/apply_reorg.sh not found, skipping..."
fi

# Install missing type stubs.
if [ -f "scripts/apply_type_stubs.sh" ]; then
    echo "Installing missing type stubs..."
    bash scripts/apply_type_stubs.sh
else
    echo "scripts/apply_type_stubs.sh not found, skipping..."
fi

# Create __init__.py files in tests directories.
if [ -f "scripts/apply_tests_init.sh" ]; then
    echo "Applying test __init__ creation..."
    bash scripts/apply_tests_init.sh
else
    echo "scripts/apply_tests_init.sh not found, skipping..."
fi

# Apply stub definitions.
if [ -f "scripts/apply_stub_defs.sh" ]; then
    echo "Applying stub definitions..."
    bash scripts/apply_stub_defs.sh
else
    echo "scripts/apply_stub_defs.sh not found, skipping..."
fi

# Run the file renaming scripts to fix invalid filenames.
if [ -f "scripts/rename_auth_decorators.sh" ]; then
    echo "Renaming [AUTH]decorators.py to auth_decorators.py..."
    bash scripts/rename_auth_decorators.sh
else
    echo "scripts/rename_auth_decorators.sh not found, skipping..."
fi

if [ -f "scripts/rename_auth_jwt.sh" ]; then
    echo "Renaming [AUTH]jwt.py to auth_jwt.py..."
    bash scripts/rename_auth_jwt.sh
else
    echo "scripts/rename_auth_jwt.sh not found, skipping..."
fi

if [ -f "scripts/rename_auth_oauth.sh" ]; then
    echo "Renaming [AUTH]oauth.py to auth_oauth.py..."
    bash scripts/rename_auth_oauth.sh
else
    echo "scripts/rename_auth_oauth.sh not found, skipping..."
fi

if [ -f "scripts/rename_auth_password.sh" ]; then
    echo "Renaming [AUTH]password.py to auth_password.py..."
    bash scripts/rename_auth_password.sh
else
    echo "scripts/rename_auth_password.sh not found, skipping..."
fi

if [ -f "scripts/rename_auth_totp.sh" ]; then
    echo "Renaming [AUTH]totp.py to auth_totp.py..."
    bash scripts/rename_auth_totp.sh
else
    echo "scripts/rename_auth_totp.sh not found, skipping..."
fi

if [ -f "scripts/rename_mid_middleware.sh" ]; then
    echo "Renaming [MID]middleware.py to mid_middleware.py..."
    bash scripts/rename_mid_middleware.sh
else
    echo "scripts/rename_mid_middleware.sh not found, skipping..."
fi

if [ -f "scripts/rename_route_routes.sh" ]; then
    echo "Renaming [ROUTE]routes.py to auth_routes.py..."
    bash scripts/rename_route_routes.sh
else
    echo "scripts/rename_route_routes.sh not found, skipping..."
fi

echo "All fixes have been applied!"
echo "Next, please re-run your tests and MyPy to verify the changes." 