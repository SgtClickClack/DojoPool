from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from src.core.models import Game, Venue, db
from src.core.auth.utils import admin_required
from datetime import datetime

bp = Blueprint('games', __name__, url_prefix='/games')

@bp.route('/', methods=['GET'])
def list_games():
    """List all games."""
    # Get query parameters for filtering
    venue_id = request.args.get('venue_id', type=int)
    player_id = request.args.get('player_id', type=int)
    tournament_id = request.args.get('tournament_id', type=int)
    status = request.args.get('status')
    
    # Build query
    query = Game.query
    
    if venue_id:
        query = query.filter_by(venue_id=venue_id)
    if player_id:
        query = query.filter_by(player_id=player_id)
    if tournament_id:
        query = query.filter_by(tournament_id=tournament_id)
    if status:
        query = query.filter_by(status=status)
    
    games = query.all()
    return jsonify({
        'status': 'success',
        'data': {
            'games': [game.to_dict() for game in games]
        }
    })

@bp.route('/<int:game_id>', methods=['GET'])
def get_game(game_id):
    """Get game details."""
    game = Game.query.get_or_404(game_id)
    return jsonify({
        'status': 'success',
        'data': {
            'game': game.to_dict()
        }
    })

@bp.route('/', methods=['POST'])
@login_required
def create_game():
    """Create a new game."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['venue_id']
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
    
    # Create game
    game = Game(
        player_id=current_user.id,
        venue_id=data['venue_id'],
        tournament_id=data.get('tournament_id'),
        start_time=datetime.utcnow(),
        status='in_progress',
        game_type=data.get('game_type', 'standard')
    )
    
    try:
        db.session.add(game)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Game created successfully',
            'data': {
                'game': game.to_dict()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:game_id>', methods=['PUT'])
@login_required
def update_game(game_id):
    """Update game details."""
    game = Game.query.get_or_404(game_id)
    
    # Only player or admin can update
    if game.player_id != current_user.id and not current_user.is_admin:
        return jsonify({
            'status': 'error',
            'message': 'Not authorized to update this game'
        }), 403
    
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['score', 'status', 'end_time']
    for field in allowed_fields:
        if field in data:
            setattr(game, field, data[field])
    
    try:
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Game updated successfully',
            'data': {
                'game': game.to_dict()
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:game_id>', methods=['DELETE'])
@login_required
def delete_game(game_id):
    """Delete a game."""
    game = Game.query.get_or_404(game_id)
    
    # Only player or admin can delete
    if game.player_id != current_user.id and not current_user.is_admin:
        return jsonify({
            'status': 'error',
            'message': 'Not authorized to delete this game'
        }), 403
    
    try:
        db.session.delete(game)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Game deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/<int:game_id>/end', methods=['POST'])
@login_required
def end_game(game_id):
    """End a game."""
    game = Game.query.get_or_404(game_id)
    
    # Only player or admin can end game
    if game.player_id != current_user.id and not current_user.is_admin:
        return jsonify({
            'status': 'error',
            'message': 'Not authorized to end this game'
        }), 403
    
    # Verify game is in progress
    if game.status != 'in_progress':
        return jsonify({
            'status': 'error',
            'message': 'Game is not in progress'
        }), 400
    
    data = request.get_json()
    
    try:
        game.end_time = datetime.utcnow()
        game.status = 'completed'
        game.score = data.get('score')
        
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Game ended successfully',
            'data': {
                'game': game.to_dict()
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 