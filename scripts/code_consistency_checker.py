import argparse
import os
import subprocess
import sys


def run_command(command, description):
    """
    Run a shell command and capture its output.

    Args:
        command (str): The command to run.
        description (str): Description for logging purposes.

    Returns:
        tuple(bool, str): A tuple with a boolean indicating success and the output string.
    """
    print(f"Running {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
    except Exception as e:
        print(f"Error running {description}: {e}")
        return False, ""

    output = result.stdout + result.stderr
    if result.returncode != 0:
        print(f"{description} reported issues:\n{output}")
        return False, output
    else:
        print(f"{description} passed without issues.\n")
        return True, output


def main():
    parser = argparse.ArgumentParser(
        description="Code Consistency Checker: Run linting and formatting checks on the codebase."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the codebase (default: current directory)",
    )
    args = parser.parse_args()

    root_path = os.path.abspath(args.path)
    os.chdir(root_path)
    print(f"Checking code consistency in: {root_path}\n")

    # Run linting and formatting checks
    success_flake8, _ = run_command("flake8", "flake8 linting")
    success_black, _ = run_command("black --check .", "black formatting check")
    success_isort, _ = run_command("isort --check-only .", "isort import order check")

    if success_flake8 and success_black and success_isort:
        print("All code consistency checks passed!")
        sys.exit(0)
    else:
        print(
            "Some code consistency issues were found. Please review the output above."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
