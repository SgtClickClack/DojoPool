from flask import Blueprint, request, jsonify
from typing import Dict, Any
from datetime import datetime
from src.utils.auth import login_required, get_current_user
from src.services.push_notification_service import PushNotificationService
from src.models.notification_settings import NotificationSettings
from src.models.device import Device

notifications_bp = Blueprint('notifications', __name__)
notification_service = PushNotificationService()

@notifications_bp.route('/register', methods=['POST'])
@login_required
def register_device():
    """Register a device for push notifications."""
    try:
        data = request.get_json()
        validate_request_data(data, ['device_token', 'platform'])
        
        user = get_current_user()
        device = Device(
            user_id=user.id,
            token=data['device_token'],
            platform=data['platform'],
            app_version=data.get('app_version'),
            os_version=data.get('os_version')
        )
        
        db.session.add(device)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Device registered successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400

@notifications_bp.route('/settings', methods=['GET'])
@login_required
def get_notification_settings():
    """Get user's notification settings."""
    try:
        user = get_current_user()
        settings = NotificationSettings.query.filter_by(user_id=user.id).first()
        
        if not settings:
            settings = NotificationSettings(user_id=user.id)
            db.session.add(settings)
            db.session.commit()
        
        return jsonify(settings.to_dict())
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400

@notifications_bp.route('/settings', methods=['PUT'])
@login_required
def update_notification_settings():
    """Update user's notification settings."""
    try:
        data = request.get_json()
        user = get_current_user()
        settings = NotificationSettings.query.filter_by(user_id=user.id).first()
        
        if not settings:
            settings = NotificationSettings(user_id=user.id)
            db.session.add(settings)
        
        # Update settings
        for field in ['match_updates', 'achievements', 'friend_activity', 
                     'venue_updates', 'promotions', 'system_updates']:
            if field in data:
                setattr(settings, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Settings updated successfully',
            'settings': settings.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400

@notifications_bp.route('/unregister', methods=['POST'])
@login_required
def unregister_device():
    """Unregister a device from push notifications."""
    try:
        data = request.get_json()
        validate_request_data(data, ['device_token'])
        
        user = get_current_user()
        device = Device.query.filter_by(
            user_id=user.id,
            token=data['device_token']
        ).first()
        
        if device:
            db.session.delete(device)
            db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Device unregistered successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400

@notifications_bp.route('/test', methods=['POST'])
@login_required
def send_test_notification():
    """Send a test notification to the user's devices."""
    try:
        user = get_current_user()
        notification_service.send_test_notification(user.id)
        
        return jsonify({
            'status': 'success',
            'message': 'Test notification sent successfully'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400 