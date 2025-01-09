from flask import Blueprint, request, jsonify
from typing import Dict, Any
from datetime import datetime
from src.services.offline_sync_service import OfflineSyncService
from src.utils.auth import login_required, get_current_user
from src.utils.validation import validate_request_data

offline_sync_bp = Blueprint('offline_sync', __name__)
sync_service = OfflineSyncService()

@offline_sync_bp.route('/sync', methods=['POST'])
@login_required
def sync_offline_data():
    """Synchronize offline data with server."""
    try:
        data = request.get_json()
        validate_request_data(data, ['matches', 'shots', 'stats'])
        
        user = get_current_user()
        result = sync_service.sync_offline_data(
            user_id=user.id,
            matches=data['matches'],
            shots=data['shots'],
            stats=data['stats']
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Data synchronized successfully',
            'result': result
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400

@offline_sync_bp.route('/status', methods=['GET'])
@login_required
def get_sync_status():
    """Get offline sync status."""
    try:
        user = get_current_user()
        status = sync_service.get_sync_status(user.id)
        
        return jsonify(status)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400

@offline_sync_bp.route('/conflicts', methods=['GET'])
@login_required
def get_sync_conflicts():
    """Get offline sync conflicts."""
    try:
        user = get_current_user()
        conflicts = sync_service.get_sync_conflicts(user.id)
        
        return jsonify({
            'status': 'success',
            'conflicts': conflicts
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400

@offline_sync_bp.route('/resolve', methods=['POST'])
@login_required
def resolve_sync_conflict():
    """Resolve offline sync conflict."""
    try:
        data = request.get_json()
        validate_request_data(data, ['conflict_id', 'resolution'])
        
        user = get_current_user()
        result = sync_service.resolve_conflict(
            user_id=user.id,
            conflict_id=data['conflict_id'],
            resolution=data['resolution']
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Conflict resolved successfully',
            'result': result
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400 