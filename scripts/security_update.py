#!/usr/bin/env python3
import argparse
import secrets
import sys
from datetime import datetime
from pathlib import Path


def generate_secret_key(length=50):
    """Generate a secure secret key."""
    return secrets.token_urlsafe(length)


def backup_env_file(env_path):
    """Create a backup of the environment file."""
    if env_path.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = env_path.parent / f"{env_path.name}.{timestamp}.bak"
        env_path.rename(backup_path)
        print(f"Created backup: {backup_path}")


def update_env_file(template_path, env_path):
    """Update environment file with new secrets."""
    if not template_path.exists():
        print(f"Error: Template file {template_path} not found")
        return False

    # Read template
    with open(template_path) as f:
        content = f.read()

    # Generate new secrets
    replacements = {
        "your_secret_key_here": generate_secret_key(),
        "your_csrf_secret_key": generate_secret_key(),
        "your_db_password": generate_secret_key(20),
    }

    # Replace placeholders
    for key, value in replacements.items():
        content = content.replace(key, value)

    # Backup existing file
    backup_env_file(env_path)

    # Write new file
    with open(env_path, "w") as f:
        f.write(content)

    print(f"Updated {env_path} with new secrets")
    return True


def main():
    parser = argparse.ArgumentParser(description="Security update utility")
    parser.add_argument("--env", help="Path to .env file", default=".env")
    parser.add_argument(
        "--template", help="Path to template file", default=".env.template"
    )
    args = parser.parse_args()

    env_path = Path(args.env)
    template_path = Path(args.template)

    if update_env_file(template_path, env_path):
        print("Security update completed successfully")
    else:
        print("Security update failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
