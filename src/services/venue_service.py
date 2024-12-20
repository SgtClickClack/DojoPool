from datetime import datetime
from sqlalchemy import and_, or_
from src.models import db
from src.models.venue import Venue, VenueAvailability, VenueBooking
from src.core.exceptions import NotFoundError, ValidationError

class VenueService:
    @staticmethod
    def create_venue(data, owner_id):
        """Create a new venue"""
        venue = Venue(
            name=data['name'],
            address=data['address'],
            description=data.get('description'),
            contact_info=data.get('contact_info'),
            opening_hours=data.get('opening_hours', {}),
            tables_count=data['tables_count'],
            hourly_rate=data.get('hourly_rate'),
            amenities=data.get('amenities', []),
            images=data.get('images', []),
            owner_id=owner_id
        )
        db.session.add(venue)
        db.session.commit()
        return venue

    @staticmethod
    def update_venue(venue_id, data):
        """Update venue details"""
        venue = Venue.query.get(venue_id)
        if not venue:
            raise NotFoundError('Venue not found')

        for key, value in data.items():
            if hasattr(venue, key):
                setattr(venue, key, value)
        
        db.session.commit()
        return venue

    @staticmethod
    def get_venue(venue_id):
        """Get venue details"""
        venue = Venue.query.get(venue_id)
        if not venue:
            raise NotFoundError('Venue not found')
        return venue

    @staticmethod
    def list_venues(filters=None, page=1, per_page=20):
        """List venues with optional filters"""
        query = Venue.query

        if filters:
            if 'status' in filters:
                query = query.filter(Venue.status == filters['status'])
            if 'owner_id' in filters:
                query = query.filter(Venue.owner_id == filters['owner_id'])
            # Add more filters as needed

        return query.paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def check_availability(venue_id, start_time, end_time, table_number=None):
        """Check venue availability for given time period"""
        query = VenueAvailability.query.filter(
            VenueAvailability.venue_id == venue_id,
            VenueAvailability.status == 'available',
            or_(
                and_(
                    VenueAvailability.start_time <= start_time,
                    VenueAvailability.end_time > start_time
                ),
                and_(
                    VenueAvailability.start_time < end_time,
                    VenueAvailability.end_time >= end_time
                )
            )
        )

        if table_number:
            query = query.filter(VenueAvailability.table_number == table_number)

        return query.all()

    @staticmethod
    def create_booking(user_id, venue_id, data):
        """Create a new venue booking"""
        # Validate availability
        if not VenueService.check_availability(
            venue_id, 
            data['start_time'], 
            data['end_time'],
            data.get('table_number')
        ):
            raise ValidationError('Venue not available for selected time period')

        # Calculate booking amount
        venue = Venue.query.get(venue_id)
        duration = (data['end_time'] - data['start_time']).total_seconds() / 3600  # hours
        amount = duration * venue.hourly_rate

        booking = VenueBooking(
            venue_id=venue_id,
            user_id=user_id,
            table_number=data['table_number'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            amount=amount,
            notes=data.get('notes')
        )

        # Update availability
        availability = VenueAvailability(
            venue_id=venue_id,
            table_number=data['table_number'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            status='booked',
            booking_id=booking.id
        )

        db.session.add(booking)
        db.session.add(availability)
        db.session.commit()
        return booking

    @staticmethod
    def update_booking_status(booking_id, status):
        """Update booking status"""
        booking = VenueBooking.query.get(booking_id)
        if not booking:
            raise NotFoundError('Booking not found')

        booking.status = status
        if status == 'cancelled':
            # Update availability status
            VenueAvailability.query.filter_by(booking_id=booking_id).update({
                'status': 'available'
            })

        db.session.commit()
        return booking

    @staticmethod
    def get_venue_stats(venue_id):
        """Get venue statistics"""
        venue = Venue.query.get(venue_id)
        if not venue:
            raise NotFoundError('Venue not found')

        total_bookings = venue.bookings.count()
        completed_bookings = venue.bookings.filter_by(status='completed').count()
        total_revenue = db.session.query(
            db.func.sum(VenueBooking.amount)
        ).filter(
            VenueBooking.venue_id == venue_id,
            VenueBooking.status == 'completed'
        ).scalar() or 0

        return {
            'total_bookings': total_bookings,
            'completed_bookings': completed_bookings,
            'total_revenue': total_revenue,
            'average_rating': venue.ratings.with_entities(
                db.func.avg(Rating.score)
            ).scalar() or 0
        } 