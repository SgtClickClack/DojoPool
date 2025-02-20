#!/bin/bash
# This script renames [AUTH]totp.py to auth_totp.py in the dojopool/core/auth directory.

old_name="src/dojopool/core/auth/[AUTH]totp.py"
new_name="src/dojopool/core/auth/auth_totp.py"

if [ -f "$old_name" ]; then
    mv "$old_name" "$new_name"
    echo "Renamed $old_name to $new_name"
else
    echo "File $old_name not found; it may have been already renamed."
fi 