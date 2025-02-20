#!/usr/bin/env python3
import subprocess
import sys


def run_command(command):
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True)
    if result.returncode != 0:
        print(f"Command failed: {command}")
        sys.exit(result.returncode)


if __name__ == "__main__":
    # Make sure you have isort and black installed in your environment.
    # For example:
    #   pip install isort black
    print("Auto-formatting your project code...")

    # Format imports
    run_command("isort src tests")

    # Format code with Black
    run_command("black src tests")

    print("Auto-formatting complete!")
