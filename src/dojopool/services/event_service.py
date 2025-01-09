"""Service for handling venue events and registrations."""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from sqlalchemy import and_, or_, func
from dojopool.core.database import db
from dojopool.models.venue import Venue, VenueEvent, VenueEventParticipant
from dojopool.models.user import User
from dojopool.models.notification import Notification

class EventService:
    """Service for managing venue events."""
    
    def create_event(
        self,
        venue_id: int,
        name: str,
        description: str,
        event_type: str,
        start_time: datetime,
        end_time: datetime,
        registration_deadline: Optional[datetime] = None,
        max_participants: Optional[int] = None,
        entry_fee: Optional[float] = None,
        prize_pool: Optional[float] = None,
        rules: Optional[Dict[str, Any]] = None
    ) -> VenueEvent:
        """Create a new venue event.
        
        Args:
            venue_id: Venue ID
            name: Event name
            description: Event description
            event_type: Type of event (tournament, social, etc.)
            start_time: Event start time
            end_time: Event end time
            registration_deadline: Optional registration deadline
            max_participants: Optional maximum number of participants
            entry_fee: Optional entry fee
            prize_pool: Optional prize pool
            rules: Optional event rules
            
        Returns:
            VenueEvent: Created event
        """
        # Verify venue exists
        venue = Venue.query.get(venue_id)
        if not venue:
            raise ValueError("Venue not found")
            
        # Validate times
        now = datetime.utcnow()
        if start_time < now:
            raise ValueError("Start time must be in the future")
        if end_time <= start_time:
            raise ValueError("End time must be after start time")
        if registration_deadline and registration_deadline > start_time:
            raise ValueError("Registration deadline must be before start time")
            
        # Create event
        event = VenueEvent(
            venue_id=venue_id,
            name=name,
            description=description,
            event_type=event_type,
            start_time=start_time,
            end_time=end_time,
            registration_deadline=registration_deadline,
            max_participants=max_participants,
            entry_fee=entry_fee,
            prize_pool=prize_pool,
            rules=rules,
            status='upcoming'
        )
        
        db.session.add(event)
        
        # Notify venue owner
        if venue.owner_id:
            Notification.create(
                user_id=venue.owner_id,
                type='event_created',
                title='New Event Created',
                message=f'A new event "{name}" has been created at {venue.name}',
                data={
                    'event_id': event.id,
                    'venue_id': venue_id,
                    'event_type': event_type
                }
            )
        
        db.session.commit()
        return event
    
    def update_event(
        self,
        event_id: int,
        **updates: Any
    ) -> VenueEvent:
        """Update an existing event.
        
        Args:
            event_id: Event ID
            **updates: Fields to update
            
        Returns:
            VenueEvent: Updated event
        """
        event = VenueEvent.query.get(event_id)
        if not event:
            raise ValueError("Event not found")
            
        # Validate updates
        if 'start_time' in updates or 'end_time' in updates:
            start_time = updates.get('start_time', event.start_time)
            end_time = updates.get('end_time', event.end_time)
            if end_time <= start_time:
                raise ValueError("End time must be after start time")
                
        if 'registration_deadline' in updates:
            if updates['registration_deadline'] > event.start_time:
                raise ValueError("Registration deadline must be before start time")
                
        # Update fields
        for field, value in updates.items():
            setattr(event, field, value)
            
        db.session.commit()
        return event
    
    def register_participant(
        self,
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
        user = User.query.get(user_id)
        
        if not event or not user:
            raise ValueError("Event or user not found")
            
        # Check if registration is open
        now = datetime.utcnow()
        if event.registration_deadline and now > event.registration_deadline:
            raise ValueError("Registration deadline has passed")
            
        if event.start_time <= now:
            raise ValueError("Event has already started")
            
        # Check if event is full
        if event.max_participants:
            participant_count = VenueEventParticipant.query.filter_by(
                event_id=event_id
            ).count()
            if participant_count >= event.max_participants:
                raise ValueError("Event is full")
                
        # Check if already registered
        existing = VenueEventParticipant.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        if existing:
            raise ValueError("Already registered for this event")
            
        # Create participant record
        participant = VenueEventParticipant(
            event_id=event_id,
            user_id=user_id,
            registered_at=now
        )
        
        db.session.add(participant)
        
        # Notify user
        Notification.create(
            user_id=user_id,
            type='event_registration',
            title='Event Registration Confirmed',
            message=f'You have been registered for {event.name}',
            data={
                'event_id': event_id,
                'venue_id': event.venue_id
            }
        )
        
        db.session.commit()
        return participant
    
    def get_events(
        self,
        venue_id: Optional[int] = None,
        status: Optional[str] = None,
        event_type: Optional[str] = None,
        include_past: bool = False,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get venue events.
        
        Args:
            venue_id: Optional venue ID filter
            status: Optional status filter
            event_type: Optional event type filter
            include_past: Whether to include past events
            limit: Maximum number of events to return
            offset: Number of events to skip
            
        Returns:
            List[Dict[str, Any]]: List of events
        """
        query = VenueEvent.query
        
        if venue_id:
            query = query.filter_by(venue_id=venue_id)
        if status:
            query = query.filter_by(status=status)
        if event_type:
            query = query.filter_by(event_type=event_type)
            
        if not include_past:
            query = query.filter(VenueEvent.end_time > datetime.utcnow())
            
        events = (query.order_by(VenueEvent.start_time.asc())
                 .offset(offset)
                 .limit(limit)
                 .all())
                 
        return [
            {
                'id': e.id,
                'venue_id': e.venue_id,
                'venue_name': e.venue.name,
                'name': e.name,
                'description': e.description,
                'event_type': e.event_type,
                'start_time': e.start_time.isoformat(),
                'end_time': e.end_time.isoformat(),
                'registration_deadline': e.registration_deadline.isoformat() if e.registration_deadline else None,
                'max_participants': e.max_participants,
                'entry_fee': e.entry_fee,
                'prize_pool': e.prize_pool,
                'rules': e.rules,
                'status': e.status,
                'participant_count': len(e.participants),
                'created_at': e.created_at.isoformat()
            }
            for e in events
        ]
    
    def get_event_participants(
        self,
        event_id: int,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get participants for an event.
        
        Args:
            event_id: Event ID
            limit: Maximum number of participants to return
            offset: Number of participants to skip
            
        Returns:
            List[Dict[str, Any]]: List of participants
        """
        participants = (VenueEventParticipant.query
                      .filter_by(event_id=event_id)
                      .order_by(VenueEventParticipant.registered_at.asc())
                      .offset(offset)
                      .limit(limit)
                      .all())
                      
        return [
            {
                'id': p.id,
                'user_id': p.user_id,
                'username': p.user.username,
                'avatar_url': p.user.avatar_url,
                'registered_at': p.registered_at.isoformat(),
                'checked_in': p.checked_in,
                'checked_in_at': p.checked_in_at.isoformat() if p.checked_in_at else None,
                'placement': p.placement,
                'prize_amount': p.prize_amount
            }
            for p in participants
        ]
    
    def check_in_participant(
        self,
        event_id: int,
        user_id: int
    ) -> VenueEventParticipant:
        """Check in a participant for an event.
        
        Args:
            event_id: Event ID
            user_id: User ID
            
        Returns:
            VenueEventParticipant: Updated participant record
        """
        participant = VenueEventParticipant.query.filter_by(
            event_id=event_id,
            user_id=user_id
        ).first()
        
        if not participant:
            raise ValueError("Not registered for this event")
            
        if participant.checked_in:
            raise ValueError("Already checked in")
            
        participant.checked_in = True
        participant.checked_in_at = datetime.utcnow()
        
        db.session.commit()
        return participant 