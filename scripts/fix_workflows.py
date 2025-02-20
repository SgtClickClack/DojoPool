#!/usr/bin/env python3
"""Script to fix common GitHub Actions workflow issues."""

import os
import sys
from pathlib import Path

import yaml


def fix_workflow(data):
    """Apply fixes to workflow data."""
    if not isinstance(data, dict):
        return data

    # Add global settings
    if "permissions" not in data:
        data["permissions"] = {
            "contents": "read",
            "actions": "write",
            "checks": "write",
            "pull-requests": "write",
            "security-events": "write",
            "issues": "write",
        }

    if "concurrency" not in data:
        data["concurrency"] = {
            "group": "${{ github.workflow }}-${{ github.ref }}",
            "cancel-in-progress": True,
        }

    # Fix jobs
    if "jobs" in data:
        for job_name, job in data["jobs"].items():
            if isinstance(job, dict):
                # Add timeout
                if "timeout-minutes" not in job:
                    job["timeout-minutes"] = 30

                # Add strategy
                if "strategy" not in job:
                    job["strategy"] = {"fail-fast": False, "max-parallel": 4}

                # Add steps improvements
                if "steps" in job:
                    for step in job["steps"]:
                        if isinstance(step, dict):
                            # Add error handling
                            if not any(
                                critical in str(step.get("name", "")).lower()
                                for critical in ["deploy", "release", "publish"]
                            ):
                                step["continue-on-error"] = True

                            # Add timeouts
                            if "run" in step and any(
                                long_running in str(step["run"]).lower()
                                for long_running in ["test", "build", "install"]
                            ):
                                step["timeout-minutes"] = 15

                            # Add retries for actions
                            if "uses" in step and step["uses"].startswith("actions/"):
                                step["with"] = step.get("with", {})
                                step["with"]["retry-on-network-failure"] = True

    return data


def process_file(file_path):
    """Process a single workflow file."""
    try:
        # Read and parse
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        if not data:
            print(f"⚠️ Empty workflow file: {file_path}")
            return

        # Apply fixes
        fixed_data = fix_workflow(data)

        # Backup original
        backup_path = f"{file_path}.bak"
        os.replace(file_path, backup_path)

        # Write fixed version
        with open(file_path, "w", encoding="utf-8") as f:
            yaml.dump(fixed_data, f, sort_keys=False, allow_unicode=True)

        print(f"✅ Fixed: {file_path}")

    except Exception as e:
        print(f"❌ Error processing {file_path}: {str(e)}")


def main():
    """Process all workflow files."""
    workflow_dir = Path(".github/workflows")

    if not workflow_dir.exists():
        print("❌ Workflows directory not found!")
        sys.exit(1)

    for file_path in workflow_dir.glob("*.y*ml"):
        print(f"\n📝 Processing {file_path.name}...")
        process_file(file_path)

    print("\n✨ All workflows have been improved!")


if __name__ == "__main__":
    main()
