#!/bin/bash
# This script renames [AUTH]oauth.py to auth_oauth.py in the dojopool/core/auth directory.

old_name="src/dojopool/core/auth/[AUTH]oauth.py"
new_name="src/dojopool/core/auth/auth_oauth.py"

if [ -f "$old_name" ]; then
    mv "$old_name" "$new_name"
    echo "Renamed $old_name to $new_name"
else
    echo "File $old_name not found; it may have been already renamed."
fi 