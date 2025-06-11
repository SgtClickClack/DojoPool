from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..models.feed import FeedEntry
from ..services.feed_service import FeedService
from ..core.extensions import db

bp = Blueprint('feed', __name__, url_prefix='/api/v1')

@bp.route('/feed', methods=['GET'])
@login_required
def get_feed():
    """Get the activity feed for the current user"""
    try:
        # Get query parameters
        limit = min(int(request.args.get('limit', 20)), 100)  # Cap at 100
        offset = max(int(request.args.get('offset', 0)), 0)
        since_str = request.args.get('since')
        
        # Parse since parameter if provided
        since = None
        if since_str:
            try:
                since = datetime.fromisoformat(since_str.replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid since parameter format. Use ISO 8601 format.'
                }), 400
        
        # Get feed entries
        feed_service = FeedService(db.session)
        entries = feed_service.get_feed(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            since=since
        )
        
        # Convert entries to dictionaries
        feed_data = [entry.to_dict() for entry in entries]
        
        return jsonify({
            'status': 'success',
            'data': {
                'entries': feed_data,
                'pagination': {
                    'limit': limit,
                    'offset': offset,
                    'has_more': len(feed_data) == limit
                }
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching feed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500

@bp.route('/feed', methods=['POST'])
@login_required
def create_feed_entry():
    """Create a new feed entry"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400
            
        entry_type = data.get('type')
        content = data.get('content')
        
        if not entry_type or not content:
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: type and content'
            }), 400
            
        feed_service = FeedService(db.session)
        entry = feed_service.add_feed_entry(
            user_id=current_user.id,
            entry_type=entry_type,
            content=content
        )
        
        return jsonify({
            'status': 'success',
            'data': entry.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error creating feed entry: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500 