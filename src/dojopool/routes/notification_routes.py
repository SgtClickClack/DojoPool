"""Notification routes module."""
from flask import Blueprint, jsonify, request, render_template
from flask_login import login_required, current_user

from src.services.notification_service import NotificationService

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/notifications')
@login_required
def notifications_page():
    """Render the notifications page."""
    return render_template('notifications.html')

@notification_bp.route('/api/notifications/')
@login_required
def get_notifications():
    """Get user notifications with pagination and filtering."""
    page = request.args.get('page', 1, type=int)
    notification_type = request.args.get('type', 'all')
    status = request.args.get('status', 'all')
    time_filter = request.args.get('time', 'all')
    
    notifications, has_more = NotificationService.get_user_notifications(
        current_user.id,
        page=page,
        notification_type=notification_type,
        status=status,
        time_filter=time_filter
    )
    
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'has_more': has_more
    })

@notification_bp.route('/api/notifications/unread-count')
@login_required
def get_unread_count():
    """Get the count of unread notifications for the current user."""
    count = NotificationService.get_unread_count(current_user.id)
    return jsonify({'count': count})

@notification_bp.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_as_read(notification_id):
    """Mark a specific notification as read."""
    try:
        NotificationService.mark_as_read(notification_id, current_user.id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@notification_bp.route('/api/notifications/mark-all-read', methods=['POST'])
@login_required
def mark_all_as_read():
    """Mark all notifications as read for the current user."""
    try:
        NotificationService.mark_all_as_read(current_user.id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@notification_bp.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
@login_required
def delete_notification(notification_id):
    """Delete a specific notification."""
    try:
        NotificationService.delete_notification(notification_id, current_user.id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@notification_bp.route('/api/notifications/settings', methods=['GET', 'PUT'])
@login_required
def notification_settings():
    """Get or update notification settings."""
    if request.method == 'GET':
        settings = NotificationService.get_notification_settings(current_user.id)
        return jsonify(settings)
    else:
        data = request.get_json()
        try:
            settings = NotificationService.update_notification_settings(current_user.id, data)
            return jsonify(settings)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
