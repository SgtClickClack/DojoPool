import gc
import gc
#!/usr/bin/env python3
"""
Incident Response Coordinator Script.

This script provides a CLI interface for managing security incidents
and coordinating response activities.
"""

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Set

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from dojopool.security.incident_response import (
    IncidentResponseCoordinator,
    IncidentSeverity,
    IncidentStatus,
    IncidentType,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("incident_response.log")],
)

logger = logging.getLogger(__name__)


def create_incident(args) -> None:
    """Create a new security incident."""
    coordinator = IncidentResponseCoordinator()

    try:
        incident = coordinator.create_incident(
            incident_type=IncidentType(args.type),
            severity=IncidentSeverity(args.severity),
            description=args.description,
            affected_systems=set(args.affected_systems.split(",")),
            detected_by=args.detected_by,
        )

        print(f"Created incident: {incident.id}")
        print_incident_details(incident)

    except ValueError as e:
        logger.error(f"Error creating incident: {str(e)}")
        sys.exit(1)


def update_incident(args):
    """Update an existing incident."""
    coordinator = IncidentResponseCoordinator()

    try:
        status = IncidentStatus(args.status) if args.status else None
        resolution_steps = (
            args.resolution_steps.split(",") if args.resolution_steps else None
        )

        incident = coordinator.update_incident(
            incident_id=args.incident_id,
            status=status,
            resolution_steps=resolution_steps,
            assigned_to=args.assigned_to,
        )

        if incident:
            print(f"Updated incident: {incident.id}")
            print_incident_details(incident)
        else:
            print(f"Incident not found: {args.incident_id}")
            sys.exit(1)

    except ValueError as e:
        logger.error(f"Error updating incident: {str(e)}")
        sys.exit(1)


def list_incidents(args):
    """List active incidents."""
    coordinator = IncidentResponseCoordinator()

    try:
        severity = IncidentSeverity(args.severity) if args.severity else None
        incidents = coordinator.get_active_incidents(severity=severity)

        if not incidents:
            print("No active incidents found.")
            return

        print(f"Active incidents ({len(incidents)}):")
        for incident in incidents:
            print("\n---")
            print_incident_details(incident)

    except ValueError as e:
        logger.error(f"Error listing incidents: {str(e)}")
        sys.exit(1)


def generate_report(args) -> None:
    """Generate a detailed incident report."""
    coordinator = IncidentResponseCoordinator()

    try:
        report = coordinator.generate_incident_report(args.incident_id)

        if report:
            if args.output:
                with open(args.output, "w") as f:
                    json.dump(report, f, indent=2)
                print(f"Report saved to: {args.output}")
            else:
                print(json.dumps(report, indent=2))
        else:
            print(f"Incident not found: {args.incident_id}")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        sys.exit(1)


def print_incident_details(incident):
    """Print formatted incident details."""
    print(
        f"""
Incident Details:
  ID: {incident.id}
  Type: {incident.type.value}
  Severity: {incident.severity.value}
  Status: {incident.status.value}
  Description: {incident.description}
  Affected Systems: {', '.join(incident.affected_systems)}
  Detected By: {incident.detected_by}
  Detection Time: {incident.detection_time.isoformat()}
  Last Updated: {incident.last_updated.isoformat()}
  Assigned To: {incident.assigned_to or 'Unassigned'}
"""
    )


def main():
    """Main entry point for the incident response coordinator CLI."""
    parser = argparse.ArgumentParser(
        description="Security Incident Response Coordinator"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create incident command
    create_parser = subparsers.add_parser("create", help="Create a new incident")
    create_parser.add_argument(
        "--type", required=True, choices=[t.value for t in IncidentType]
    )
    create_parser.add_argument(
        "--severity", required=True, choices=[s.value for s in IncidentSeverity]
    )
    create_parser.add_argument("--description", required=True)
    create_parser.add_argument(
        "--affected-systems", required=True, help="Comma-separated list"
    )
    create_parser.add_argument("--detected-by", required=True)

    # Update incident command
    update_parser = subparsers.add_parser("update", help="Update an incident")
    update_parser.add_argument("incident_id", help="ID of the incident to update")
    update_parser.add_argument("--status", choices=[s.value for s in IncidentStatus])
    update_parser.add_argument("--resolution-steps", help="Comma-separated list")
    update_parser.add_argument("--assigned-to")

    # List incidents command
    list_parser = subparsers.add_parser("list", help="List active incidents")
    list_parser.add_argument("--severity", choices=[s.value for s in IncidentSeverity])

    # Generate report command
    report_parser = subparsers.add_parser("report", help="Generate incident report")
    report_parser.add_argument("incident_id", help="ID of the incident")
    report_parser.add_argument("--output", help="Output file path")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Execute command
    if args.command == "create":
        create_incident(args)
    elif args.command == "update":
        update_incident(args)
    elif args.command == "list":
        list_incidents(args)
    elif args.command == "report":
        generate_report(args)


if __name__ == "__main__":
    main()
