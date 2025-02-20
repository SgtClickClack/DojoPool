import gc
import gc
"""WebSocket room persistence module.

This module provides persistence functionality for room data.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union, cast

from .constants import ErrorCodes
from .log_config import logger
from .utils import format_error_response

RoomData = Dict[str, Any]


class RoomPersistence:
    """Room persistence class."""

    def __init__(self, data_dir: Union[str, Path] = "data/rooms") -> None:
        """Initialize RoomPersistence.

        Args:
            data_dir: Directory for room data files
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._dirty_rooms: Set[str] = set()
        self._save_task: Optional[asyncio.Task[None]] = None
        self._lock = asyncio.Lock()

    def _get_room_path(self, room_id: str):
        """Get path for room data file.

        Args:
            room_id: Room identifier

        Returns:
            Path to room data file
        """
        return self.data_dir / f"{room_id}.json"

    async def start_persistence(self, save_interval: int = 60):
        """Start persistence task.

        Args:
            save_interval: Save interval in seconds
        """
        if self._save_task is None:
            self._save_task = asyncio.create_task(self._save_loop(save_interval))

    async def stop_persistence(self):
        """Stop persistence task."""
        if self._save_task is not None:
            self._save_task.cancel()
            try:
                await self._save_task
            except asyncio.CancelledError:
                pass
            self._save_task = None

            # Save any remaining dirty rooms
            await self.save_dirty_rooms()

    async def _save_loop(self, interval: int) -> None:
        """Save loop to persist dirty rooms.

        Args:
            interval: Save interval in seconds
        """
        while True:
            try:
                await asyncio.sleep(interval)
                await self.save_dirty_rooms()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "Error in room persistence loop",
                    exc_info=True,
                    extra={"error": str(e)},
                )

    def mark_room_dirty(self, room_id: str):
        """Mark room as needing persistence.

        Args:
            room_id: Room ID
        """
        self._dirty_rooms.add(room_id)

    async def save_dirty_rooms(self):
        """Save all dirty rooms."""
        async with self._lock:
            try:
                # Get copy of dirty rooms and clear set
                dirty_rooms = self._dirty_rooms.copy()
                self._dirty_rooms.clear()

                # Save each dirty room
                for room_id in dirty_rooms:
                    await self.save_room(room_id)

            except Exception as e:
                logger.error(
                    "Error saving dirty rooms", exc_info=True, extra={"error": str(e)}
                )
                # Add rooms back to dirty set
                self._dirty_rooms.update(dirty_rooms)

    async def save_room(self, room_id: str, room_data: Optional[RoomData] = None):
        """Save room data.

        Args:
            room_id: Room identifier
            room_data: Optional room data to save

        Returns:
            Optional error response if failed
        """
        try:
            # Get room data if not provided
            if room_data is None:
                from .rooms import room_manager

                room = room_manager.get_room(room_id)
                if not room:
                    return format_error_response(
                        ErrorCodes.ROOM_NOT_FOUND,
                        "Room not found",
                        {"room_id": room_id},
                    )
                room_data = room.to_dict()

            # Add save metadata
            room_data["_saved_at"] = datetime.utcnow().isoformat()

            # Save to file
            file_path = self._get_room_path(room_id)
            async with self._lock:
                with open(file_path, "w") as f:
                    json.dump(room_data, f, indent=2)

            logger.info(
                "Room data saved",
                extra={"room_id": room_id, "file_path": str(file_path)},
            )

            return None

        except Exception as e:
            logger.error(
                "Error saving room data",
                exc_info=True,
                extra={"room_id": room_id, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error saving room data",
                {"error": str(e)},
            )

    async def load_room(self, room_id: str) -> Optional[RoomData]:
        """Load room data.

        Args:
            room_id: Room identifier

        Returns:
            Room data if found, None otherwise
        """
        try:
            file_path = self._get_room_path(room_id)
            if not file_path.exists():
                return None

            async with self._lock:
                with open(file_path, "r") as f:
                    return cast(RoomData, json.load(f))

        except Exception as e:
            logger.error(
                "Error loading room data",
                exc_info=True,
                extra={"room_id": room_id, "error": str(e)},
            )
            return None

    async def delete_room(self, room_id: str):
        """Delete room data.

        Args:
            room_id: Room identifier

        Returns:
            True if room was deleted, False otherwise
        """
        try:
            file_path = self._get_room_path(room_id)
            if not file_path.exists():
                return False

            async with self._lock:
                file_path.unlink()
                return True

        except Exception as e:
            logger.error(
                "Error deleting room data",
                exc_info=True,
                extra={"room_id": room_id, "error": str(e)},
            )
            return False

    async def list_rooms(self, room_type: Optional[str] = None):
        """List persisted room IDs.

        Args:
            room_type: Optional room type filter

        Returns:
            List of room IDs
        """
        try:
            room_ids: List[str] = []

            for file_path in self.data_dir.glob("*.json"):
                try:
                    # Load room data to check type
                    with open(file_path, "r") as f:
                        room_data = cast(RoomData, json.load(f))

                    # Apply room type filter
                    if room_type and room_data.get("room_type") != room_type:
                        continue

                    room_ids.append(file_path.stem)

                except Exception as e:
                    logger.error(
                        "Error reading room file",
                        exc_info=True,
                        extra={"file_path": str(file_path), "error": str(e)},
                    )

            return room_ids

        except Exception as e:
            logger.error("Error listing rooms", exc_info=True, extra={"error": str(e)})
            return []

    async def cleanup_old_rooms(self, max_age_days: int = 7):
        """Clean up old room data files.

        Args:
            max_age_days: Maximum age in days
        """
        try:
            current_time = datetime.utcnow()
            max_age = timedelta(days=max_age_days)

            for file_path in self.data_dir.glob("*.json"):
                try:
                    # Check file age
                    file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if current_time - file_time > max_age:
                        file_path.unlink()
                        logger.info(
                            "Old room data deleted", extra={"file_path": str(file_path)}
                        )

                except Exception as e:
                    logger.error(
                        "Error cleaning up room file",
                        exc_info=True,
                        extra={"file_path": str(file_path), "error": str(e)},
                    )

        except Exception as e:
            logger.error(
                "Error cleaning up old rooms", exc_info=True, extra={"error": str(e)}
            )


# Global room persistence instance
room_persistence = RoomPersistence()


async def start_room_persistence(save_interval: int = 60) -> None:
    """Start room persistence.

    Args:
        save_interval: Save interval in seconds
    """
    await room_persistence.start_persistence(save_interval)


async def stop_room_persistence():
    """Stop room persistence."""
    await room_persistence.stop_persistence()
