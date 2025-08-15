"""Event management service module."""

from datetime import datetime
from typing import Dict

from ..core.extensions import db
from ..models.event import Event
from ..models.event_participant import EventParticipant


class EventManagementService:
    def create_event(self, data: Dict) -> Dict:
        """Create a new event"""
        try:
            event = Event(
                venue_id=data["venue_id"],
                name=data["name"],
                event_type=data["event_type"],
                start_time=datetime.fromisoformat(data["start_time"]),
                end_time=datetime.fromisoformat(data["end_time"]),
                description=data.get("description"),
                registration_deadline=(
                    datetime.fromisoformat(data["registration_deadline"])
                    if "registration_deadline" in data
                    else None
                ),
                max_participants=data.get("max_participants"),
                entry_fee=data.get("entry_fee", 0.0),
                prize_pool=data.get("prize_pool", 0.0),
            )

            db.session.add(event)
            db.session.commit()

            return {"message": "Event created successfully", "event_id": event.id}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def update_event(self, event_id: str, data: Dict) -> Dict:
        """Update event details"""
        try:
            event = Event.query.get(event_id)
            if not event:
                return {"error": "Event not found"}

            # Update fields
            for field in [
                "name",
                "description",
                "event_type",
                "max_participants",
                "entry_fee",
                "prize_pool",
            ]:
                if field in data:
                    setattr(event, field, data[field])

            # Update dates if provided
            if "start_time" in data:
                event.start_time = datetime.fromisoformat(data["start_time"])
            if "end_time" in data:
                event.end_time = datetime.fromisoformat(data["end_time"])
            if "registration_deadline" in data:
                event.registration_deadline = datetime.fromisoformat(data["registration_deadline"])

            event.updated_at = datetime.utcnow()
            db.session.commit()

            return {"message": "Event updated successfully"}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def delete_event(self, event_id: str) -> Dict:
        """Delete an event"""
        try:
            event = Event.query.get(event_id)
            if not event:
                return {"error": "Event not found"}

            db.session.delete(event)
            db.session.commit()

            return {"message": "Event deleted successfully"}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def get_event_details(self, event_id: str) -> Dict:
        """Get event details"""
        try:
            event = Event.query.get(event_id)
            if not event:
                return {"error": "Event not found"}

            return event.to_dict()
        except Exception as e:
            return {"error": str(e)}

    def search_events(self, query: Dict) -> Dict:
        """Search events based on criteria"""
        try:
            events_query = Event.query

            # Apply filters
            if "venue_id" in query:
                events_query = events_query.filter(Event.venue_id == query["venue_id"])
            if "event_type" in query:
                events_query = events_query.filter(Event.event_type == query["event_type"])
            if "status" in query:
                events_query = events_query.filter(Event.status == query["status"])
            if "start_date" in query:
                start_date = datetime.fromisoformat(query["start_date"])
                events_query = events_query.filter(Event.start_time >= start_date)
            if "end_date" in query:
                end_date = datetime.fromisoformat(query["end_date"])
                events_query = events_query.filter(Event.end_time <= end_date)

            # Get results
            events = events_query.all()
            return {"events": [event.to_dict() for event in events]}
        except Exception as e:
            return {"error": str(e)}

    def register_participant(self, event_id: str, user_id: str) -> Dict:
        """Register a participant for an event"""
        try:
            event = Event.query.get(event_id)
            if not event:
                return {"error": "Event not found"}

            # Check if registration is still open
            if event.registration_deadline and datetime.utcnow() > event.registration_deadline:
                return {"error": "Registration deadline has passed"}

            # Check if event is full
            if event.max_participants:
                current_participants = EventParticipant.query.filter_by(event_id=event_id).count()
                if current_participants >= event.max_participants:
                    return {"error": "Event is full"}

            # Check if user is already registered
            existing_registration = EventParticipant.query.filter_by(
                event_id=event_id, user_id=user_id
            ).first()
            if existing_registration:
                return {"error": "User is already registered for this event"}

            participant = EventParticipant(event_id=event_id, user_id=user_id)

            db.session.add(participant)
            db.session.commit()

            return {"message": "Registration successful"}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def check_in_participant(self, event_id: str, user_id: str) -> Dict:
        """Check in a participant for an event"""
        try:
            participant = EventParticipant.query.filter_by(
                event_id=event_id, user_id=user_id
            ).first()

            if not participant:
                return {"error": "Participant not found"}

            if participant.checked_in:
                return {"error": "Participant is already checked in"}

            participant.checked_in = True
            participant.checked_in_at = datetime.utcnow()
            participant.status = "checked_in"
            participant.updated_at = datetime.utcnow()

            db.session.commit()

            return {"message": "Check-in successful"}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def update_participant_status(self, event_id: str, user_id: str, status: str) -> Dict:
        """Update participant status"""
        try:
            participant = EventParticipant.query.filter_by(
                event_id=event_id, user_id=user_id
            ).first()

            if not participant:
                return {"error": "Participant not found"}

            if status not in ["registered", "checked_in", "completed", "withdrawn"]:
                return {"error": "Invalid status"}

            participant.status = status
            participant.updated_at = datetime.utcnow()

            db.session.commit()

            return {"message": "Status updated successfully"}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def get_event_participants(self, event_id: str) -> Dict:
        """Get list of event participants"""
        try:
            participants = EventParticipant.query.filter_by(event_id=event_id).all()
            return {"participants": [participant.to_dict() for participant in participants]}
        except Exception as e:
            return {"error": str(e)}

    def update_event_status(self, event_id: str, status: str) -> Dict:
        """Update event status"""
        try:
            event = Event.query.get(event_id)
            if not event:
                return {"error": "Event not found"}

            if status not in ["upcoming", "active", "completed", "cancelled"]:
                return {"error": "Invalid status"}

            event.status = status
            event.updated_at = datetime.utcnow()

            db.session.commit()

            return {"message": "Event status updated successfully"}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}
