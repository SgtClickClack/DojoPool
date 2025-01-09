from flask import Blueprint, jsonify, request
from datetime import datetime
from src.services.venue_management_service import VenueManagementService
from src.utils.auth import login_required, admin_required, get_current_user
from src.utils.validation import validate_request_data
from src.extensions import db

venue_management_bp = Blueprint('venue_management', __name__)
venue_service = VenueManagementService()

@venue_management_bp.route('/create', methods=['POST'])
@admin_required
def create_venue():
    """Create a new venue."""
    try:
        data = request.get_json()
        validate_request_data(data, [
            'name', 'address', 'latitude', 'longitude',
            'venue_type', 'tables', 'owner_id'
        ])
        
        result = venue_service.create_venue(data)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@venue_management_bp.route('/<int:venue_id>/update', methods=['PUT'])
@admin_required
def update_venue(venue_id):
    """Update venue details."""
    try:
        data = request.get_json()
        result = venue_service.update_venue(venue_id, data)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@venue_management_bp.route('/<int:venue_id>/delete', methods=['DELETE'])
@admin_required
def delete_venue(venue_id):
    """Delete a venue."""
    try:
        result = venue_service.delete_venue(venue_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@venue_management_bp.route('/<int:venue_id>/staff', methods=['GET'])
@admin_required
def get_venue_staff(venue_id):
    """Get venue staff list."""
    try:
        staff = venue_service.get_venue_staff(venue_id)
        return jsonify(staff)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@venue_management_bp.route('/<int:venue_id>/staff/add', methods=['POST'])
@admin_required
def add_staff_member(venue_id):
    """Add a staff member to venue."""
    try:
        data = request.get_json()
        validate_request_data(data, ['user_id', 'role'])
        
        result = venue_service.add_staff_member(
            venue_id=venue_id,
            user_id=data['user_id'],
            role=data['role']
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@venue_management_bp.route('/<int:venue_id>/staff/<int:user_id>/remove', methods=['DELETE'])
@admin_required
def remove_staff_member(venue_id, user_id):
    """Remove a staff member from venue."""
    try:
        result = venue_service.remove_staff_member(venue_id, user_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@venue_management_bp.route('/<int:venue_id>/hours', methods=['PUT'])
@admin_required
def update_venue_hours(venue_id):
    """Update venue operating hours."""
    try:
        data = request.get_json()
        validate_request_data(data, ['hours'])
        
        result = venue_service.update_venue_hours(venue_id, data['hours'])
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@venue_management_bp.route('/<int:venue_id>/tables', methods=['PUT'])
@admin_required
def update_venue_tables(venue_id):
    """Update venue table configuration."""
    try:
        data = request.get_json()
        validate_request_data(data, ['tables'])
        
        result = venue_service.update_venue_tables(venue_id, data['tables'])
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500 