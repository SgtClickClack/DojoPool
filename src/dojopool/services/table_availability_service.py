"""
Table Availability Service Module

This module provides services for tracking and managing table availability in venues.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from sqlalchemy import func

from dojopool.extensions import db
from dojopool.venues.venue_manager import PoolTable, TableStatus
from dojopool.models.game import Game
from dojopool.models.venue import Venue
from dojopool.models.maintenance import Maintenance

logger = logging.getLogger(__name__)

class TableAvailabilityService:
    """Service for managing table availability and tracking."""

    def __init__(self):
        """Initialize the table availability service."""
        self.availability_cache = {}  # Cache for quick availability lookups
        self.cache_ttl = 300  # 5 minutes cache TTL

    def get_table_availability(self, venue_id: int, start_time: datetime, end_time: datetime) -> Dict[int, List[Tuple[datetime, datetime]]]:
        """Get table availability for a venue within a time range.
        
        Args:
            venue_id: ID of the venue
            start_time: Start time of the range
            end_time: End time of the range
            
        Returns:
            Dictionary mapping table IDs to list of available time slots
        """
        try:
            # Check cache first
            cache_key = f"{venue_id}_{start_time.isoformat()}_{end_time.isoformat()}"
            if cache_key in self.availability_cache:
                cached_data = self.availability_cache[cache_key]
                if datetime.utcnow() - cached_data['timestamp'] < timedelta(seconds=self.cache_ttl):
                    return cached_data['availability']

            # Get all tables for the venue
            tables = PoolTable.query.filter_by(venue_id=venue_id, status=TableStatus.AVAILABLE).all()
            if not tables:
                return {}

            # Get all games during the time range
            games = Game.query.filter(
                Game.venue_id == venue_id,
                Game.start_time <= end_time,
                Game.end_time >= start_time
            ).all()

            # Calculate availability for each table
            availability = {}
            for table in tables:
                # Initialize with the full time range
                available_slots = [(start_time, end_time)]

                # Remove occupied slots
                for game in games:
                    if game.table_id == table.id:
                        available_slots = self._remove_occupied_slot(available_slots, game.start_time, game.end_time)

                availability[table.id] = available_slots

            # Update cache
            self.availability_cache[cache_key] = {
                'availability': availability,
                'timestamp': datetime.utcnow()
            }

            return availability

        except Exception as e:
            logger.error(f"Error getting table availability: {str(e)}")
            return {}

    def _remove_occupied_slot(self, slots: List[Tuple[datetime, datetime]], 
                            occupied_start: datetime, occupied_end: datetime) -> List[Tuple[datetime, datetime]]:
        """Remove an occupied time slot from the list of available slots."""
        new_slots = []
        for slot_start, slot_end in slots:
            if occupied_end <= slot_start or occupied_start >= slot_end:
                # No overlap, keep the slot
                new_slots.append((slot_start, slot_end))
            else:
                # Split the slot around the occupied time
                if slot_start < occupied_start:
                    new_slots.append((slot_start, occupied_start))
                if slot_end > occupied_end:
                    new_slots.append((occupied_end, slot_end))
        return new_slots

    def get_peak_hours(self, venue_id: int, days: int = 30) -> Dict[str, float]:
        """Get peak hours analysis for a venue.
        
        Args:
            venue_id: ID of the venue
            days: Number of days to analyze
            
        Returns:
            Dictionary mapping hour to occupancy rate
        """
        try:
            # Get all games in the time period
            start_date = datetime.utcnow() - timedelta(days=days)
            games = Game.query.filter(
                Game.venue_id == venue_id,
                Game.start_time >= start_date
            ).all()

            # Count games per hour
            hourly_counts = {hour: 0 for hour in range(24)}
            total_hours = {hour: 0 for hour in range(24)}

            for game in games:
                # Calculate duration in hours
                duration = (game.end_time - game.start_time).total_seconds() / 3600
                
                # Count each hour the game spans
                current_time = game.start_time
                while current_time < game.end_time:
                    hour = current_time.hour
                    hourly_counts[hour] += 1
                    total_hours[hour] += 1
                    current_time += timedelta(hours=1)

            # Calculate occupancy rates
            venue = Venue.query.get(venue_id)
            total_tables = venue.tables if venue else 0
            occupancy_rates = {
                f"{hour:02d}:00": (count / (total_hours[hour] * total_tables)) * 100 
                if total_hours[hour] > 0 else 0
                for hour, count in hourly_counts.items()
            }

            return occupancy_rates

        except Exception as e:
            logger.error(f"Error getting peak hours: {str(e)}")
            return {}

    def schedule_maintenance(self, table_id: int, start_time: datetime, 
                           end_time: datetime, reason: str) -> bool:
        """Schedule maintenance for a table.
        
        Args:
            table_id: ID of the table
            start_time: Start time of maintenance
            end_time: End time of maintenance
            reason: Reason for maintenance
            
        Returns:
            True if maintenance was scheduled successfully
        """
        try:
            table = PoolTable.query.get(table_id)
            if not table:
                return False

            # Check if table is available during the maintenance period
            availability = self.get_table_availability(
                table.venue_id, start_time, end_time
            )
            
            if table.id not in availability:
                return False

            # Update table status
            table.status = TableStatus.MAINTENANCE
            table.maintenance_start = start_time
            table.maintenance_end = end_time
            table.maintenance_reason = reason
            
            db.session.commit()
            return True

        except Exception as e:
            logger.error(f"Error scheduling maintenance: {str(e)}")
            db.session.rollback()
            return False

    def get_maintenance_schedule(self, venue_id: int) -> List[Dict]:
        """Get maintenance schedule for a venue.
        
        Args:
            venue_id: ID of the venue
            
        Returns:
            List of maintenance schedules
        """
        try:
            tables = PoolTable.query.filter_by(
                venue_id=venue_id,
                status=TableStatus.MAINTENANCE
            ).all()

            return [{
                'table_id': table.id,
                'table_number': table.table_number,
                'start_time': table.maintenance_start.isoformat(),
                'end_time': table.maintenance_end.isoformat(),
                'reason': table.maintenance_reason
            } for table in tables]

        except Exception as e:
            logger.error(f"Error getting maintenance schedule: {str(e)}")
            return [] 