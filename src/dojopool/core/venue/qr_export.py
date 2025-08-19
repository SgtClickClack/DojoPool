"""Export system for QR code statistics."""

import csv
import json
from datetime import datetime
from io import StringIO
from typing import Optional

import pandas as pd

from .qr_stats import qr_stats


class QRExportManager:
    """Manager for exporting QR code statistics."""

    def export_stats_csv(
        self,
        venue_id: Optional[str] = None,
        table_id: Optional[str] = None,
        days: Optional[int] = None,
        include_errors: bool = True,
    ) -> Optional[str]:
        """Export statistics to CSV format.

        Args:
            venue_id: Optional venue ID to filter by
            table_id: Optional table ID to filter by
            days: Optional number of days to limit export to
            include_errors: Whether to include error details

        Returns:
            Optional[str]: CSV data as string
        """
        try:
            # Get stats
            stats = None
            if venue_id:
                stats = qr_stats.get_venue_stats(venue_id, days)
            elif table_id:
                stats = qr_stats.get_table_stats(table_id, days)

            if not stats:
                return None

            # Create CSV buffer
            output = StringIO()
            writer = csv.writer(output)

            # Write summary stats
            writer.writerow(["Summary Statistics"])
            writer.writerow(["Total Scans", stats["total_scans"]])
            writer.writerow(["Successful Scans", stats["successful_scans"]])
            writer.writerow(["Failed Scans", stats["failed_scans"]])
            writer.writerow(["Success Rate", f"{stats['success_rate']*100:.1f}%"])
            writer.writerow(["Average Scan Duration", f"{stats['avg_scan_duration']:.2f}s"])
            writer.writerow([])

            # Write daily stats
            writer.writerow(["Daily Statistics"])
            writer.writerow(["Date", "Scans"])
            for date, count in stats["daily_stats"].items():
                writer.writerow([date, count])
            writer.writerow([])

            # Write hourly stats
            writer.writerow(["Hourly Distribution"])
            writer.writerow(["Hour", "Scans"])
            for hour, count in stats["hourly_stats"].items():
                writer.writerow([f"{hour}:00", count])
            writer.writerow([])

            # Write error types
            writer.writerow(["Error Types"])
            writer.writerow(["Error", "Count"])
            for error_type, count in stats["error_types"].items():
                writer.writerow([error_type, count])

            # Include detailed error report if requested
            if include_errors:
                error_report = qr_stats.get_error_report(
                    venue_id=venue_id, table_id=table_id, days=days
                )
                if error_report["total_errors"] > 0:
                    writer.writerow([])
                    writer.writerow(["Detailed Error Report"])
                    writer.writerow(["Timestamp", "Error Type", "Table ID", "Venue ID", "User ID"])
                    for error in error_report["errors"]:
                        writer.writerow(
                            [
                                error["timestamp"],
                                error["error_type"],
                                error["table_id"],
                                error["venue_id"],
                                error["user_id"] or "N/A",
                            ]
                        )

            return output.getvalue()

        except Exception as e:
            print(f"Error exporting stats to CSV: {str(e)}")
            return None

    def export_stats_excel(
        self,
        venue_id: Optional[str] = None,
        table_id: Optional[str] = None,
        days: Optional[int] = None,
        include_errors: bool = True,
    ) -> Optional[bytes]:
        """Export statistics to Excel format.

        Args:
            venue_id: Optional venue ID to filter by
            table_id: Optional table ID to filter by
            days: Optional number of days to limit export to
            include_errors: Whether to include error details

        Returns:
            Optional[bytes]: Excel file data
        """
        try:
            # Get stats
            stats = None
            if venue_id:
                stats = qr_stats.get_venue_stats(venue_id, days)
            elif table_id:
                stats = qr_stats.get_table_stats(table_id, days)

            if not stats:
                return None

            # Create Excel writer
            output = StringIO()
            writer = pd.ExcelWriter(output, engine="xlsxwriter")

            # Create summary sheet
            summary_data = {
                "Metric": [
                    "Total Scans",
                    "Successful Scans",
                    "Failed Scans",
                    "Success Rate",
                    "Average Scan Duration",
                ],
                "Value": [
                    stats["total_scans"],
                    stats["successful_scans"],
                    stats["failed_scans"],
                    f"{stats['success_rate']*100:.1f}%",
                    f"{stats['avg_scan_duration']:.2f}s",
                ],
            }
            pd.DataFrame(summary_data).to_excel(writer, sheet_name="Summary", index=False)

            # Create daily stats sheet
            daily_data = {
                "Date": list(stats["daily_stats"].keys()),
                "Scans": list(stats["daily_stats"].values()),
            }
            pd.DataFrame(daily_data).to_excel(writer, sheet_name="Daily Stats", index=False)

            # Create hourly stats sheet
            hourly_data = {
                "Hour": [f"{hour}:00" for hour in stats["hourly_stats"].keys()],
                "Scans": list(stats["hourly_stats"].values()),
            }
            pd.DataFrame(hourly_data).to_excel(writer, sheet_name="Hourly Stats", index=False)

            # Create error types sheet
            error_data = {
                "Error Type": list(stats["error_types"].keys()),
                "Count": list(stats["error_types"].values()),
            }
            pd.DataFrame(error_data).to_excel(writer, sheet_name="Error Types", index=False)

            # Include detailed error report if requested
            if include_errors:
                error_report = qr_stats.get_error_report(
                    venue_id=venue_id, table_id=table_id, days=days
                )
                if error_report["total_errors"] > 0:
                    error_df = pd.DataFrame(error_report["errors"])
                    error_df["user_id"] = error_df["user_id"].fillna("N/A")
                    error_df.to_excel(writer, sheet_name="Error Details", index=False)

            writer.save()
            return output.getvalue().encode()

        except Exception as e:
            print(f"Error exporting stats to Excel: {str(e)}")
            return None

    def export_stats_json(
        self,
        venue_id: Optional[str] = None,
        table_id: Optional[str] = None,
        days: Optional[int] = None,
        include_errors: bool = True,
    ) -> Optional[str]:
        """Export statistics to JSON format.

        Args:
            venue_id: Optional venue ID to filter by
            table_id: Optional table ID to filter by
            days: Optional number of days to limit export to
            include_errors: Whether to include error details

        Returns:
            Optional[str]: JSON data as string
        """
        try:
            # Get stats
            stats = None
            if venue_id:
                stats = qr_stats.get_venue_stats(venue_id, days)
            elif table_id:
                stats = qr_stats.get_table_stats(table_id, days)

            if not stats:
                return None

            # Create export data
            export_data = {"generated_at": datetime.utcnow().isoformat(), "stats": stats}

            # Include error report if requested
            if include_errors:
                error_report = qr_stats.get_error_report(
                    venue_id=venue_id, table_id=table_id, days=days
                )
                export_data["error_report"] = error_report

            return json.dumps(export_data, indent=2)

        except Exception as e:
            print(f"Error exporting stats to JSON: {str(e)}")
            return None


# Global instance
qr_export = QRExportManager()
