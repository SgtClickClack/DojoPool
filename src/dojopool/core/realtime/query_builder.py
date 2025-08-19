"""Query builder for room logging system."""

import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Union


class LogQueryBuilder:
    """Builder class for constructing and executing log queries."""

    def __init__(self, log_file: str):
        """Initialize query builder.

        Args:
            log_file: Path to log file
        """
        self.log_file = log_file
        self.filters = []
        self.start_time = None
        self.end_time = None
        self.limit = None
        self.order_by = "timestamp"
        self.order_desc = True

    def filter_by_room(self, room_id: str) -> "LogQueryBuilder":
        """Filter logs by room ID.

        Args:
            room_id: Room ID to filter by

        Returns:
            Self for method chaining
        """
        self.filters.append(lambda entry: entry.get("room_id") == room_id)
        return self

    def filter_by_user(self, user_id: str) -> "LogQueryBuilder":
        """Filter logs by user ID.

        Args:
            user_id: User ID to filter by

        Returns:
            Self for method chaining
        """
        self.filters.append(lambda entry: entry.get("user_id") == user_id)
        return self

    def filter_by_event_type(self, event_type: str) -> "LogQueryBuilder":
        """Filter logs by event type.

        Args:
            event_type: Event type to filter by

        Returns:
            Self for method chaining
        """
        self.filters.append(lambda entry: entry.get("event_type") == event_type)
        return self

    def filter_by_action(self, action: str) -> "LogQueryBuilder":
        """Filter logs by action.

        Args:
            action: Action to filter by

        Returns:
            Self for method chaining
        """
        self.filters.append(lambda entry: entry.get("action") == action)
        return self

    def filter_by_success(self, success: bool) -> "LogQueryBuilder":
        """Filter logs by success status.

        Args:
            success: Success status to filter by

        Returns:
            Self for method chaining
        """
        self.filters.append(lambda entry: entry.get("success") == success)
        return self

    def time_range(
        self,
        start_time: Optional[Union[datetime, str]] = None,
        end_time: Optional[Union[datetime, str]] = None,
    ) -> "LogQueryBuilder":
        """Set time range for query.

        Args:
            start_time: Start time (datetime or ISO format string)
            end_time: End time (datetime or ISO format string)

        Returns:
            Self for method chaining
        """
        if isinstance(start_time, datetime):
            self.start_time = start_time.isoformat()
        else:
            self.start_time = start_time

        if isinstance(end_time, datetime):
            self.end_time = end_time.isoformat()
        else:
            self.end_time = end_time

        return self

    def set_limit(self, limit: int) -> "LogQueryBuilder":
        """Set maximum number of results.

        Args:
            limit: Maximum number of results to return

        Returns:
            Self for method chaining
        """
        self.limit = limit
        return self

    def order(self, field: str = "timestamp", descending: bool = True) -> "LogQueryBuilder":
        """Set result ordering.

        Args:
            field: Field to order by
            descending: Whether to order in descending order

        Returns:
            Self for method chaining
        """
        self.order_by = field
        self.order_desc = descending
        return self

    def _apply_time_filter(self, entry: Dict[str, Any]) -> bool:
        """Apply time range filter to entry.

        Args:
            entry: Log entry to check

        Returns:
            bool: Whether entry passes time filter
        """
        timestamp = entry.get("timestamp")
        if not timestamp:
            return False

        if self.start_time and timestamp < self.start_time:
            return False
        if self.end_time and timestamp > self.end_time:
            return False
        return True

    def _apply_filters(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply all filters to entries.

        Args:
            entries: List of log entries

        Returns:
            List[Dict[str, Any]]: Filtered entries
        """
        filtered = entries

        # Apply custom filters
        for filter_func in self.filters:
            filtered = [entry for entry in filtered if filter_func(entry)]

        # Apply time filter
        if self.start_time or self.end_time:
            filtered = [entry for entry in filtered if self._apply_time_filter(entry)]

        return filtered

    def _sort_results(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort filtered results.

        Args:
            entries: List of log entries

        Returns:
            List[Dict[str, Any]]: Sorted entries
        """
        return sorted(entries, key=lambda x: x.get(self.order_by, ""), reverse=self.order_desc)

    def execute(self) -> List[Dict[str, Any]]:
        """Execute query and return results.

        Returns:
            List[Dict[str, Any]]: Query results
        """
        try:
            with open(self.log_file, "r") as f:
                entries = [json.loads(line) for line in f]
        except (FileNotFoundError, json.JSONDecodeError):
            return []

        # Apply filters
        filtered = self._apply_filters(entries)

        # Sort results
        sorted_entries = self._sort_results(filtered)

        # Apply limit
        if self.limit is not None:
            sorted_entries = sorted_entries[: self.limit]

        return sorted_entries
