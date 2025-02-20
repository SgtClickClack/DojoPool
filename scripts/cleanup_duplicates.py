import argparse
import hashlib
import os
import sys


def file_hash(filename, hash_algo=hashlib.md5, block_size=65536):
    """
    Compute the hash of a file using the specified hash algorithm.

    Args:
        filename (str): Path to file.
        hash_algo: Hash algorithm from hashlib (default is md5).
        block_size (int): Block size to use for reading file.

    Returns:
        str: Hexadecimal hash of the file.
    """
    hasher = hash_algo()
    try:
        with open(filename, "rb") as f:
            for block in iter(lambda: f.read(block_size), b""):
                hasher.update(block)
    except Exception as e:
        print(f"Error reading file {filename}: {e}")
        return None
    return hasher.hexdigest()


def find_duplicate_files(root_dir):
    """
    Recursively traverse root_dir to find duplicate files based on file hash,
    while excluding known temporary or cache directories.

    Args:
        root_dir (str): Directory to scan.

    Returns:
        dict: Mapping of hash -> list of file paths that share that hash.
    """
    duplicates = {}
    exclude_dirs = {".mypy_cache", "__pycache__", ".git", "node_modules"}
    files_processed = 0

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Filter out excluded directories for traversal
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            hash_val = file_hash(filepath)
            if hash_val is None:
                continue
            duplicates.setdefault(hash_val, []).append(filepath)
            files_processed += 1
            # Print progress every 100 files
            if files_processed % 100 == 0:
                print(f"Processed {files_processed} files...")
    print(f"Finished scanning. Total files processed: {files_processed}")
    return duplicates


def print_duplicates(duplicates):
    """
    Print out groups of duplicate files.

    Args:
        duplicates (dict): Mapping of file hash to file paths.
    """
    found = False
    for hash_val, files in duplicates.items():
        if len(files) > 1:
            found = True
            print(f"\n[Duplicate Group] Hash: {hash_val}")
            for file in files:
                print(f"  - {file}")
    if not found:
        print("No duplicate files were found.")


def delete_duplicates(duplicates):
    """
    Delete all duplicate files, keeping one copy per duplicate group.

    Args:
        duplicates (dict): Mapping of file hash to file paths.

    Returns:
        int: Total number of files deleted.
    """
    total_deleted = 0
    for hash_val, files in duplicates.items():
        if len(files) > 1:
            # Keep the first file and delete the rest.
            keep_file = files[0]
            duplicate_files = files[1:]
            for dup in duplicate_files:
                try:
                    os.remove(dup)
                    print(f"Deleted duplicate: {dup}")
                    total_deleted += 1
                except Exception as e:
                    print(f"Error deleting {dup}: {e}")
    return total_deleted


def main():
    parser = argparse.ArgumentParser(
        description="Detect and optionally delete duplicate files in the codebase."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the root directory of the codebase (default: current directory).",
    )
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Automatically delete duplicate files after confirmation.",
    )
    args = parser.parse_args()

    root_dir = os.path.abspath(args.path)
    print(f"Scanning directory: {root_dir}")

    duplicates = find_duplicate_files(root_dir)
    print_duplicates(duplicates)

    if args.delete:
        if any(len(files) > 1 for files in duplicates.values()):
            confirmation = (
                input("\nDo you want to delete all duplicates? (yes/no): ")
                .strip()
                .lower()
            )
            if confirmation.lower().strip() in ("y", "yes"):
                total = delete_duplicates(duplicates)
                print(f"\nTotal duplicates deleted: {total}")
            else:
                print("Deletion cancelled by user.")
        else:
            print("No duplicates to delete.")


if __name__ == "__main__":
    main()
