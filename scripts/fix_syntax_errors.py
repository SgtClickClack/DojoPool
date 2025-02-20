#!/usr/bin/env python3
import os
import re
import sys


def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        contents = f.read()
    original_contents = contents

    # Example fix 1:
    # Fix lines like:
    #     from werkzeug.wrappers import Response as WerkzeugResponse
    # to:
    #     from werkzeug.wrappers import Response as WerkzeugResponse
    pattern = re.compile(r"from\s+werkzeugetattr\([^)]*\)\s+import\s+(.*)")
    contents = re.sub(pattern, r"from werkzeug.wrappers import \1", contents)

    # (Add additional patterns here if needed.)

    if contents != original_contents:
        print(f"[Updated] {filename}")
        with open(filename, "w", encoding="utf-8") as f:
            f.write(contents)


def scan_directory(directory):
    """Recursively scan all .py files in the directory and apply fixes."""
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                fix_file(os.path.join(root, file))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/fix_syntax_errors.py <directory>")
        sys.exit(1)
    target_directory = sys.argv[1]
    print(f"Scanning directory for syntax error fixes: {target_directory}")
    scan_directory(target_directory)
    print("Scan complete.")
