#!/usr/bin/env python3
import os
import sys
import hashlib
import argparse


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
    # Define directories to exclude (case-insensitive match).
    excludes = {"git-secrets", "node_modules", ".mypy_cache"}

    for root, dirs, files in os.walk(directory):
        # Filter out directories that we want to exclude.
        dirs[:] = [
            d for d in dirs if d.lower() not in excludes and not d.startswith(".")
        ]
        for file in files:
            file_path = os.path.join(root, file)
            try:
                file_size = os.path.getsize(file_path)
            except FileNotFoundError:
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


def delete_duplicates(duplicates, dry_run=True):
    """
    Delete duplicate files from each duplicate group, keeping the first file.
    Returns a list of deleted files.
    """
    deleted_files = []
    for file_hash, files in duplicates.items():
        keeper = files[0]  # Keep the first file in the group
        duplicates_to_delete = files[1:]
        print(f"\nKeeping: {keeper}")
        for f in duplicates_to_delete:
            print(f"Deleting: {f}")
            if not dry_run:
                try:
                    os.remove(f)
                    deleted_files.append(f)
                except Exception as e:
                    print(f"Error deleting {f}: {e}", file=sys.stderr)
    return deleted_files


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scan a directory for duplicate files and optionally delete them."
    )
    parser.add_argument("directory", help="The directory to scan for duplicates.")
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Actually delete duplicates. Without this flag, the script performs a dry run.",
    )
    args = parser.parse_args()

    directory = args.directory
    print(f"Scanning directory: {directory}")
    duplicates = find_duplicates(directory)
    if not duplicates:
        print("No duplicate files found.")
        sys.exit(0)

    print("\nDuplicate File Groups Found:")
    for file_hash, files in duplicates.items():
        print(f"\nHash: {file_hash}")
        for f in files:
            print(f" - {f}")

    if args.delete:
        confirm = input(
            "\nAre you sure you want to delete all duplicates (keeping the first file in each group)? (yes/no): "
        )
        if confirm.lower() != "yes":
            print("Aborting deletion.")
            sys.exit(0)
        deleted_files = delete_duplicates(duplicates, dry_run=False)
        print("\nDeletion complete. Deleted files:")
        for f in deleted_files:
            print(f" - {f}")
    else:
        print(
            "\nDry run complete. No files have been deleted. Run the script with the '--delete' flag to delete duplicates."
        )
