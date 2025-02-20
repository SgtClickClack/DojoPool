#!/usr/bin/env python3
import os
import sys
import hashlib


def compute_hash(filename, algorithm="sha256", buf_size=65536):
    """Compute the hash of a file using the specified algorithm."""
    hasher = hashlib.new(algorithm)
    try:
        with open(filename, "rb") as fp:
            while True:
                data = fp.read(buf_size)
                if not data:
                    break
                hasher.update(data)
    except Exception as e:
        print(f"Error reading {filename}: {e}", file=sys.stderr)
        return None
    return hasher.hexdigest()


def find_duplicates(directory):
    # First group files by their file size.
    size_map = {}
    for root, _, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                file_size = os.path.getsize(file_path)
            except FileNotFoundError:
                # Skip files that don't exist.
                continue
            except Exception as e:
                print(f"Error getting size for {file_path}: {e}", file=sys.stderr)
                continue
            size_map.setdefault(file_size, []).append(file_path)

    duplicates = {}
    # For each group of files with the same size, compute hashes.
    for size, file_list in size_map.items():
        if len(file_list) < 2:
            continue  # no duplicates possible
        hash_map = {}
        for file_path in file_list:
            file_hash = compute_hash(file_path)
            if file_hash is None:
                continue
            hash_map.setdefault(file_hash, []).append(file_path)
        # Only record groups with more than one file (duplicates)
        for file_hash, group in hash_map.items():
            if len(group) > 1:
                duplicates.setdefault(file_hash, group)
    return duplicates


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python duplicate_file_script.py <directory>")
        sys.exit(1)
    directory = sys.argv[1]
    print(f"Scanning directory: {directory}")
    duplicates = find_duplicates(directory)
    found = False
    for file_hash, group in duplicates.items():
        if len(group) > 1:
            found = True
            print(f"\nDuplicate files (hash: {file_hash}):")
            for f in group:
                print(f" - {f}")
    if not found:
        print("No duplicate files were found.")
