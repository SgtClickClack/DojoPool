from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from src.core.models import Tournament, Venue, Game, User, db
from src.core.auth.utils import admin_required
from datetime import datetime

bp = Blueprint('tournaments', __name__, url_prefix='/tournaments')

@bp.route('/', methods=['GET'])
def list_tournaments():
    """List all tournaments."""
    # Get query parameters for filtering
    venue_id = request.args.get('venue_id', type=int)
    status = request.args.get('status')
    
    # Build query
    query = Tournament.query
    
    if venue_id:
        query = query.filter_by(venue_id=venue_id)
    if status:
        query = query.filter_by(status=status)
    
    tournaments = query.all()
    return jsonify({
        'status': 'success',
        'data': {
            'tournaments': [tournament.to_dict() for tournament in tournaments]
        }
    })

@bp.route('/<int:tournament_id>', methods=['GET'])
def get_tournament(tournament_id):
    """Get tournament details."""
    tournament = Tournament.query.get_or_404(tournament_id)
    return jsonify({
        'status': 'success',
        'data': {
            'tournament': tournament.to_dict()
        }
    })

@bp.route('/', methods=['POST'])
@admin_required
def create_tournament(admin_user):
    """Create a new tournament."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['venue_id', 'name', 'start_date', 'end_date']
    if not all(field in data for field in required_fields):
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields'
        }), 400
    
    # Verify venue exists
    venue = Venue.query.get_or_404(data['venue_id'])
    if not venue.is_active:
        return jsonify({
            'status': 'error',
            'message': 'Venue is not active'
        }), 400
    
    # Create tournament
    tournament = Tournament(
        venue_id=data['venue_id'],
        name=data['name'],
        description=data.get('description'),
        start_date=datetime.fromisoformat(data['start_date']),
        end_date=datetime.fromisoformat(data['end_date']),
        max_participants=data.get('max_participants'),
        entry_fee=data.get('entry_fee'),
        prize_pool=data.get('prize_pool'),
        tournament_type=data.get('tournament_type', 'single_elimination'),
        status='upcoming',
        rules=data.get('rules', {}),
        created_at=datetime.utcnow()
    )
    
    try:
        db.session.add(tournament)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Tournament created successfully',
            'data': {
                'tournament': tournament.to_dict()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:tournament_id>', methods=['PUT'])
@admin_required
def update_tournament(admin_user, tournament_id):
    """Update tournament details."""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    # Only venue owner or admin can update
    venue = Venue.query.get(tournament.venue_id)
    if venue.owner_id != admin_user.id and not admin_user.is_admin:
        return jsonify({
            'status': 'error',
            'message': 'Not authorized to update this tournament'
        }), 403
    
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = [
        'name', 'description', 'start_date', 'end_date',
        'max_participants', 'entry_fee', 'prize_pool',
        'tournament_type', 'status', 'rules'
    ]
    for field in allowed_fields:
        if field in data:
            if field in ['start_date', 'end_date']:
                setattr(tournament, field, datetime.fromisoformat(data[field]))
            else:
                setattr(tournament, field, data[field])
    
    try:
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Tournament updated successfully',
            'data': {
                'tournament': tournament.to_dict()
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:tournament_id>', methods=['DELETE'])
@admin_required
def delete_tournament(admin_user, tournament_id):
    """Delete a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    # Only venue owner or admin can delete
    venue = Venue.query.get(tournament.venue_id)
    if venue.owner_id != admin_user.id and not admin_user.is_admin:
        return jsonify({
            'status': 'error',
            'message': 'Not authorized to delete this tournament'
        }), 403
    
    try:
        db.session.delete(tournament)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Tournament deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:tournament_id>/register', methods=['POST'])
@login_required
def register_for_tournament(tournament_id):
    """Register current user for a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    # Verify tournament is accepting registrations
    if tournament.status != 'upcoming':
        return jsonify({
            'status': 'error',
            'message': 'Tournament is not accepting registrations'
        }), 400
    
    # Check if tournament is full
    if tournament.max_participants and len(tournament.participants) >= tournament.max_participants:
        return jsonify({
            'status': 'error',
            'message': 'Tournament is full'
        }), 400
    
    # Check if user is already registered
    if current_user in tournament.participants:
        return jsonify({
            'status': 'error',
            'message': 'Already registered for this tournament'
        }), 400
    
    try:
        tournament.participants.append(current_user)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Successfully registered for tournament'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:tournament_id>/unregister', methods=['POST'])
@login_required
def unregister_from_tournament(tournament_id):
    """Unregister current user from a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    # Verify tournament hasn't started
    if tournament.status != 'upcoming':
        return jsonify({
            'status': 'error',
            'message': 'Cannot unregister from tournament that has started'
        }), 400
    
    # Check if user is registered
    if current_user not in tournament.participants:
        return jsonify({
            'status': 'error',
            'message': 'Not registered for this tournament'
        }), 400
    
    try:
        tournament.participants.remove(current_user)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Successfully unregistered from tournament'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:tournament_id>/start', methods=['POST'])
@admin_required
def start_tournament(admin_user, tournament_id):
    """Start a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    # Only venue owner or admin can start
    venue = Venue.query.get(tournament.venue_id)
    if venue.owner_id != admin_user.id and not admin_user.is_admin:
        return jsonify({
            'status': 'error',
            'message': 'Not authorized to start this tournament'
        }), 403
    
    # Verify tournament can be started
    if tournament.status != 'upcoming':
        return jsonify({
            'status': 'error',
            'message': 'Tournament cannot be started'
        }), 400
    
    if len(tournament.participants) < 2:
        return jsonify({
            'status': 'error',
            'message': 'Not enough participants to start tournament'
        }), 400
    
    try:
        tournament.status = 'in_progress'
        tournament.start_date = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Tournament started successfully',
            'data': {
                'tournament': tournament.to_dict()
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:tournament_id>/end', methods=['POST'])
@admin_required
def end_tournament(admin_user, tournament_id):
    """End a tournament."""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    # Only venue owner or admin can end
    venue = Venue.query.get(tournament.venue_id)
    if venue.owner_id != admin_user.id and not admin_user.is_admin:
        return jsonify({
            'status': 'error',
            'message': 'Not authorized to end this tournament'
        }), 403
    
    # Verify tournament can be ended
    if tournament.status != 'in_progress':
        return jsonify({
            'status': 'error',
            'message': 'Tournament is not in progress'
        }), 400
    
    try:
        tournament.status = 'completed'
        tournament.end_date = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Tournament ended successfully',
            'data': {
                'tournament': tournament.to_dict()
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 