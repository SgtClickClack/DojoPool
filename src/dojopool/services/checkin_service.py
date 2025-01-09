"""Service for handling venue check-ins and occupancy tracking."""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from sqlalchemy import func
from dojopool.core.database import db
from dojopool.models.venue import Venue, VenueCheckIn
from dojopool.models.notification import Notification
from dojopool.models.user import User

class CheckInService:
    """Service for managing venue check-ins."""
    
    def __init__(self):
        self.max_concurrent_checkins = 1  # Users can only be checked in at one venue
    
    def check_in(
        self,
        user_id: int,
        venue_id: int,
        table_number: Optional[int] = None,
        game_type: Optional[str] = None
    ) -> VenueCheckIn:
        """Check in a user at a venue.
        
        Args:
            user_id: User ID
            venue_id: Venue ID
            table_number: Optional table number
            game_type: Optional game type being played
            
        Returns:
            VenueCheckIn: Created check-in record
        """
        # Verify user and venue exist
        user = User.query.get(user_id)
        venue = Venue.query.get(venue_id)
        
        if not user or not venue:
            raise ValueError("User or venue not found")
            
        # Check if user is already checked in somewhere
        active_checkin = (VenueCheckIn.query
                         .filter_by(user_id=user_id, checked_out_at=None)
                         .first())
                         
        if active_checkin:
            if active_checkin.venue_id == venue_id:
                raise ValueError("Already checked in at this venue")
            else:
                # Auto check-out from previous venue
                self.check_out(user_id, active_checkin.venue_id)
        
        # Create new check-in
        checkin = VenueCheckIn(
            user_id=user_id,
            venue_id=venue_id,
            table_number=table_number,
            game_type=game_type,
            checked_in_at=datetime.utcnow()
        )
        
        db.session.add(checkin)
        
        # Update venue stats
        if not venue.stats:
            venue.stats = {}
        venue.stats['current_occupancy'] = venue.current_occupancy + 1
        if venue.stats.get('peak_occupancy', 0) < venue.stats['current_occupancy']:
            venue.stats['peak_occupancy'] = venue.stats['current_occupancy']
        
        # Create notification for venue owner
        if venue.owner_id:
            Notification.create(
                user_id=venue.owner_id,
                type='checkin',
                title='New Check-in',
                message=f'{user.username} has checked in at {venue.name}',
                data={
                    'user_id': user_id,
                    'venue_id': venue_id,
                    'table_number': table_number,
                    'game_type': game_type
                }
            )
        
        db.session.commit()
        return checkin
    
    def check_out(
        self,
        user_id: int,
        venue_id: int
    ) -> Optional[VenueCheckIn]:
        """Check out a user from a venue.
        
        Args:
            user_id: User ID
            venue_id: Venue ID
            
        Returns:
            Optional[VenueCheckIn]: Updated check-in record
        """
        # Find active check-in
        checkin = (VenueCheckIn.query
                  .filter_by(
                      user_id=user_id,
                      venue_id=venue_id,
                      checked_out_at=None
                  )
                  .first())
                  
        if not checkin:
            raise ValueError("No active check-in found")
            
        # Update check-in record
        checkin.checked_out_at = datetime.utcnow()
        
        # Update venue stats
        venue = Venue.query.get(venue_id)
        if venue and venue.stats:
            venue.stats['current_occupancy'] = max(0, venue.current_occupancy - 1)
        
        db.session.commit()
        return checkin
    
    def get_active_checkins(
        self,
        venue_id: int,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get active check-ins for a venue.
        
        Args:
            venue_id: Venue ID
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            List[Dict[str, Any]]: List of active check-ins
        """
        checkins = (VenueCheckIn.query
                   .filter_by(venue_id=venue_id, checked_out_at=None)
                   .order_by(VenueCheckIn.checked_in_at.desc())
                   .offset(offset)
                   .limit(limit)
                   .all())
                   
        return [
            {
                'id': c.id,
                'user_id': c.user_id,
                'username': c.user.username,
                'avatar_url': c.user.avatar_url,
                'table_number': c.table_number,
                'game_type': c.game_type,
                'checked_in_at': c.checked_in_at.isoformat()
            }
            for c in checkins
        ]
    
    def get_checkin_history(
        self,
        venue_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 10,
        offset: int = 0
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
            
        checkins = (query.order_by(VenueCheckIn.checked_in_at.desc())
                   .offset(offset)
                   .limit(limit)
                   .all())
                   
        return [
            {
                'id': c.id,
                'user_id': c.user_id,
                'username': c.user.username,
                'avatar_url': c.user.avatar_url,
                'table_number': c.table_number,
                'game_type': c.game_type,
                'checked_in_at': c.checked_in_at.isoformat(),
                'checked_out_at': c.checked_out_at.isoformat() if c.checked_out_at else None,
                'duration': str(c.checked_out_at - c.checked_in_at) if c.checked_out_at else None
            }
            for c in checkins
        ]
    
    def get_occupancy_stats(
        self,
        venue_id: int,
        period: str = 'day'
    ) -> Dict[str, Any]:
        """Get occupancy statistics for a venue.
        
        Args:
            venue_id: Venue ID
            period: Time period ('day', 'week', 'month')
            
        Returns:
            Dict[str, Any]: Occupancy statistics
        """
        venue = Venue.query.get(venue_id)
        if not venue:
            raise ValueError("Venue not found")
            
        now = datetime.utcnow()
        if period == 'day':
            start_date = now - timedelta(days=1)
        elif period == 'week':
            start_date = now - timedelta(weeks=1)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        else:
            raise ValueError("Invalid period")
            
        # Get check-in counts by hour
        checkins_by_hour = (db.session.query(
            func.date_trunc('hour', VenueCheckIn.checked_in_at),
            func.count(VenueCheckIn.id)
        )
        .filter(
            VenueCheckIn.venue_id == venue_id,
            VenueCheckIn.checked_in_at >= start_date
        )
        .group_by(func.date_trunc('hour', VenueCheckIn.checked_in_at))
        .all())
        
        # Calculate statistics
        total_checkins = sum(count for _, count in checkins_by_hour)
        peak_hour = max(checkins_by_hour, key=lambda x: x[1]) if checkins_by_hour else (None, 0)
        current_occupancy = venue.current_occupancy
        
        return {
            'current_occupancy': current_occupancy,
            'peak_occupancy': venue.stats.get('peak_occupancy', 0),
            'total_checkins': total_checkins,
            'peak_hour': {
                'time': peak_hour[0].isoformat() if peak_hour[0] else None,
                'count': peak_hour[1]
            },
            'checkins_by_hour': [
                {
                    'hour': hour.isoformat(),
                    'count': count
                }
                for hour, count in checkins_by_hour
            ]
        } 