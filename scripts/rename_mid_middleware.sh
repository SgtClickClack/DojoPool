#!/bin/bash
# This script renames [MID]middleware.py to mid_middleware.py in the dojopool/core/auth directory.

old_name="src/dojopool/core/auth/[MID]middleware.py"
new_name="src/dojopool/core/auth/mid_middleware.py"

if [ -f "$old_name" ]; then
    mv "$old_name" "$new_name"
    echo "Renamed $old_name to $new_name"
else
    echo "File $old_name not found; it may have already been renamed."
fi 