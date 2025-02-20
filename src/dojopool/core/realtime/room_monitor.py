import gc
import gc
"""WebSocket room monitor module.

This module provides functionality for monitoring rooms and collecting statistics.
"""

import asyncio
import statistics
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .log_config import logger
from .rooms import room_manager


class RoomMonitor:
    """Room monitor class."""

    def __init__(self):
        """Initialize RoomMonitor."""
        self._cleanup_task: Optional[asyncio.Task] = None
        self._stats: Dict[str, Any] = {
            "total_rooms": 0,
            "active_rooms": 0,
            "total_users": 0,
            "users_per_room": {"min": 0, "max": 0, "avg": 0, "median": 0},
            "room_types": {},
            "room_ages": {"min": 0, "max": 0, "avg": 0, "median": 0},
            "last_update": None,
        }
        self._room_history: Dict[str, List[Dict[str, Any]]] = {}
        self._user_history: Dict[str, List[Dict[str, Any]]] = {}

    async def start_monitoring(self, update_interval: int = 60) -> None:
        """Start monitoring task.

        Args:
            update_interval: Update interval in seconds
        """
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(
                self._monitor_loop(update_interval)
            )

    async def stop_monitoring(self):
        """Stop monitoring task."""
        if self._cleanup_task is not None:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None

    async def _monitor_loop(self, interval: int):
        """Monitor loop to update statistics.

        Args:
            interval: Update interval in seconds
        """
        while True:
            try:
                await asyncio.sleep(interval)
                await self.update_stats()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "Error in monitor loop", exc_info=True, extra={"error": str(e)}
                )

    async def update_stats(self):
        """Update room statistics."""
        try:
            current_time = datetime.utcnow()

            # Get all rooms
            rooms = room_manager._rooms.values()

            # Calculate basic stats
            total_rooms = len(rooms)
            active_rooms = sum(1 for r in rooms if r.is_active())
            total_users = sum(len(r.members) for r in rooms)

            # Calculate users per room stats
            users_per_room = [len(r.members) for r in rooms]
            if users_per_room:
                users_stats = {
                    "min": min(users_per_room),
                    "max": max(users_per_room),
                    "avg": statistics.mean(users_per_room),
                    "median": statistics.median(users_per_room),
                }
            else:
                users_stats = {"min": 0, "max": 0, "avg": 0, "median": 0}

            # Calculate room type stats
            room_types = {}
            for room in rooms:
                room_type = room.room_type
                if room_type not in room_types:
                    room_types[room_type] = 0
                room_types[room_type] += 1

            # Calculate room age stats
            room_ages = [(current_time - r.created_at).total_seconds() for r in rooms]
            if room_ages:
                age_stats = {
                    "min": min(room_ages),
                    "max": max(room_ages),
                    "avg": statistics.mean(room_ages),
                    "median": statistics.median(room_ages),
                }
            else:
                age_stats = {"min": 0, "max": 0, "avg": 0, "median": 0}

            # Update stats
            self._stats = {
                "total_rooms": total_rooms,
                "active_rooms": active_rooms,
                "total_users": total_users,
                "users_per_room": users_stats,
                "room_types": room_types,
                "room_ages": age_stats,
                "last_update": current_time.isoformat(),
            }

            # Update history
            self._update_history(current_time)

            logger.info("Room statistics updated", extra={"stats": self._stats})

        except Exception as e:
            logger.error(
                "Error updating room statistics", exc_info=True, extra={"error": str(e)}
            )

    def _update_history(self, current_time: datetime) -> None:
        """Update monitoring history.

        Args:
            current_time: Current time
        """
        # Add room stats to history
        for room in room_manager._rooms.values():
            if room.room_id not in self._room_history:
                self._room_history[room.room_id] = []

            self._room_history[room.room_id].append(
                {
                    "timestamp": current_time.isoformat(),
                    "member_count": len(room.members),
                    "is_active": room.is_active(),
                }
            )

        # Add user stats to history
        all_users = set()
        for room in room_manager._rooms.values():
            all_users.update(room.members)

        for user_id in all_users:
            if user_id not in self._user_history:
                self._user_history[user_id] = []

            user_rooms = [
                r.room_id for r in room_manager._rooms.values() if user_id in r.members
            ]

            self._user_history[user_id].append(
                {
                    "timestamp": current_time.isoformat(),
                    "room_count": len(user_rooms),
                    "rooms": user_rooms,
                }
            )

        # Clean up old history entries
        self._cleanup_history(current_time)

    def _cleanup_history(self, current_time: datetime):
        """Clean up old history entries.

        Args:
            current_time: Current time
        """
        max_age = timedelta(hours=24)
        cutoff_time = current_time - max_age

        # Clean up room history
        for room_id in list(self._room_history.keys()):
            history = self._room_history[room_id]

            # Remove old entries
            history = [
                entry
                for entry in history
                if datetime.fromisoformat(entry["timestamp"]) > cutoff_time
            ]

            if history:
                self._room_history[room_id] = history
            else:
                del self._room_history[room_id]

        # Clean up user history
        for user_id in list(self._user_history.keys()):
            history = self._user_history[user_id]

            # Remove old entries
            history = [
                entry
                for entry in history
                if datetime.fromisoformat(entry["timestamp"]) > cutoff_time
            ]

            if history:
                self._user_history[user_id] = history
            else:
                del self._user_history[user_id]

    def get_stats(self) -> Dict[str, Any]:
        """Get current statistics.

        Returns:
            Dict[str, Any]: Current statistics
        """
        return self._stats.copy()

    def get_room_history(
        self,
        room_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ):
        """Get room history.

        Args:
            room_id: Room ID
            start_time: Optional start time filter
            end_time: Optional end time filter

        Returns:
            List[Dict[str, Any]]: Room history entries
        """
        history = self._room_history.get(room_id, [])

        if start_time or end_time:
            filtered_history = []
            for entry in history:
                entry_time = datetime.fromisoformat(entry["timestamp"])
                if start_time and entry_time < start_time:
                    continue
                if end_time and entry_time > end_time:
                    continue
                filtered_history.append(entry)
            return filtered_history

        return history

    def get_user_history(
        self,
        user_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """Get user history.

        Args:
            user_id: User ID
            start_time: Optional start time filter
            end_time: Optional end time filter

        Returns:
            List[Dict[str, Any]]: User history entries
        """
        history = self._user_history.get(user_id, [])

        if start_time or end_time:
            filtered_history = []
            for entry in history:
                entry_time = datetime.fromisoformat(entry["timestamp"])
                if start_time and entry_time < start_time:
                    continue
                if end_time and entry_time > end_time:
                    continue
                filtered_history.append(entry)
            return filtered_history

        return history

    def get_active_users(self) -> List[str]:
        """Get currently active users.

        Returns:
            List[str]: List of active user IDs
        """
        active_users = set()
        for room in room_manager._rooms.values():
            if room.is_active():
                active_users.update(room.members)
        return list(active_users)

    def get_user_room_count(self, user_id: str):
        """Get number of rooms user is in.

        Args:
            user_id: User ID

        Returns:
            int: Number of rooms
        """
        return sum(
            1 for room in room_manager._rooms.values() if user_id in room.members
        )

    def get_room_stats(self, room_id: str):
        """Get detailed stats for room.

        Args:
            room_id: Room ID

        Returns:
            Optional[Dict[str, Any]]: Room statistics if found
        """
        room = room_manager.get_room(room_id)
        if not room:
            return None

        current_time = datetime.utcnow()
        age = (current_time - room.created_at).total_seconds()

        history = self.get_room_history(room_id)
        if history:
            member_counts = [entry["member_count"] for entry in history]
            member_stats = {
                "min": min(member_counts),
                "max": max(member_counts),
                "avg": statistics.mean(member_counts),
                "median": statistics.median(member_counts),
            }
        else:
            member_stats = {"min": 0, "max": 0, "avg": 0, "median": 0}

        return {
            "room_id": room_id,
            "room_type": room.room_type,
            "created_at": room.created_at.isoformat(),
            "age_seconds": age,
            "is_active": room.is_active(),
            "current_members": len(room.members),
            "member_stats": member_stats,
            "history_entries": len(history),
        }


# Global room monitor instance
room_monitor = RoomMonitor()


async def start_room_monitor(update_interval: int = 60) -> None:
    """Start room monitoring.

    Args:
        update_interval: Update interval in seconds
    """
    await room_monitor.start_monitoring(update_interval)


async def stop_room_monitor():
    """Stop room monitoring."""
    await room_monitor.stop_monitoring()
