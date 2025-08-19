"""QR code statistics tracking system."""

import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional


@dataclass
class QRScanEvent:
    """QR code scan event data."""

    table_id: str
    venue_id: str
    timestamp: datetime
    success: bool
    error_type: Optional[str] = None
    scan_duration: Optional[float] = None
    user_id: Optional[str] = None


@dataclass
class QRStats:
    """QR code statistics for a venue/table."""

    total_scans: int = 0
    successful_scans: int = 0
    failed_scans: int = 0
    avg_scan_duration: float = 0.0
    error_types: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    hourly_stats: Dict[int, int] = field(default_factory=lambda: defaultdict(int))
    daily_stats: Dict[str, int] = field(default_factory=lambda: defaultdict(int))


class QRStatsManager:
    """Manager for QR code statistics."""

    def __init__(self, retention_days: int = 30, cache_ttl: int = 300):
        """Initialize QR stats manager.

        Args:
            retention_days: Number of days to retain detailed stats
            cache_ttl: Cache time-to-live in seconds (default: 5 minutes)
        """
        self._lock = threading.Lock()
        self.retention_days = retention_days
        self.venue_stats: Dict[str, QRStats] = defaultdict(QRStats)
        self.table_stats: Dict[str, QRStats] = defaultdict(QRStats)
        self.scan_history: List[QRScanEvent] = []
        self._cache_ttl = cache_ttl
        self._cache: Dict[str, Any] = {}
        self._cache_timestamps: Dict[str, datetime] = {}

        # Start cleanup thread
        self._stop_cleanup = False
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()

    def record_scan(
        self,
        table_id: str,
        venue_id: str,
        success: bool,
        error_type: Optional[str] = None,
        scan_duration: Optional[float] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """Record a QR code scan event.

        Args:
            table_id: ID of the table
            venue_id: ID of the venue
            success: Whether scan was successful
            error_type: Type of error if scan failed
            scan_duration: Duration of scan in seconds
            user_id: ID of user who scanned
        """
        with self._lock:
            # Create scan event
            event = QRScanEvent(
                table_id=table_id,
                venue_id=venue_id,
                timestamp=datetime.utcnow(),
                success=success,
                error_type=error_type,
                scan_duration=scan_duration,
                user_id=user_id,
            )

            # Update venue stats
            self._update_stats(self.venue_stats[venue_id], event)

            # Update table stats
            self._update_stats(self.table_stats[table_id], event)

            # Add to history
            self.scan_history.append(event)

            # Clean up old events
            self._cleanup_old_events()

            # Invalidate relevant caches
            self._invalidate_cache(venue_id=venue_id, table_id=table_id)

    def get_venue_stats(self, venue_id: str, days: Optional[int] = None) -> Optional[Dict]:
        """Get statistics for a venue.

        Args:
            venue_id: ID of the venue
            days: Optional number of days to limit stats to

        Returns:
            Optional[Dict]: Venue statistics
        """
        cache_key = f"venue:{venue_id}:{days}"
        cached_stats = self._get_cached_stats(cache_key)
        if cached_stats:
            return cached_stats

        with self._lock:
            stats = self.venue_stats.get(venue_id)
            if not stats:
                return None

            return self._format_stats(stats, venue_id, days)

    def get_table_stats(self, table_id: str, days: Optional[int] = None) -> Optional[Dict]:
        """Get statistics for a table.

        Args:
            table_id: ID of the table
            days: Optional number of days to limit stats to

        Returns:
            Optional[Dict]: Table statistics
        """
        cache_key = f"table:{table_id}:{days}"
        cached_stats = self._get_cached_stats(cache_key)
        if cached_stats:
            return cached_stats

        with self._lock:
            stats = self.table_stats.get(table_id)
            if not stats:
                return None

            return self._format_stats(stats, table_id, days)

    def get_error_report(
        self,
        venue_id: Optional[str] = None,
        table_id: Optional[str] = None,
        days: Optional[int] = None,
    ) -> Dict:
        """Get error report for venue or table.

        Args:
            venue_id: Optional venue ID to filter by
            table_id: Optional table ID to filter by
            days: Optional number of days to limit report to

        Returns:
            Dict: Error statistics and details
        """
        cache_key = f"errors:{venue_id}:{table_id}:{days}"
        cached_report = self._get_cached_stats(cache_key)
        if cached_report:
            return cached_report

        with self._lock:
            cutoff = None
            if days:
                cutoff = datetime.utcnow() - timedelta(days=days)

            errors = []
            for event in self.scan_history:
                if event.success:
                    continue

                if cutoff and event.timestamp < cutoff:
                    continue

                if venue_id and event.venue_id != venue_id:
                    continue

                if table_id and event.table_id != table_id:
                    continue

                errors.append(
                    {
                        "timestamp": event.timestamp.isoformat(),
                        "venue_id": event.venue_id,
                        "table_id": event.table_id,
                        "error_type": event.error_type,
                        "user_id": event.user_id,
                    }
                )

            report = {"total_errors": len(errors), "errors": errors}

            self._cache_stats(cache_key, report)
            return report

    def _update_stats(self, stats: QRStats, event: QRScanEvent) -> None:
        """Update statistics with new scan event.

        Args:
            stats: Statistics to update
            event: Scan event
        """
        # Update basic counts
        stats.total_scans += 1
        if event.success:
            stats.successful_scans += 1
        else:
            stats.failed_scans += 1
            if event.error_type:
                stats.error_types[event.error_type] += 1

        # Update scan duration average
        if event.scan_duration is not None:
            total_duration = stats.avg_scan_duration * (stats.total_scans - 1)
            total_duration += event.scan_duration
            stats.avg_scan_duration = total_duration / stats.total_scans

        # Update hourly stats
        hour = event.timestamp.hour
        stats.hourly_stats[hour] += 1

        # Update daily stats
        day = event.timestamp.date().isoformat()
        stats.daily_stats[day] += 1

    def _format_stats(self, stats: QRStats, id: str, days: Optional[int] = None) -> Dict:
        """Format statistics for output.

        Args:
            stats: Statistics to format
            id: Venue or table ID
            days: Optional number of days to limit stats to

        Returns:
            Dict: Formatted statistics
        """
        if days:
            # Filter daily stats
            cutoff = datetime.utcnow().date() - timedelta(days=days)
            daily_stats = {
                day: count
                for day, count in stats.daily_stats.items()
                if datetime.fromisoformat(day).date() >= cutoff
            }
        else:
            daily_stats = stats.daily_stats

        return {
            "id": id,
            "total_scans": stats.total_scans,
            "successful_scans": stats.successful_scans,
            "failed_scans": stats.failed_scans,
            "success_rate": (
                stats.successful_scans / stats.total_scans if stats.total_scans > 0 else 0
            ),
            "avg_scan_duration": stats.avg_scan_duration,
            "error_types": dict(stats.error_types),
            "hourly_stats": dict(stats.hourly_stats),
            "daily_stats": daily_stats,
        }

    def _cleanup_old_events(self) -> None:
        """Clean up events older than retention period."""
        if not self.retention_days:
            return

        cutoff = datetime.utcnow() - timedelta(days=self.retention_days)
        self.scan_history = [event for event in self.scan_history if event.timestamp >= cutoff]

    def _get_cached_stats(self, key: str) -> Optional[Any]:
        """Get cached statistics if valid.

        Args:
            key: Cache key

        Returns:
            Optional[Any]: Cached data if valid
        """
        with self._lock:
            if key in self._cache:
                timestamp = self._cache_timestamps.get(key)
                if timestamp and (datetime.utcnow() - timestamp).total_seconds() < self._cache_ttl:
                    return self._cache[key]
                else:
                    # Cache expired
                    del self._cache[key]
                    del self._cache_timestamps[key]
            return None

    def _cache_stats(self, key: str, data: Any) -> None:
        """Cache statistics data.

        Args:
            key: Cache key
            data: Data to cache
        """
        with self._lock:
            self._cache[key] = data
            self._cache_timestamps[key] = datetime.utcnow()

    def _invalidate_cache(
        self, venue_id: Optional[str] = None, table_id: Optional[str] = None
    ) -> None:
        """Invalidate cached statistics.

        Args:
            venue_id: Optional venue ID to invalidate
            table_id: Optional table ID to invalidate
        """
        with self._lock:
            keys_to_remove = []

            for key in self._cache:
                if venue_id and f"venue:{venue_id}" in key:
                    keys_to_remove.append(key)
                if table_id and f"table:{table_id}" in key:
                    keys_to_remove.append(key)
                if (venue_id or table_id) and key.startswith("errors:"):
                    keys_to_remove.append(key)

            for key in keys_to_remove:
                del self._cache[key]
                del self._cache_timestamps[key]

    def _cleanup_loop(self) -> None:
        """Background thread for cleaning up old events and cache entries."""
        while not self._stop_cleanup:
            try:
                self._cleanup_old_data()
            except Exception as e:
                print(f"Error in cleanup loop: {str(e)}")

            time.sleep(3600)  # Run every hour

    def _cleanup_old_data(self, max_age_days: int = 90) -> None:
        """Clean up old events and cache entries.

        Args:
            max_age_days: Maximum age of events to keep
        """
        cutoff = datetime.utcnow() - timedelta(days=max_age_days)

        with self._lock:
            # Clean up venue stats
            for venue_id in list(self.venue_stats.keys()):
                self.venue_stats[venue_id] = [
                    e for e in self.venue_stats[venue_id] if e.timestamp >= cutoff
                ]
                if not self.venue_stats[venue_id]:
                    del self.venue_stats[venue_id]

            # Clean up table stats
            for table_id in list(self.table_stats.keys()):
                self.table_stats[table_id] = [
                    e for e in self.table_stats[table_id] if e.timestamp >= cutoff
                ]
                if not self.table_stats[table_id]:
                    del self.table_stats[table_id]

            # Clean up expired cache entries
            cache_cutoff = datetime.utcnow() - timedelta(seconds=self._cache_ttl)
            for key in list(self._cache_timestamps.keys()):
                if self._cache_timestamps[key] < cache_cutoff:
                    del self._cache[key]
                    del self._cache_timestamps[key]


# Global instance
qr_stats = QRStatsManager()
