from datetime import datetime
from typing import Dict, List, Optional
from ..models.venue import Venue
from ..models.event import Event
from ..utils.validation import validate_coordinates
from ..extensions import db

class VenueManagementService:
    def create_venue(self, data: Dict) -> Dict:
        """Create a new venue"""
        try:
            # Validate coordinates
            if not validate_coordinates(data['latitude'], data['longitude']):
                return {'error': 'Invalid coordinates'}
            
            venue = Venue(
                name=data['name'],
                address=data['address'],
                latitude=data['latitude'],
                longitude=data['longitude'],
                venue_type=data['venue_type'],
                tables=data['tables'],
                owner_id=data['owner_id'],
                status='active',
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.session.add(venue)
            db.session.commit()
            
            return {'message': 'Venue created successfully', 'venue_id': venue.id}
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def update_venue(self, venue_id: str, data: Dict) -> Dict:
        """Update venue details"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return {'error': 'Venue not found'}
            
            # Update coordinates if provided
            if 'latitude' in data and 'longitude' in data:
                if not validate_coordinates(data['latitude'], data['longitude']):
                    return {'error': 'Invalid coordinates'}
                venue.latitude = data['latitude']
                venue.longitude = data['longitude']
            
            # Update other fields
            for field in ['name', 'address', 'venue_type', 'tables']:
                if field in data:
                    setattr(venue, field, data[field])
            
            venue.updated_at = datetime.utcnow()
            db.session.commit()
            
            return {'message': 'Venue updated successfully'}
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def delete_venue(self, venue_id: str) -> Dict:
        """Delete a venue"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return {'error': 'Venue not found'}
            
            db.session.delete(venue)
            db.session.commit()
            
            return {'message': 'Venue deleted successfully'}
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def get_venue_details(self, venue_id: str) -> Dict:
        """Get venue details"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return {'error': 'Venue not found'}
            
            return venue.to_dict()
        except Exception as e:
            return {'error': str(e)}

    def search_venues(self, query: Dict) -> Dict:
        """Search venues based on criteria"""
        try:
            venues_query = Venue.query
            
            # Apply filters
            if 'name' in query:
                venues_query = venues_query.filter(Venue.name.ilike(f"%{query['name']}%"))
            if 'venue_type' in query:
                venues_query = venues_query.filter(Venue.venue_type == query['venue_type'])
            if 'status' in query:
                venues_query = venues_query.filter(Venue.status == query['status'])
            
            # Get results
            venues = venues_query.all()
            return {'venues': [venue.to_dict() for venue in venues]}
        except Exception as e:
            return {'error': str(e)}

    def get_venue_stats(self, venue_id: str) -> Dict:
        """Get venue statistics"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return {'error': 'Venue not found'}
            
            # Calculate statistics
            total_events = Event.query.filter_by(venue_id=venue_id).count()
            active_events = Event.query.filter_by(
                venue_id=venue_id,
                status='active'
            ).count()
            
            return {
                'total_events': total_events,
                'active_events': active_events,
                'venue_status': venue.status,
                'last_updated': venue.updated_at.isoformat()
            }
        except Exception as e:
            return {'error': str(e)}

    def update_venue_status(self, venue_id: str, status: str) -> Dict:
        """Update venue status"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return {'error': 'Venue not found'}
            
            if status not in ['active', 'inactive', 'maintenance']:
                return {'error': 'Invalid status'}
            
            venue.status = status
            venue.updated_at = datetime.utcnow()
            db.session.commit()
            
            return {'message': 'Venue status updated successfully'}
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def get_venue_occupancy(self, venue_id: str) -> Dict:
        """Get venue occupancy"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return {'error': 'Venue not found'}
            
            active_events = Event.query.filter_by(
                venue_id=venue_id,
                status='active'
            ).count()
            
            occupancy = {
                'total_tables': len(venue.tables),
                'occupied_tables': active_events,
                'available_tables': len(venue.tables) - active_events,
                'occupancy_rate': (active_events / len(venue.tables)) * 100
            }
            
            return occupancy
        except Exception as e:
            return {'error': str(e)}

    def update_venue_features(self, venue_id: str, features: List[str]) -> Dict:
        """Update venue features"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return {'error': 'Venue not found'}
            
            venue.features = features
            venue.updated_at = datetime.utcnow()
            db.session.commit()
            
            return {'message': 'Venue features updated successfully'}
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def get_venue_events(self, venue_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """Get venue events for a date range"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return {'error': 'Venue not found'}
            
            events = Event.query.filter(
                Event.venue_id == venue_id,
                Event.start_time >= start_date,
                Event.end_time <= end_date
            ).all()
            
            return {'events': [event.to_dict() for event in events]}
        except Exception as e:
            return {'error': str(e)} 