import argparse
import os


def find_temp_files(root_dir, extensions):
    """
    Recursively traverse root_dir to find files with specified extensions.

    Args:
        root_dir (str): Directory to scan.
        extensions (set): Set of file extensions to consider as temporary files.

    Returns:
        list: A list of file paths matching the extensions.
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

    Args:
        files (list): List of file paths.
    """
    if files:
        print("Found the following temporary files:")
        for f in files:
            print(f"  - {f}")
    else:
        print("No temporary files found.")


def delete_temp_files(temp_files):
    """
    Delete temporary files.

    Args:
        temp_files (list): List of file paths to delete.

    Returns:
        int: Number of files deleted.
    """
    count_deleted = 0
    for f in temp_files:
        try:
            os.remove(f)
            print(f"Deleted: {f}")
            count_deleted += 1
        except Exception as e:
            print(f"Error deleting {f}: {e}")
    return count_deleted


def main():
    parser = argparse.ArgumentParser(
        description="Detect and optionally delete temporary files (e.g., .tmp, .bak, .old, .log) in the codebase."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the root directory (default: current directory).",
    )
    parser.add_argument(
        "--delete",
        action="store_true",
        help="Automatically delete the temporary files after confirmation.",
    )
    args = parser.parse_args()

    root_dir = os.path.abspath(args.path)
    print(f"Scanning for temporary files in directory: {root_dir}")

    # Define the target file extensions to search for
    target_extensions = {".tmp", ".bak", ".old", ".log"}
    temp_files = find_temp_files(root_dir, target_extensions)
    print_temp_files(temp_files)

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
                deleted = delete_temp_files(temp_files)
                print(f"\nTotal temporary files deleted: {deleted}")
            else:
                print("Deletion cancelled by user.")
        else:
            print("No temporary files to delete.")


if __name__ == "__main__":
    main()
