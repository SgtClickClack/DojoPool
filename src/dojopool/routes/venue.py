"""Routes for venue management, check-ins, and leaderboards."""
from flask import Blueprint, jsonify, request, g
from marshmallow import ValidationError

from dojopool.core.auth import login_required
from dojopool.services.venue_service import VenueService
from dojopool.services.checkin_service import CheckInService
from dojopool.schemas.venue import (
    VenueSchema, VenueCheckInSchema,
    VenueLeaderboardSchema, VenueEventSchema
)

bp = Blueprint('venue', __name__, url_prefix='/api/venues')
venue_service = VenueService()
checkin_service = CheckInService()

@bp.route('/', methods=['GET'])
def get_venues():
    """Get list of venues with optional filtering."""
    try:
        limit = int(request.args.get('limit', 10))
        offset = int(request.args.get('offset', 0))
        filters = {
            'name': request.args.get('name'),
            'is_verified': request.args.get('is_verified', type=bool)
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        venues = VenueService.get_venues(limit=limit, offset=offset, filters=filters)
        return jsonify(VenueSchema(many=True).dump(venues))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>', methods=['GET'])
def get_venue(venue_id):
    """Get venue details by ID."""
    venue = VenueService.get_venue(venue_id)
    if not venue:
        return jsonify({'error': 'Venue not found'}), 404
        
    return jsonify(VenueSchema().dump(venue))

@bp.route('/', methods=['POST'])
@login_required
def create_venue():
    """Create a new venue."""
    try:
        data = VenueSchema().load(request.get_json())
        venue = VenueService.create_venue(data)
        return jsonify(VenueSchema().dump(venue)), 201
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>', methods=['PUT'])
@login_required
def update_venue(venue_id):
    """Update venue details."""
    try:
        data = VenueSchema().load(request.get_json(), partial=True)
        venue = VenueService.update_venue(venue_id, data)
        
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
            
        return jsonify(VenueSchema().dump(venue))
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/check-in', methods=['POST'])
@login_required
def check_in(venue_id):
    """Check in at a venue."""
    try:
        data = request.get_json() or {}
        checkin = checkin_service.check_in(
            user_id=g.user.id,
            venue_id=venue_id,
            table_number=data.get('table_number'),
            game_type=data.get('game_type')
        )
        return jsonify(VenueCheckInSchema().dump(checkin)), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/check-out', methods=['POST'])
@login_required
def check_out(venue_id):
    """Check out from a venue."""
    try:
        checkin = checkin_service.check_out(
            user_id=g.user.id,
            venue_id=venue_id
        )
        return jsonify(VenueCheckInSchema().dump(checkin))
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/active-checkins', methods=['GET'])
def get_active_checkins(venue_id):
    """Get active check-ins for a venue."""
    try:
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        checkins = checkin_service.get_active_checkins(
            venue_id=venue_id,
            limit=limit,
            offset=offset
        )
        return jsonify(checkins)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/checkin-history', methods=['GET'])
def get_checkin_history(venue_id):
    """Get check-in history for a venue."""
    try:
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        checkins = checkin_service.get_checkin_history(
            venue_id=venue_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )
        return jsonify(checkins)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/occupancy-stats', methods=['GET'])
def get_occupancy_stats(venue_id):
    """Get occupancy statistics for a venue."""
    try:
        period = request.args.get('period', 'day')
        stats = checkin_service.get_occupancy_stats(
            venue_id=venue_id,
            period=period
        )
        return jsonify(stats)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/leaderboard', methods=['GET'])
def get_leaderboard(venue_id):
    """Get venue leaderboard."""
    try:
        limit = int(request.args.get('limit', 10))
        offset = int(request.args.get('offset', 0))
        
        entries = VenueService.get_venue_leaderboard(
            venue_id=venue_id,
            limit=limit,
            offset=offset
        )
        return jsonify(entries)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/leaderboard', methods=['POST'])
@login_required
def update_leaderboard(venue_id):
    """Update venue leaderboard after a game."""
    try:
        data = request.get_json()
        entry = VenueService.update_leaderboard(
            venue_id=venue_id,
            user_id=g.user.id,
            won=data['won'],
            points=data['points']
        )
        return jsonify(VenueLeaderboardSchema().dump(entry))
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/events', methods=['GET'])
def get_events(venue_id):
    """Get venue events."""
    try:
        limit = int(request.args.get('limit', 10))
        offset = int(request.args.get('offset', 0))
        status = request.args.get('status')
        
        events = VenueService.get_venue_events(
            venue_id=venue_id,
            status=status,
            limit=limit,
            offset=offset
        )
        return jsonify(VenueEventSchema(many=True).dump(events))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:venue_id>/events', methods=['POST'])
@login_required
def create_event(venue_id):
    """Create a new venue event."""
    try:
        data = VenueEventSchema().load(request.get_json())
        event = VenueService.create_event(venue_id, data)
        return jsonify(VenueEventSchema().dump(event)), 201
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/events/<int:event_id>/register', methods=['POST'])
@login_required
def register_for_event(event_id):
    """Register for a venue event."""
    try:
        participant = VenueService.register_for_event(event_id, g.user.id)
        return jsonify({'message': 'Successfully registered for event'}), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400 