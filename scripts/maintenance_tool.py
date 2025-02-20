import argparse
import hashlib
import logging
import logging.handlers
import os

# Setup logging to both file and console using a rotating file handler.
logger = logging.getLogger()
logger.setLevel(logging.INFO)
console_handler = logging.StreamHandler()
console_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

rotating_handler = logging.handlers.TimedRotatingFileHandler(
    "maintenance.log", when="midnight", backupCount=7
)
rotating_handler.setFormatter(console_formatter)
logger.addHandler(rotating_handler)


def file_hash(filename, hash_algo=hashlib.md5, block_size=65536):
    """
    Compute the hash of a file using the specified hash algorithm.
    """
    hasher = hash_algo()
    try:
        with open(filename, "rb") as f:
            for block in iter(lambda: f.read(block_size), b""):
                hasher.update(block)
    except Exception as e:
        logging.error("Error reading file %s: %s", filename, e)
        return None
    return hasher.hexdigest()


def find_duplicate_files(root_dir):
    """
    Recursively traverse root_dir to find duplicate files based on file hash,
    while excluding temporary/cache directories.
    """
    duplicates = {}
    exclude_dirs = {".mypy_cache", "__pycache__", ".git", "node_modules"}
    files_processed = 0

    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            hash_val = file_hash(filepath)
            if hash_val is None:
                continue
            duplicates.setdefault(hash_val, []).append(filepath)
            files_processed += 1
            if files_processed % 100 == 0:
                logging.info("Processed %d files...", files_processed)
    logging.info(
        "Finished scanning duplicates. Total files processed: %d", files_processed
    )
    return duplicates


def print_duplicates(duplicates):
    """
    Print out groups of duplicate files.
    """
    found = False
    for hash_val, files in duplicates.items():
        if len(files) > 1:
            found = True
            logging.info("[Duplicate Group] Hash: %s", hash_val)
            for file in files:
                logging.info("  - %s", file)
    if not found:
        logging.info("No duplicate files were found.")


def delete_duplicates(duplicates, dry_run=False):
    """
    Delete duplicate files (keeping one copy per group) or preview deletion if dry_run is True.
    """
    total_deleted = 0
    for hash_val, files in duplicates.items():
        if len(files) > 1:
            # Keep the first file and process the rest.
            for dup in files[1:]:
                if dry_run:
                    logging.info("[Dry-run] Would delete duplicate: %s", dup)
                    total_deleted += 1
                else:
                    try:
                        os.remove(dup)
                        logging.info("Deleted duplicate: %s", dup)
                        total_deleted += 1
                    except Exception as e:
                        logging.error("Error deleting %s: %s", dup, e)
    return total_deleted


def find_temp_files(root_dir, extensions):
    """
    Recursively traverse root_dir to find files with specified extensions.
    """
    temp_files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if any(filename.lower().endswith(ext) for ext in extensions):
                temp_files.append(os.path.join(dirpath, filename))
    return temp_files


def print_temp_files(files):
    """
    Print out the temporary files found.
    """
    if files:
        logging.info("Found the following temporary files:")
        for f in files:
            logging.info("  - %s", f)
    else:
        logging.info("No temporary files found.")


def delete_temp_files(temp_files, dry_run=False):
    """
    Delete temporary files or preview deletion if dry_run is True.
    """
    count_deleted = 0
    for f in temp_files:
        if dry_run:
            logging.info("[Dry-run] Would delete temporary file: %s", f)
            count_deleted += 1
        else:
            try:
                os.remove(f)
                logging.info("Deleted temporary file: %s", f)
                count_deleted += 1
            except Exception as e:
                logging.error("Error deleting %s: %s", f, e)
    return count_deleted


def duplicates_mode(args):
    """
    Run duplicate file maintenance.
    """
    root_dir = os.path.abspath(args.path)
    logging.info("Scanning for duplicate files in: %s", root_dir)
    duplicates = find_duplicate_files(root_dir)
    if args.delete:
        if any(len(files) > 1 for files in duplicates.values()):
            confirmation = (
                input("Do you want to delete all duplicates? (yes/y to confirm): ")
                .strip()
                .lower()
            )
            if confirmation in ("y", "yes"):
                total = delete_duplicates(duplicates, dry_run=args.dry_run)
                logging.info(
                    "Total duplicates %s: %d",
                    "to be deleted (dry-run)" if args.dry_run else "deleted",
                    total,
                )
            else:
                logging.info("Deletion cancelled by user.")
        else:
            logging.info("No duplicates to delete.")
    else:
        print_duplicates(duplicates)


def temp_mode(args):
    """
    Run temporary file maintenance.
    """
    root_dir = os.path.abspath(args.path)
    logging.info("Scanning for temporary files in: %s", root_dir)
    # Define the target file extensions for temporary files.
    target_extensions = {".tmp", ".bak", ".old", ".log"}
    temp_files = find_temp_files(root_dir, target_extensions)
    if args.delete:
        if temp_files:
            confirmation = (
                input(
                    "Do you want to delete all temporary files found? (yes/y to confirm): "
                )
                .strip()
                .lower()
            )
            if confirmation in ("y", "yes"):
                deleted = delete_temp_files(temp_files, dry_run=args.dry_run)
                logging.info(
                    "Total temporary files %s: %d",
                    "to be deleted (dry-run)" if args.dry_run else "deleted",
                    deleted,
                )
            else:
                logging.info("Deletion cancelled by user.")
        else:
            logging.info("No temporary files to delete.")
    else:
        print_temp_files(temp_files)


def main():
    parser = argparse.ArgumentParser(
        description="Unified Maintenance Tool: Clean up duplicate and temporary files from your project."
    )
    subparsers = parser.add_subparsers(dest="mode", help="Maintenance mode to execute.")

    # Global option for dry-run mode
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform a dry run without actually deleting any files.",
    )

    # Subparser for duplicate file cleanup.
    duplicates_parser = subparsers.add_parser(
        "duplicates", help="Cleanup duplicate files."
    )
    duplicates_parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the root directory (default: current directory).",
    )
    duplicates_parser.add_argument(
        "--delete",
        action="store_true",
        help="Automatically delete duplicate files after confirmation.",
    )
    duplicates_parser.set_defaults(func=duplicates_mode)

    # Subparser for temporary file cleanup.
    temp_parser = subparsers.add_parser("temp", help="Cleanup temporary files.")
    temp_parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the root directory (default: current directory).",
    )
    temp_parser.add_argument(
        "--delete",
        action="store_true",
        help="Automatically delete temporary files after confirmation.",
    )
    temp_parser.set_defaults(func=temp_mode)

    args = parser.parse_args()
    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
