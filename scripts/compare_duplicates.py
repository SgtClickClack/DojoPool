#!/usr/bin/env python3
import os
import sys
import hashlib
import argparse
import datetime


def compute_hash(filename, algorithm="sha256", buf_size=65536):
    """Compute and return the hash of a file using the specified algorithm."""
    hasher = hashlib.new(algorithm)
    try:
        with open(filename, "rb") as f:
            while True:
                buf = f.read(buf_size)
                if not buf:
                    break
                hasher.update(buf)
    except Exception as e:
        print(f"Error reading {filename}: {e}", file=sys.stderr)
        return None
    return hasher.hexdigest()


def find_duplicates(directory):
    """Find duplicate files by grouping by file size and then by file hash.
    Skips directories that are commonly problematic."""
    size_map = {}
    excludes = {"git-secrets", "node_modules", ".mypy_cache"}
    for root, dirs, files in os.walk(directory):
        # Exclude directories that match our excludes or are hidden.
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
    # For each file size group, compute hashes if there are at least two files.
    for size, files in size_map.items():
        if len(files) < 2:
            continue
        hash_map = {}
        for file_path in files:
            file_hash = compute_hash(file_path)
            if file_hash is None:
                continue
            hash_map.setdefault(file_hash, []).append(file_path)
        for file_hash, group in hash_map.items():
            if len(group) > 1:
                duplicates.setdefault(file_hash, group)
    return duplicates


def process_duplicates(duplicates, auto=False, dry_run=True):
    """Interactively compare duplicates and choose which file to keep.
    If auto is True, automatically chooses the file with the most recent modification date.
    """
    for file_hash, group in duplicates.items():
        print("\nDuplicate group (hash: {}):".format(file_hash))
        info = []
        for idx, file_path in enumerate(group):
            try:
                stat = os.stat(file_path)
                mod_time = stat.st_mtime
                size = stat.st_size
                mod_time_str = datetime.datetime.fromtimestamp(mod_time).strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                info.append((idx, file_path, mod_time, size, mod_time_str))
            except Exception as e:
                print(f"Error reading info for {file_path}: {e}")
                info.append((idx, file_path, 0, 0, "N/A"))
        # Sort files by modification time descending (most recent first)
        info_sorted = sorted(info, key=lambda t: t[2], reverse=True)
        print("Files in group:")
        for tup in info_sorted:
            idx, fpath, mod_time, size, mod_time_str = tup
            print(f" [{idx}] {fpath} | Modified: {mod_time_str} | Size: {size} bytes")
        # Default choice: the file with the most recent modification time.
        default_idx = info_sorted[0][0]
        if auto:
            chosen_idx = default_idx
            print(f"Automatically selecting file [{chosen_idx}] to keep (most recent).")
        else:
            try:
                inp = input(
                    f"Select file index to keep (default: {default_idx}): "
                ).strip()
            except KeyboardInterrupt:
                print("Exiting.")
                sys.exit(0)
            if inp == "":
                chosen_idx = default_idx
            else:
                try:
                    chosen_idx = int(inp)
                except ValueError:
                    print(f"Invalid input. Defaulting to {default_idx}.")
                    chosen_idx = default_idx

        # Determine the chosen file.
        keeper = None
        for tup in info:
            if tup[0] == chosen_idx:
                keeper = tup[1]
                break
        if keeper is None:
            print("Could not determine which file to keep; skipping this group.")
            continue
        print("Keeping:", keeper)
        for tup in info:
            idx, fpath, _, _, _ = tup
            if idx != chosen_idx:
                print("Deleting:", fpath)
                if not dry_run:
                    try:
                        os.remove(fpath)
                    except Exception as e:
                        print(f"Error deleting {fpath}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Interactive duplicate file compare script. "
        "For each group of duplicate files, choose which one to keep."
    )
    parser.add_argument("directory", help="Directory to scan for duplicate files.")
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Automatically select the most recent file to keep.",
    )
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Actually delete duplicates (dry run if not specified).",
    )
    args = parser.parse_args()

    print(f"Scanning directory: {args.directory}")
    duplicates = find_duplicates(args.directory)
    if not duplicates:
        print("No duplicate files found.")
        sys.exit(0)

    if args.delete:
        print("Deletion mode enabled. Files will be deleted as per your selection.")
    else:
        print(
            "Dry run mode: no files will be deleted. Use --delete to actually remove files."
        )

    process_duplicates(duplicates, auto=args.auto, dry_run=not args.delete)
