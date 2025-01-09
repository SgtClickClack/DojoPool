from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import func

from dojopool.models.venue import (
    Venue, VenueCheckIn, VenueLeaderboard,
    VenueEvent, VenueEventParticipant
)
from dojopool.core.database import db

class VenueService:
    """Service for managing venues and related functionality."""
    
    @staticmethod
    def create_venue(data: Dict[str, Any]) -> Venue:
        """Create a new venue.
        
        Args:
            data: Venue data including name, description, address, etc.
            
        Returns:
            Venue: Created venue
        """
        venue = Venue(**data)
        db.session.add(venue)
        db.session.commit()
        return venue
    
    @staticmethod
    def update_venue(venue_id: int, data: Dict[str, Any]) -> Optional[Venue]:
        """Update venue details.
        
        Args:
            venue_id: ID of venue to update
            data: Updated venue data
            
        Returns:
            Optional[Venue]: Updated venue if found
        """
        venue = Venue.query.get(venue_id)
        if not venue:
            return None
            
        for key, value in data.items():
            setattr(venue, key, value)
        
        db.session.commit()
        return venue
    
    @staticmethod
    def get_venue(venue_id: int) -> Optional[Venue]:
        """Get venue by ID.
        
        Args:
            venue_id: Venue ID
            
        Returns:
            Optional[Venue]: Venue if found
        """
        return Venue.query.get(venue_id)
    
    @staticmethod
    def get_venues(
        limit: int = 10,
        offset: int = 0,
        filters: Dict[str, Any] = None
    ) -> List[Venue]:
        """Get venues with optional filtering.
        
        Args:
            limit: Maximum number of venues to return
            offset: Number of venues to skip
            filters: Optional filters to apply
            
        Returns:
            List[Venue]: List of venues
        """
        query = Venue.query
        
        if filters:
            if 'name' in filters:
                query = query.filter(Venue.name.ilike(f"%{filters['name']}%"))
            if 'is_verified' in filters:
                query = query.filter_by(is_verified=filters['is_verified'])
        
        return query.offset(offset).limit(limit).all()
    
    @staticmethod
    def check_in_user(
        venue_id: int,
        user_id: int,
        table_number: Optional[int] = None,
        game_type: Optional[str] = None
    ) -> VenueCheckIn:
        """Check in a user at a venue.
        
        Args:
            venue_id: Venue ID
            user_id: User ID
            table_number: Optional table number
            game_type: Optional game type
            
        Returns:
            VenueCheckIn: Created check-in record
        """
        # Check if user is already checked in
        active_check_in = VenueCheckIn.query.filter_by(
            user_id=user_id,
            checked_out_at=None
        ).first()
        
        if active_check_in:
            raise ValueError("User is already checked in at a venue")
        
        check_in = VenueCheckIn(
            venue_id=venue_id,
            user_id=user_id,
            table_number=table_number,
            game_type=game_type
        )
        
        db.session.add(check_in)
        db.session.commit()
        return check_in
    
    @staticmethod
    def check_out_user(user_id: int) -> Optional[VenueCheckIn]:
        """Check out a user from their current venue.
        
        Args:
            user_id: User ID
            
        Returns:
            Optional[VenueCheckIn]: Updated check-in record if found
        """
        check_in = VenueCheckIn.query.filter_by(
            user_id=user_id,
            checked_out_at=None
        ).first()
        
        if check_in:
            check_in.checked_out_at = datetime.utcnow()
            db.session.commit()
            return check_in
        
        return None
    
    @staticmethod
    def get_venue_leaderboard(
        venue_id: int,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get venue leaderboard.
        
        Args:
            venue_id: Venue ID
            limit: Maximum number of entries to return
            offset: Number of entries to skip
            
        Returns:
            List[Dict[str, Any]]: Leaderboard entries with user details
        """
        entries = (
            VenueLeaderboard.query
            .filter_by(venue_id=venue_id)
            .order_by(VenueLeaderboard.points.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        return [entry.to_dict() for entry in entries]
    
    @staticmethod
    def update_leaderboard(
        venue_id: int,
        user_id: int,
        won: bool,
        points: int
    ) -> VenueLeaderboard:
        """Update venue leaderboard after a game.
        
        Args:
            venue_id: Venue ID
            user_id: User ID
            won: Whether the user won
            points: Points earned
            
        Returns:
            VenueLeaderboard: Updated leaderboard entry
        """
        entry = VenueLeaderboard.query.filter_by(
            venue_id=venue_id,
            user_id=user_id
        ).first()
        
        if not entry:
            entry = VenueLeaderboard(
                venue_id=venue_id,
                user_id=user_id
            )
            db.session.add(entry)
        
        entry.points += points
        if won:
            entry.wins += 1
            entry.current_streak += 1
            entry.highest_streak = max(entry.highest_streak, entry.current_streak)
        else:
            entry.losses += 1
            entry.current_streak = 0
        
        entry.last_played = datetime.utcnow()
        db.session.commit()
        
        return entry
    
    @staticmethod
    def create_event(venue_id: int, data: Dict[str, Any]) -> VenueEvent:
        """Create a new venue event.
        
        Args:
            venue_id: Venue ID
            data: Event data
            
        Returns:
            VenueEvent: Created event
        """
        event = VenueEvent(venue_id=venue_id, **data)
        db.session.add(event)
        db.session.commit()
        return event
    
    @staticmethod
    def get_venue_events(
        venue_id: int,
        status: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> List[VenueEvent]:
        """Get venue events.
        
        Args:
            venue_id: Venue ID
            status: Optional event status filter
            limit: Maximum number of events to return
            offset: Number of events to skip
            
        Returns:
            List[VenueEvent]: List of events
        """
        query = VenueEvent.query.filter_by(venue_id=venue_id)
        
        if status:
            query = query.filter_by(status=status)
        
        return query.offset(offset).limit(limit).all()
    
    @staticmethod
    def register_for_event(
        event_id: int,
        user_id: int
    ) -> VenueEventParticipant:
        """Register a user for an event.
        
        Args:
            event_id: Event ID
            user_id: User ID
            
        Returns:
            VenueEventParticipant: Created participant record
        """
        event = VenueEvent.query.get(event_id)
        if not event:
            raise ValueError("Event not found")
            
        if event.status != 'upcoming':
            raise ValueError("Event registration is closed")
            
        if event.registration_deadline and datetime.utcnow() > event.registration_deadline:
            raise ValueError("Registration deadline has passed")
            
        # Check if user is already registered
        existing = VenueEventParticipant.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        
        if existing:
            raise ValueError("User is already registered for this event")
        
        participant = VenueEventParticipant(
            event_id=event_id,
            user_id=user_id
        )
        
        db.session.add(participant)
        db.session.commit()
        return participant 