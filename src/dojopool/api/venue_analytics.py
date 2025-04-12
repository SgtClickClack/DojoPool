"""
Venue Analytics API Module

This module provides API endpoints for accessing venue analytics data.
"""

from datetime import datetime
from typing import Optional
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.venue_analytics_service import VenueAnalyticsService
from ..core.models.venue import Venue
from ..core.extensions import db

bp = Blueprint('venue_analytics', __name__, url_prefix='/api/venue-analytics')
analytics_service = VenueAnalyticsService()

@bp.route('/<int:venue_id>', methods=['GET'])
@jwt_required()
def get_venue_analytics(venue_id: int):
    """Get analytics data for a specific venue.
    
    Args:
        venue_id: ID of the venue to get analytics for
        
    Returns:
        JSON response containing venue analytics data
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        
        # Verify venue exists and user has access
        venue = Venue.query.get_or_404(venue_id)
        if venue.owner_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
            
        # Get date range parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Parse dates
        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None
        
        # Validate dates
        if not start_date or not end_date:
            return jsonify({'error': 'Missing start_date or end_date parameters'}), 400
            
        if start_date > end_date:
            return jsonify({'error': 'start_date must be before end_date'}), 400
            
        # Get analytics data
        analytics = analytics_service.get_venue_analytics(venue_id, start_date, end_date)
        
        return jsonify(analytics)
        
    except ValueError as e:
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:venue_id>/export', methods=['GET'])
@jwt_required()
def export_venue_analytics(venue_id: int):
    """Export venue analytics data in various formats.
    
    Args:
        venue_id: ID of the venue to export analytics for
        
    Returns:
        File download containing analytics data in requested format
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        
        # Verify venue exists and user has access
        venue = Venue.query.get_or_404(venue_id)
        if venue.owner_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
            
        # Get export parameters
        format = request.args.get('format', 'csv')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Parse dates
        start_date = datetime.fromisoformat(start_date_str) if start_date_str else None
        end_date = datetime.fromisoformat(end_date_str) if end_date_str else None
        
        # Validate dates
        if not start_date or not end_date:
            return jsonify({'error': 'Missing start_date or end_date parameters'}), 400
            
        if start_date > end_date:
            return jsonify({'error': 'start_date must be before end_date'}), 400
            
        # Get analytics data
        analytics = analytics_service.get_venue_analytics(venue_id, start_date, end_date)
        
        # Export in requested format
        if format == 'csv':
            # TODO: Implement CSV export
            return jsonify({'error': 'CSV export not yet implemented'}), 501
        elif format == 'json':
            return jsonify(analytics)
        elif format == 'pdf':
            # TODO: Implement PDF export
            return jsonify({'error': 'PDF export not yet implemented'}), 501
        else:
            return jsonify({'error': 'Unsupported export format'}), 400
            
    except ValueError as e:
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500 