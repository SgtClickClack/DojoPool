"""Unified Service for managing venue check-ins and check-outs.

This service consolidates all venue check-in functionality and serves as the single
source of truth for check-in operations across the platform. It handles QR code
validation, geolocation verification, table management, and real-time updates.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
import math

from sqlalchemy import func, and_
from flask import current_app

from ..models.user import User
from ..core.models.notification import Notification
from dojopool.models.venue import Venue
from dojopool.models.venue_checkin import VenueCheckIn
from ..core.database import db


class CheckInService:
    """Unified service class for managing venue check-ins and check-outs."""

    max_concurrent_checkins = 1  # Users can only be checked in at one venue
    max_checkin_distance = 50  # Maximum distance in meters for geolocation check-in

    @classmethod
    def check_in(
        cls,
        user_id: int,
        venue_id: int,
        table_number: Optional[int] = None,
        game_type: Optional[str] = None,
        qr_code: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> VenueCheckIn:
        """Check a user into a venue with comprehensive validation.

        Args:
            user_id: ID of the user checking in
            venue_id: ID of the venue to check into
            table_number: Optional table number assignment
            game_type: Optional game type being played
            qr_code: Optional QR code for venue verification
            latitude: Optional latitude for geolocation verification
            longitude: Optional longitude for geolocation verification

        Returns:
            The created VenueCheckIn record

        Raises:
            ValueError: If validation fails or user is already checked in
        """
        # Verify user and venue exist
        user = User.query.get(user_id)
        venue = Venue.query.get(venue_id)

        if not user or not venue:
            raise ValueError("Invalid user or venue ID")

        # Validate QR code if provided
        if qr_code and qr_code != f"venue-{venue_id}":
            raise ValueError("Invalid QR code for this venue")

        # Validate geolocation if provided
        if latitude is not None and longitude is not None:
            if not cls._validate_geolocation(venue, latitude, longitude):
                distance = cls._calculate_distance(
                    venue.latitude, venue.longitude, latitude, longitude
                )
                raise ValueError(
                    f"You must be within {cls.max_checkin_distance} meters of the venue. "
                    f"Current distance: {distance:.1f}m"
                )

        # Check if user is already checked in somewhere
        existing_checkin = VenueCheckIn.query.filter_by(
            user_id=user_id, checked_out_at=None
        ).first()

        if existing_checkin:
            if existing_checkin.venue_id == venue_id:
                raise ValueError("User is already checked in to this venue")
            else:
                raise ValueError("User is already checked in to another venue")

        # Verify table availability if table number provided
        if table_number:
            if table_number > venue.tables:
                raise ValueError("Invalid table number")

            table_occupied = VenueCheckIn.query.filter_by(
                venue_id=venue_id, table_number=table_number, checked_out_at=None
            ).first()

            if table_occupied:
                raise ValueError("Table is already occupied")

        # Create check-in record
        checkin = VenueCheckIn(
            venue_id=venue_id,
            user_id=user_id,
            table_number=table_number,
            game_type=game_type,
        )

        db.session.add(checkin)

        # Update venue stats
        cls._update_venue_stats(venue, 1)

        # Create notification for venue owner
        if venue.owner_id:
            Notification.create(
                user_id=venue.owner_id,
                type="checkin",
                title="New Check-in",
                message=f"{user.username} has checked in at {venue.name}",
                data={
                    "user_id": user_id,
                    "venue_id": venue_id,
                    "table_number": table_number,
                    "game_type": game_type,
                },
            )

        db.session.commit()
        return checkin

    @classmethod
    def check_out(cls, user_id: int, venue_id: int) -> VenueCheckIn:
        """Check a user out of a venue.

        Args:
            user_id: ID of the user checking out
            venue_id: ID of the venue to check out from

        Returns:
            The updated VenueCheckIn record

        Raises:
            ValueError: If user isn't checked in or venue doesn't match
        """
        # Find active check-in
        checkin = VenueCheckIn.query.filter_by(
            user_id=user_id, venue_id=venue_id, checked_out_at=None
        ).first()

        if not checkin:
            raise ValueError("User is not checked in to this venue")

        # Update check-out time
        checkin.checked_out_at = datetime.utcnow()

        # Update venue stats
        venue = Venue.query.get(venue_id)
        if venue:
            cls._update_venue_stats(venue, -1)

        db.session.commit()
        return checkin

    @classmethod
    def get_active_checkins(
        cls, venue_id: int, limit: int = 10, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get active check-ins for a venue.

        Args:
            venue_id: Venue ID
            limit: Maximum number of records to return
            offset: Number of records to skip

        Returns:
            List[Dict[str, Any]]: List of active check-ins
        """
        checkins = (
            VenueCheckIn.query.filter_by(venue_id=venue_id, checked_out_at=None)
            .order_by(VenueCheckIn.checked_in_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [
            {
                "id": c.id,
                "user_id": c.user_id,
                "username": c.user.username,
                "avatar_url": c.user.avatar_url,
                "table_number": c.table_number,
                "game_type": c.game_type,
                "checked_in_at": c.checked_in_at.isoformat(),
                "duration_minutes": cls._calculate_duration(c.checked_in_at),
            }
            for c in checkins
        ]

    @classmethod
    def get_checkin_history(
        cls,
        venue_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 10,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Get check-in history for a venue.

        Args:
            venue_id: Venue ID
            start_date: Optional start date filter
            end_date: Optional end date filter
            limit: Maximum number of records to return
            offset: Number of records to skip

        Returns:
            List[Dict[str, Any]]: List of check-in records
        """
        query = VenueCheckIn.query.filter_by(venue_id=venue_id)

        if start_date:
            query = query.filter(VenueCheckIn.checked_in_at >= start_date)
        if end_date:
            query = query.filter(VenueCheckIn.checked_in_at <= end_date)

        checkins = query.order_by(VenueCheckIn.checked_in_at.desc()).offset(offset).limit(limit).all()

        return [
            {
                "id": c.id,
                "user_id": c.user_id,
                "username": c.user.username,
                "avatar_url": c.user.avatar_url,
                "table_number": c.table_number,
                "game_type": c.game_type,
                "checked_in_at": c.checked_in_at.isoformat(),
                "checked_out_at": c.checked_out_at.isoformat() if c.checked_out_at else None,
                "duration_minutes": cls._calculate_duration(c.checked_in_at, c.checked_out_at),
            }
            for c in checkins
        ]

    @classmethod
    def get_user_checkins(cls, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get check-in history for a specific user.

        Args:
            user_id: User ID
            limit: Maximum number of records to return

        Returns:
            List[Dict[str, Any]]: List of user's check-in records
        """
        checkins = (
            VenueCheckIn.query.filter_by(user_id=user_id)
            .order_by(VenueCheckIn.checked_in_at.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": c.id,
                "venue_id": c.venue_id,
                "venue_name": c.venue.name,
                "table_number": c.table_number,
                "game_type": c.game_type,
                "checked_in_at": c.checked_in_at.isoformat(),
                "checked_out_at": c.checked_out_at.isoformat() if c.checked_out_at else None,
                "duration_minutes": cls._calculate_duration(c.checked_in_at, c.checked_out_at),
            }
            for c in checkins
        ]

    @classmethod
    def get_occupancy_stats(cls, venue_id: int, period: str = "day") -> Dict[str, Any]:
        """Get venue occupancy statistics.

        Args:
            venue_id: Venue ID
            period: Time period for stats ("hour", "day", "week", "month")

        Returns:
            Dict[str, Any]: Occupancy statistics
        """
        venue = Venue.query.get(venue_id)
        if not venue:
            return {}

        # Calculate time range based on period
        now = datetime.utcnow()
        if period == "hour":
            start_time = now - timedelta(hours=1)
        elif period == "day":
            start_time = now - timedelta(days=1)
        elif period == "week":
            start_time = now - timedelta(weeks=1)
        elif period == "month":
            start_time = now - timedelta(days=30)
        else:
            start_time = now - timedelta(days=1)

        # Get check-ins in time range
        checkins = VenueCheckIn.query.filter(
            and_(
                VenueCheckIn.venue_id == venue_id,
                VenueCheckIn.checked_in_at >= start_time,
            )
        ).all()

        # Calculate statistics
        total_checkins = len(checkins)
        active_checkins = len([c for c in checkins if not c.checked_out_at])
        avg_duration = 0

        if checkins:
            total_duration = sum(
                cls._calculate_duration(c.checked_in_at, c.checked_out_at) or 0
                for c in checkins
                if c.checked_out_at
            )
            completed_checkins = len([c for c in checkins if c.checked_out_at])
            if completed_checkins > 0:
                avg_duration = total_duration / completed_checkins

        return {
            "venue_id": venue_id,
            "venue_name": venue.name,
            "period": period,
            "total_checkins": total_checkins,
            "active_checkins": active_checkins,
            "avg_duration_minutes": round(avg_duration, 2),
            "total_tables": venue.tables,
            "occupancy_rate": round((active_checkins / venue.tables) * 100, 2) if venue.tables > 0 else 0,
        }

    @classmethod
    def get_table_status(cls, venue_id: int) -> List[Dict[str, Any]]:
        """Get status of all tables at a venue.

        Args:
            venue_id: Venue ID

        Returns:
            List[Dict[str, Any]]: Table status information
        """
        venue = Venue.query.get(venue_id)
        if not venue:
            return []

        tables = []
        for table_num in range(1, venue.tables + 1):
            active_checkin = VenueCheckIn.query.filter_by(
                venue_id=venue_id, table_number=table_num, checked_out_at=None
            ).first()

            table_info = {
                "table_number": table_num,
                "status": "occupied" if active_checkin else "available",
                "occupied_by": None,
                "game_type": None,
                "occupied_since": None,
            }

            if active_checkin:
                table_info.update({
                    "occupied_by": active_checkin.user.username,
                    "game_type": active_checkin.game_type,
                    "occupied_since": active_checkin.checked_in_at.isoformat(),
                })

            tables.append(table_info)

        return tables

    @classmethod
    def _validate_geolocation(cls, venue: Venue, latitude: float, longitude: float) -> bool:
        """Validate if user is within acceptable distance of venue.

        Args:
            venue: Venue object
            latitude: User's latitude
            longitude: User's longitude

        Returns:
            bool: True if within acceptable distance
        """
        if venue.latitude is None or venue.longitude is None:
            return True  # Skip validation if venue has no coordinates

        # Convert SQLAlchemy Column values to float
        venue_lat = float(venue.latitude) if venue.latitude is not None else None
        venue_lon = float(venue.longitude) if venue.longitude is not None else None
        
        if venue_lat is None or venue_lon is None:
            return True  # Skip validation if coordinates are invalid

        distance = cls._calculate_distance(venue_lat, venue_lon, latitude, longitude)
        return distance <= cls.max_checkin_distance

    @classmethod
    def _calculate_distance(
        cls, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calculate distance between two points using Haversine formula.

        Args:
            lat1: First point latitude
            lon1: First point longitude
            lat2: Second point latitude
            lon2: Second point longitude

        Returns:
            float: Distance in meters
        """
        R = 6371000  # Earth radius in meters
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))

        return R * c

    @classmethod
    def _calculate_duration(
        cls, start_time: datetime, end_time: Optional[datetime] = None
    ) -> Optional[int]:
        """Calculate duration between two times in minutes.

        Args:
            start_time: Start time
            end_time: End time (uses current time if None)

        Returns:
            Optional[int]: Duration in minutes
        """
        if not end_time:
            end_time = datetime.utcnow()

        delta = end_time - start_time
        return int(delta.total_seconds() / 60)

    @classmethod
    def _update_venue_stats(cls, venue: Venue, change: int) -> None:
        """Update venue occupancy statistics.

        Args:
            venue: Venue object
            change: Change in occupancy (+1 for check-in, -1 for check-out)
        """
        # For now, we'll just track this in the database session
        # In a future update, we could add a dedicated stats table or JSON field
        pass
