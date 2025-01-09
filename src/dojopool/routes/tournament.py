"""Routes for tournament management and bracket operations."""
from flask import Blueprint, jsonify, request, g, current_app
from marshmallow import ValidationError
from flask_login import login_required, current_user

from dojopool.core.auth import login_required
from dojopool.services.tournament_service import TournamentService
from dojopool.services.prize_service import PrizeService
from dojopool.schemas.tournament import (
    TournamentSchema, TournamentParticipantSchema,
    TournamentMatchSchema
)

bp = Blueprint('tournament', __name__, url_prefix='/api/tournaments')
tournament_service = TournamentService()
prize_service = PrizeService()

@bp.route('/', methods=['GET'])
def get_tournaments():
    """Get list of tournaments with optional filtering."""
    try:
        limit = int(request.args.get('limit', 10))
        offset = int(request.args.get('offset', 0))
        filters = {
            'venue_id': request.args.get('venue_id', type=int),
            'status': request.args.get('status')
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        tournaments = tournament_service.get_tournaments(
            limit=limit,
            offset=offset,
            filters=filters
        )
        return jsonify(TournamentSchema(many=True).dump(tournaments))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:tournament_id>', methods=['GET'])
def get_tournament(tournament_id):
    """Get tournament details by ID."""
    tournament = tournament_service.get_tournament(tournament_id)
    if not tournament:
        return jsonify({'error': 'Tournament not found'}), 404
        
    return jsonify(TournamentSchema().dump(tournament))

@bp.route('/', methods=['POST'])
@login_required
def create_tournament():
    """Create a new tournament."""
    try:
        data = TournamentSchema().load(request.get_json())
        tournament = tournament_service.create_tournament(data)
        return jsonify(TournamentSchema().dump(tournament)), 201
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:tournament_id>', methods=['PUT'])
@login_required
def update_tournament(tournament_id):
    """Update tournament details."""
    try:
        data = TournamentSchema().load(request.get_json(), partial=True)
        tournament = tournament_service.update_tournament(tournament_id, data)
        
        if not tournament:
            return jsonify({'error': 'Tournament not found'}), 404
            
        return jsonify(TournamentSchema().dump(tournament))
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:tournament_id>/register', methods=['POST'])
@login_required
def register_participant(tournament_id):
    """Register for a tournament."""
    try:
        participant = tournament_service.register_participant(
            tournament_id=tournament_id,
            user_id=g.user.id
        )
        return jsonify(TournamentParticipantSchema().dump(participant)), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:tournament_id>/bracket', methods=['POST'])
@login_required
def generate_bracket(tournament_id):
    """Generate tournament bracket."""
    try:
        bracket_data = tournament_service.generate_bracket(tournament_id)
        return jsonify(bracket_data)
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:tournament_id>/matches', methods=['GET'])
def get_matches(tournament_id):
    """Get tournament matches."""
    try:
        round_number = request.args.get('round', type=int)
        matches = tournament_service.get_tournament_matches(
            tournament_id=tournament_id,
            round_number=round_number
        )
        return jsonify(TournamentMatchSchema(many=True).dump(matches))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/matches/<int:match_id>', methods=['PUT'])
@login_required
def update_match(match_id):
    """Update match details and progress tournament."""
    try:
        data = TournamentMatchSchema().load(request.get_json(), partial=True)
        match = tournament_service.update_match(match_id, data)
        
        if not match:
            return jsonify({'error': 'Match not found'}), 404
            
        return jsonify(TournamentMatchSchema().dump(match))
        
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:tournament_id>/participants/<int:participant_id>/matches', methods=['GET'])
def get_participant_matches(tournament_id, participant_id):
    """Get matches for a participant in a tournament."""
    try:
        matches = tournament_service.get_participant_matches(
            tournament_id=tournament_id,
            participant_id=participant_id
        )
        return jsonify(TournamentMatchSchema(many=True).dump(matches))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/prizes/unclaimed', methods=['GET'])
@login_required
def get_unclaimed_prizes():
    """Get unclaimed prizes for current user."""
    limit = request.args.get('limit', 10, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    prizes = prize_service.get_unclaimed_prizes(
        current_user.id,
        limit=limit,
        offset=offset
    )
    return jsonify(prizes)

@bp.route('/prizes/history', methods=['GET'])
@login_required
def get_prize_history():
    """Get prize history for current user."""
    limit = request.args.get('limit', 10, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    prizes = prize_service.get_prize_history(
        current_user.id,
        limit=limit,
        offset=offset
    )
    return jsonify(prizes)

@bp.route('/prizes/claim', methods=['POST'])
@login_required
def claim_prize():
    """Claim a prize."""
    data = request.get_json()
    participant_id = data.get('participant_id')
    tournament_id = data.get('tournament_id')
    
    if not participant_id or not tournament_id:
        return jsonify({
            'error': 'Missing required fields'
        }), 400
    
    try:
        prize = prize_service.claim_prize(participant_id, tournament_id)
        return jsonify(prize)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:tournament_id>/prize-rule', methods=['POST'])
@login_required
def configure_prize_rule(tournament_id):
    """Configure prize distribution rule for a tournament."""
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid distribution data'}), 400
    
    try:
        prize_service.configure_custom_rule(data)
        prize_service.distribute_prizes(tournament_id, rule_name='custom')
        return jsonify({'message': 'Prize rule configured successfully'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400 