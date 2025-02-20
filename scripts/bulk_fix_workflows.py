#!/usr/bin/env python3
"""
Bulk fix script for workflow security and dependency updates.
"""
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List


def update_python_dependencies() -> None:
    """Update Python dependencies to their latest secure versions."""
    try:
        python_exe = "python"
        # Upgrade pip securely
        subprocess.run(
            [python_exe, "-m", "pip", "install", "--upgrade", "pip"], check=True
        )
        # Install pyyaml securely
        subprocess.run([python_exe, "-m", "pip", "install", "pyyaml"], check=True)

        # Get list of outdated packages
        result = subprocess.run(
            ["pip", "list", "--outdated", "--format=json"],
            capture_output=True,
            text=True,
            check=True,
        )
        outdated = json.loads(result.stdout)

        # Update each package
        for package in outdated:
            subprocess.run(["pip", "install", "--upgrade", package["name"]], check=True)
            print(f"Updated {package['name']} to {package['latest_version']}")
    except subprocess.CalledProcessError as e:
        print(f"Error updating Python dependencies: {e}")
        sys.exit(1)


def update_node_dependencies() -> None:
    """Update Node.js dependencies to their latest secure versions."""
    try:
        # Run npm audit fix
        subprocess.run(["npm", "audit", "fix"], check=True)

        # Update packages with vulnerabilities
        subprocess.run(["npm", "update"], check=True)
        print("Updated Node.js dependencies")
    except subprocess.CalledProcessError as e:
        print(f"Error updating Node.js dependencies: {e}")
        sys.exit(1)


def enhance_workflow_security(workflow_file: Path) :
    """Enhance security configurations in workflow files."""
    try:
        # Read current workflow
        with open(workflow_file, "r") as f:
            content = f.read()

        # Add security best practices
        security_improvements = [
            ("uses: actions/checkout@v2", "uses: actions/checkout@v4"),
            ("uses: actions/setup-node@v2", "uses: actions/setup-node@v4"),
            ("uses: actions/setup-python@v2", "uses: actions/setup-python@v5"),
            ("uses: actions/cache@v2", "uses: actions/cache@v4"),
        ]

        for old, new in security_improvements:
            content = content.replace(old, new)

        # Write updated workflow
        with open(workflow_file, "w") as f:
            f.write(content)

        print(f"Enhanced security for {workflow_file}")
    except Exception as e:
        print(f"Error enhancing workflow security: {e}")
        sys.exit(1)


def main() -> None:
    """Main execution function."""
    # Update dependencies
    print("Updating Python dependencies...")
    update_python_dependencies()

    print("\nUpdating Node.js dependencies...")
    update_node_dependencies()

    # Enhance workflow security
    workflow_dir = Path(".github/workflows")
    if workflow_dir.exists():
        for workflow_file in workflow_dir.glob("*.yml"):
            print(f"\nEnhancing security for {workflow_file}...")
            enhance_workflow_security(workflow_file)

    print("\nBulk fix completed successfully!")


if __name__ == "__main__":
    main()
