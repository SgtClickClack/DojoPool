#!/usr/bin/env python3
"""
Scheduler for automated security report generation.
This script sets up automated scheduling of security reports.
"""

import argparse
import ctypes
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("security_scheduler.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def is_admin() -> bool:
    """Check if the script is running with administrator privileges."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def create_windows_task() -> None:
    """Create a Windows scheduled task for security report generation."""
    if not is_admin():
        logger.error("This script must be run as administrator to create system tasks")
        print("\nPlease follow these steps to schedule the security report:")
        print("1. Open Command Prompt as Administrator")
        print("2. Navigate to the project directory")
        print(f"3. Run: {sys.executable} {Path(__file__).resolve()} --platform windows")
        sys.exit(1)

    try:
        script_path = Path(__file__).parent / "generate_security_report.py"
        python_path = sys.executable
        
        # Create the task command
        task_command = (
            f'schtasks /create /tn "DojoPool\\SecurityReport" '
            f'/tr "\\""{python_path}\\"" \\""{ script_path.resolve()}\\"" " '
            '/sc DAILY /st 00:00 /ru SYSTEM /f'
        )
        
        # Execute the command
        result = os.system(task_command)
        
        if result == 0:
            logger.info("Successfully created Windows scheduled task")
            print("\nSecurity report task has been scheduled successfully!")
            print("The report will be generated daily at midnight")
            print(f"Reports will be saved in: {Path.cwd() / 'reports' / 'security'}")
        else:
            logger.error("Failed to create Windows scheduled task")
            print("\nFailed to create the scheduled task. Please ensure you have administrator privileges.")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Error creating Windows scheduled task: {e}")
        sys.exit(1)

def create_linux_cron() -> None:
    """Create a Linux cron job for security report generation."""
    try:
        script_path = Path(__file__).parent / "generate_security_report.py"
        python_path = sys.executable
        
        # Create the cron entry
        cron_command = f"0 0 * * * {python_path} {script_path}\n"
        
        # Add to crontab
        temp_cron = "/tmp/security_report_cron"
        os.system(f"crontab -l > {temp_cron} 2>/dev/null || true")
        
        with open(temp_cron, "a") as f:
            f.write(cron_command)
            
        os.system(f"crontab {temp_cron}")
        os.remove(temp_cron)
        
        logger.info("Successfully created Linux cron job")
        print("\nSecurity report cron job has been scheduled successfully!")
        print("The report will be generated daily at midnight")
        print(f"Reports will be saved in: {Path.cwd() / 'reports' / 'security'}")
        
    except Exception as e:
        logger.error(f"Error creating Linux cron job: {e}")
        sys.exit(1)

def setup_schedule(platform: str) -> None:
    """Set up automated scheduling based on the platform."""
    if platform.lower() == "windows":
        create_windows_task()
    elif platform.lower() == "linux":
        create_linux_cron()
    else:
        logger.error(f"Unsupported platform: {platform}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(
        description="Schedule security report generation",
        epilog="Note: On Windows, this script must be run as administrator."
    )
    parser.add_argument(
        "--platform",
        choices=["windows", "linux"],
        required=True,
        help="Operating system platform"
    )
    
    args = parser.parse_args()
    
    try:
        logger.info(f"Setting up security report scheduling for {args.platform}")
        setup_schedule(args.platform)
        logger.info("Security report scheduling completed successfully")
        
    except Exception as e:
        logger.error(f"Error in security report scheduling: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 