#!/usr/bin/env python3
"""
Venue Onboarding Manager Script.

This script provides a CLI interface for managing the venue onboarding process.
"""

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Set

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from dojopool.core.models.staff import StaffMember
from dojopool.core.models.venue import Venue, VenueEquipment
from dojopool.venues.onboarding import (
    EquipmentType,
    OnboardingStatus,
    VenueOnboardingManager,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("venue_onboarding.log")],
)

logger = logging.getLogger(__name__)


def register_venue(args) -> None:
    """Register a new venue."""
    manager = VenueOnboardingManager()

    try:
        # Parse business hours
        business_hours = {}
        for day_hours in args.business_hours.split(";"):
            day, hours = day_hours.split("=")
            start, end = hours.split("-")
            business_hours[day.lower()] = (start, end)

        # Parse owner info
        owner_info = json.loads(args.owner_info)

        venue, success = manager.register_venue(
            name=args.name,
            address=args.address,
            contact_email=args.email,
            contact_phone=args.phone,
            business_hours=business_hours,
            num_tables=args.num_tables,
            owner_info=owner_info,
        )

        if success:
            print(f"Successfully registered venue: {venue.id}")
            print_venue_details(venue)
        else:
            print("Failed to register venue")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error registering venue: {str(e)}")
        sys.exit(1)


def verify_venue(args) -> None:
    """Verify a registered venue."""
    manager = VenueOnboardingManager()

    try:
        # Parse documents
        documents = json.loads(args.documents)

        success = manager.verify_venue(
            venue_id=args.venue_id, documents=documents, verification_notes=args.notes
        )

        if success:
            print(f"Successfully verified venue: {args.venue_id}")
        else:
            print("Failed to verify venue")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error verifying venue: {str(e)}")
        sys.exit(1)


def setup_equipment(args):
    """Set up venue equipment."""
    manager = VenueOnboardingManager()

    try:
        # Parse equipment list
        equipment_list = []
        for eq_data in json.loads(args.equipment):
            equipment = VenueEquipment(
                equipment_type=eq_data["type"],
                serial_number=eq_data["serial_number"],
                installation_date=datetime.fromisoformat(eq_data["installation_date"]),
                last_maintenance=(
                    datetime.fromisoformat(eq_data["last_maintenance"])
                    if eq_data.get("last_maintenance")
                    else None
                ),
                status=eq_data.get("status", "active"),
            )
            equipment_list.append(equipment)

        success = manager.setup_equipment(
            venue_id=args.venue_id, equipment=equipment_list
        )

        if success:
            print(f"Successfully set up equipment for venue: {args.venue_id}")
        else:
            print("Failed to set up equipment")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error setting up equipment: {str(e)}")
        sys.exit(1)


def train_staff(args):
    """Record staff training completion."""
    manager = VenueOnboardingManager()

    try:
        # Parse staff list
        staff_list = []
        for staff_data in json.loads(args.staff):
            staff = StaffMember(
                first_name=staff_data["first_name"],
                last_name=staff_data["last_name"],
                email=staff_data["email"],
                phone=staff_data["phone"],
                role=staff_data["role"],
                venue_id=args.venue_id,
                hire_date=(
                    datetime.fromisoformat(staff_data["hire_date"])
                    if staff_data.get("hire_date")
                    else None
                ),
            )
            staff_list.append(staff)

        success = manager.train_staff(venue_id=args.venue_id, staff_members=staff_list)

        if success:
            print(f"Successfully recorded staff training for venue: {args.venue_id}")
        else:
            print("Failed to record staff training")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error recording staff training: {str(e)}")
        sys.exit(1)


def run_integration_test(args):
    """Run integration tests for venue."""
    manager = VenueOnboardingManager()

    try:
        success = manager.run_integration_test(args.venue_id)

        if success:
            print(f"Integration tests passed for venue: {args.venue_id}")
        else:
            print("Integration tests failed")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error running integration tests: {str(e)}")
        sys.exit(1)


def activate_venue(args) -> None:
    """Activate venue for live operation."""
    manager = VenueOnboardingManager()

    try:
        success = manager.activate_venue(args.venue_id)

        if success:
            print(f"Successfully activated venue: {args.venue_id}")
        else:
            print("Failed to activate venue")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error activating venue: {str(e)}")
        sys.exit(1)


def print_venue_details(venue: Venue):
    """Print formatted venue details."""
    print(
        f"""
Venue Details:
  ID: {venue.id}
  Name: {venue.name}
  Address: {venue.address}
  Contact Email: {venue.contact_email}
  Contact Phone: {venue.contact_phone}
  Number of Tables: {venue.num_tables}
  Status: {venue.status}
  Registration Date: {venue.registration_date.isoformat()}
"""
    )


def main():
    """Main entry point for the venue onboarding manager CLI."""
    parser = argparse.ArgumentParser(description="Venue Onboarding Manager")

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Register venue command
    register_parser = subparsers.add_parser("register", help="Register a new venue")
    register_parser.add_argument("--name", required=True)
    register_parser.add_argument("--address", required=True)
    register_parser.add_argument("--email", required=True)
    register_parser.add_argument("--phone", required=True)
    register_parser.add_argument(
        "--business-hours",
        required=True,
        help="Format: day=HH:MM-HH:MM;day=HH:MM-HH:MM",
    )
    register_parser.add_argument("--num-tables", type=int, required=True)
    register_parser.add_argument(
        "--owner-info", required=True, help="JSON string with owner information"
    )

    # Verify venue command
    verify_parser = subparsers.add_parser("verify", help="Verify a venue")
    verify_parser.add_argument("venue_id")
    verify_parser.add_argument(
        "--documents",
        required=True,
        help="JSON string mapping document types to file paths",
    )
    verify_parser.add_argument("--notes")

    # Setup equipment command
    equipment_parser = subparsers.add_parser(
        "setup-equipment", help="Set up venue equipment"
    )
    equipment_parser.add_argument("venue_id")
    equipment_parser.add_argument(
        "--equipment", required=True, help="JSON string with equipment details"
    )

    # Train staff command
    staff_parser = subparsers.add_parser("train-staff", help="Record staff training")
    staff_parser.add_argument("venue_id")
    staff_parser.add_argument(
        "--staff", required=True, help="JSON string with staff details"
    )

    # Integration test command
    test_parser = subparsers.add_parser("test", help="Run integration tests")
    test_parser.add_argument("venue_id")

    # Activate venue command
    activate_parser = subparsers.add_parser("activate", help="Activate venue")
    activate_parser.add_argument("venue_id")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Execute command
    if args.command == "register":
        register_venue(args)
    elif args.command == "verify":
        verify_venue(args)
    elif args.command == "setup-equipment":
        setup_equipment(args)
    elif args.command == "train-staff":
        train_staff(args)
    elif args.command == "test":
        run_integration_test(args)
    elif args.command == "activate":
        activate_venue(args)


if __name__ == "__main__":
    main()
