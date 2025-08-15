"""
Social API Routes

This module provides comprehensive API endpoints for managing social relationships,
including friends, clans, enemies, and messaging functionality.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_
from datetime import datetime
from typing import Dict, List, Optional, Any

from ..models.social import (
    Friendship, EnemyRelationship, Clan, ClanMember, ClanStats, 
    Message, SocialProfile, User, UserProfile, RelationshipStatus, 
    ClanRole, ClanRank
)
from ..core.extensions import db
from ..services.social.friend import FriendService
from ..utils.decorators import handle_errors

social_bp = Blueprint('social', __name__, url_prefix='/api/social')


# Friend Management Routes
@social_bp.route('/friends/request', methods=['POST'])
@jwt_required()
@handle_errors
def send_friend_request():
    """Send a friend request."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    receiver_id = data.get('receiver_id')
    
    if not receiver_id:
        return jsonify({'success': False, 'message': 'Receiver ID is required'}), 400
    
    if current_user_id == receiver_id:
        return jsonify({'success': False, 'message': 'Cannot send friend request to yourself'}), 400
    
    success, message = FriendService.send_friend_request(current_user_id, receiver_id)
    
    if success:
        return jsonify({'success': True, 'message': 'Friend request sent successfully'}), 200
    else:
        return jsonify({'success': False, 'message': message}), 400


@social_bp.route('/friends/<int:friendship_id>/accept', methods=['POST'])
@jwt_required()
@handle_errors
def accept_friend_request(friendship_id: int):
    """Accept a friend request."""
    current_user_id = get_jwt_identity()
    
    success, message = FriendService.accept_friend_request(friendship_id, current_user_id)
    
    if success:
        return jsonify({'success': True, 'message': 'Friend request accepted'}), 200
    else:
        return jsonify({'success': False, 'message': message}), 400


@social_bp.route('/friends/<int:friendship_id>/reject', methods=['POST'])
@jwt_required()
@handle_errors
def reject_friend_request(friendship_id: int):
    """Reject a friend request."""
    current_user_id = get_jwt_identity()
    
    success, message = FriendService.reject_friend_request(friendship_id, current_user_id)
    
    if success:
        return jsonify({'success': True, 'message': 'Friend request rejected'}), 200
    else:
        return jsonify({'success': False, 'message': message}), 400


@social_bp.route('/friends/block', methods=['POST'])
@jwt_required()
@handle_errors
def block_user():
    """Block a user."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    success, message = FriendService.block_user(current_user_id, user_id)
    
    if success:
        return jsonify({'success': True, 'message': 'User blocked successfully'}), 200
    else:
        return jsonify({'success': False, 'message': message}), 400


@social_bp.route('/friends', methods=['GET'])
@jwt_required()
@handle_errors
def get_friends():
    """Get user's friends."""
    current_user_id = get_jwt_identity()
    status = request.args.get('status')
    
    friendships = FriendService.get_friends(current_user_id, status)
    
    return jsonify({
        'success': True,
        'friendships': friendships
    }), 200


@social_bp.route('/friends/<int:friendship_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def remove_friend(friendship_id: int):
    """Remove a friend."""
    current_user_id = get_jwt_identity()
    
    # Check if friendship exists and user is part of it
    friendship = Friendship.query.get(friendship_id)
    if not friendship:
        return jsonify({'success': False, 'message': 'Friendship not found'}), 404
    
    if friendship.sender_id != current_user_id and friendship.receiver_id != current_user_id:
        return jsonify({'success': False, 'message': 'Not authorized'}), 403
    
    try:
        db.session.delete(friendship)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Friend removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# Enemy Management Routes
@social_bp.route('/enemies', methods=['POST'])
@jwt_required()
@handle_errors
def add_enemy():
    """Add an enemy."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    enemy_id = data.get('enemy_id')
    reason = data.get('reason')
    
    if not enemy_id:
        return jsonify({'success': False, 'message': 'Enemy ID is required'}), 400
    
    if current_user_id == enemy_id:
        return jsonify({'success': False, 'message': 'Cannot add yourself as enemy'}), 400
    
    # Check if enemy relationship already exists
    existing = EnemyRelationship.query.filter(
        or_(
            and_(EnemyRelationship.user_id == current_user_id, EnemyRelationship.enemy_id == enemy_id),
            and_(EnemyRelationship.user_id == enemy_id, EnemyRelationship.enemy_id == current_user_id)
        )
    ).first()
    
    if existing:
        return jsonify({'success': False, 'message': 'Enemy relationship already exists'}), 400
    
    try:
        enemy_relationship = EnemyRelationship(
            user_id=current_user_id,
            enemy_id=enemy_id,
            reason=reason
        )
        db.session.add(enemy_relationship)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Enemy added successfully',
            'enemy': enemy_relationship.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@social_bp.route('/enemies', methods=['GET'])
@jwt_required()
@handle_errors
def get_enemies():
    """Get user's enemies."""
    current_user_id = get_jwt_identity()
    
    enemies = EnemyRelationship.query.filter(
        or_(
            EnemyRelationship.user_id == current_user_id,
            EnemyRelationship.enemy_id == current_user_id
        )
    ).all()
    
    return jsonify({
        'success': True,
        'enemies': [enemy.to_dict() for enemy in enemies]
    }), 200


@social_bp.route('/enemies/<int:enemy_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def remove_enemy(enemy_id: int):
    """Remove an enemy."""
    current_user_id = get_jwt_identity()
    
    enemy_relationship = EnemyRelationship.query.filter(
        or_(
            and_(EnemyRelationship.user_id == current_user_id, EnemyRelationship.enemy_id == enemy_id),
            and_(EnemyRelationship.user_id == enemy_id, EnemyRelationship.enemy_id == current_user_id)
        )
    ).first()
    
    if not enemy_relationship:
        return jsonify({'success': False, 'message': 'Enemy relationship not found'}), 404
    
    try:
        db.session.delete(enemy_relationship)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Enemy removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# Clan Management Routes
@social_bp.route('/clans', methods=['POST'])
@jwt_required()
@handle_errors
def create_clan():
    """Create a new clan."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    name = data.get('name')
    tag = data.get('tag')
    description = data.get('description')
    home_venue_id = data.get('home_venue_id')
    
    if not name or not tag:
        return jsonify({'success': False, 'message': 'Name and tag are required'}), 400
    
    # Check if user is already in a clan
    existing_member = ClanMember.query.filter_by(user_id=current_user_id).first()
    if existing_member:
        return jsonify({'success': False, 'message': 'You are already in a clan'}), 400
    
    # Check if clan name or tag already exists
    existing_clan = Clan.query.filter(
        or_(Clan.name == name, Clan.tag == tag)
    ).first()
    if existing_clan:
        return jsonify({'success': False, 'message': 'Clan name or tag already exists'}), 400
    
    try:
        # Create clan
        clan = Clan(
            name=name,
            tag=tag,
            description=description,
            home_venue_id=home_venue_id,
            rank=ClanRank.BRONZE
        )
        db.session.add(clan)
        db.session.flush()  # Get the clan ID
        
        # Add creator as leader
        member = ClanMember(
            clan_id=clan.id,
            user_id=current_user_id,
            role=ClanRole.LEADER
        )
        db.session.add(member)
        
        # Create clan stats
        stats = ClanStats(clan_id=clan.id)
        db.session.add(stats)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Clan created successfully',
            'clan': clan.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@social_bp.route('/clans', methods=['GET'])
@jwt_required()
@handle_errors
def get_clans():
    """Get all clans."""
    clans = Clan.query.all()
    
    return jsonify({
        'success': True,
        'clans': [clan.to_dict() for clan in clans]
    }), 200


@social_bp.route('/clans/<int:clan_id>', methods=['GET'])
@jwt_required()
@handle_errors
def get_clan(clan_id: int):
    """Get specific clan details."""
    clan = Clan.query.get(clan_id)
    
    if not clan:
        return jsonify({'success': False, 'message': 'Clan not found'}), 404
    
    return jsonify({
        'success': True,
        'clan': clan.to_dict()
    }), 200


@social_bp.route('/clans/<int:clan_id>/join', methods=['POST'])
@jwt_required()
@handle_errors
def join_clan(clan_id: int):
    """Join a clan."""
    current_user_id = get_jwt_identity()
    
    # Check if user is already in a clan
    existing_member = ClanMember.query.filter_by(user_id=current_user_id).first()
    if existing_member:
        return jsonify({'success': False, 'message': 'You are already in a clan'}), 400
    
    clan = Clan.query.get(clan_id)
    if not clan:
        return jsonify({'success': False, 'message': 'Clan not found'}), 404
    
    try:
        member = ClanMember(
            clan_id=clan_id,
            user_id=current_user_id,
            role=ClanRole.MEMBER
        )
        db.session.add(member)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Joined clan successfully',
            'member': member.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@social_bp.route('/clans/<int:clan_id>/leave', methods=['POST'])
@jwt_required()
@handle_errors
def leave_clan(clan_id: int):
    """Leave a clan."""
    current_user_id = get_jwt_identity()
    
    member = ClanMember.query.filter_by(
        clan_id=clan_id,
        user_id=current_user_id
    ).first()
    
    if not member:
        return jsonify({'success': False, 'message': 'You are not a member of this clan'}), 404
    
    if member.role == ClanRole.LEADER:
        return jsonify({'success': False, 'message': 'Leader cannot leave clan. Transfer leadership first.'}), 400
    
    try:
        db.session.delete(member)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Left clan successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@social_bp.route('/clans/<int:clan_id>/members', methods=['GET'])
@jwt_required()
@handle_errors
def get_clan_members(clan_id: int):
    """Get clan members."""
    members = ClanMember.query.filter_by(clan_id=clan_id).all()
    
    return jsonify({
        'success': True,
        'members': [member.to_dict() for member in members]
    }), 200


@social_bp.route('/clans/<int:clan_id>/stats', methods=['GET'])
@jwt_required()
@handle_errors
def get_clan_stats(clan_id: int):
    """Get clan statistics."""
    stats = ClanStats.query.filter_by(clan_id=clan_id).first()
    
    if not stats:
        return jsonify({'success': False, 'message': 'Clan stats not found'}), 404
    
    return jsonify({
        'success': True,
        'stats': stats.to_dict()
    }), 200


@social_bp.route('/clans/<int:clan_id>/members/<int:member_id>/role', methods=['PUT'])
@jwt_required()
@handle_errors
def update_clan_role(clan_id: int, member_id: int):
    """Update clan member role."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    new_role = data.get('role')
    
    if not new_role or new_role not in [role.value for role in ClanRole]:
        return jsonify({'success': False, 'message': 'Valid role is required'}), 400
    
    # Check if current user is leader
    current_member = ClanMember.query.filter_by(
        clan_id=clan_id,
        user_id=current_user_id
    ).first()
    
    if not current_member or current_member.role != ClanRole.LEADER:
        return jsonify({'success': False, 'message': 'Only leader can change roles'}), 403
    
    # Get target member
    target_member = ClanMember.query.filter_by(
        clan_id=clan_id,
        user_id=member_id
    ).first()
    
    if not target_member:
        return jsonify({'success': False, 'message': 'Member not found'}), 404
    
    try:
        target_member.role = new_role
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Role updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@social_bp.route('/clans/<int:clan_id>/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
@handle_errors
def remove_clan_member(clan_id: int, member_id: int):
    """Remove clan member."""
    current_user_id = get_jwt_identity()
    
    # Check if current user has permission
    current_member = ClanMember.query.filter_by(
        clan_id=clan_id,
        user_id=current_user_id
    ).first()
    
    if not current_member:
        return jsonify({'success': False, 'message': 'You are not a member of this clan'}), 403
    
    target_member = ClanMember.query.filter_by(
        clan_id=clan_id,
        user_id=member_id
    ).first()
    
    if not target_member:
        return jsonify({'success': False, 'message': 'Member not found'}), 404
    
    # Check permissions
    if current_member.role == ClanRole.LEADER:
        if target_member.role == ClanRole.LEADER:
            return jsonify({'success': False, 'message': 'Cannot remove leader'}), 400
    elif current_member.role == ClanRole.OFFICER:
        if target_member.role not in [ClanRole.MEMBER, ClanRole.RECRUIT]:
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
    else:
        return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
    
    try:
        db.session.delete(target_member)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Member removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# Messaging Routes
@social_bp.route('/messages', methods=['POST'])
@jwt_required()
@handle_errors
def send_message():
    """Send a message."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    receiver_id = data.get('receiver_id')
    content = data.get('content')
    
    if not receiver_id or not content:
        return jsonify({'success': False, 'message': 'Receiver ID and content are required'}), 400
    
    if current_user_id == receiver_id:
        return jsonify({'success': False, 'message': 'Cannot send message to yourself'}), 400
    
    try:
        message = Message(
            sender_id=current_user_id,
            receiver_id=receiver_id,
            content=content
        )
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully',
            'message_data': message.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@social_bp.route('/messages/<int:user_id>', methods=['GET'])
@jwt_required()
@handle_errors
def get_messages(user_id: int):
    """Get messages between current user and another user."""
    current_user_id = get_jwt_identity()
    limit = request.args.get('limit', 50, type=int)
    
    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == current_user_id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user_id)
        )
    ).order_by(Message.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'success': True,
        'messages': [message.to_dict() for message in messages]
    }), 200


@social_bp.route('/messages/<int:message_id>/read', methods=['POST'])
@jwt_required()
@handle_errors
def mark_message_as_read(message_id: int):
    """Mark a message as read."""
    current_user_id = get_jwt_identity()
    
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'success': False, 'message': 'Message not found'}), 404
    
    if message.receiver_id != current_user_id:
        return jsonify({'success': False, 'message': 'Not authorized'}), 403
    
    try:
        message.is_read = True
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Message marked as read'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# User Search and Discovery Routes
@social_bp.route('/users/search', methods=['GET'])
@jwt_required()
@handle_errors
def search_users():
    """Search for users."""
    query = request.args.get('q', '')
    limit = request.args.get('limit', 20, type=int)
    
    if not query:
        return jsonify({'success': False, 'message': 'Search query is required'}), 400
    
    users = User.query.filter(
        User.username.ilike(f'%{query}%')
    ).limit(limit).all()
    
    return jsonify({
        'success': True,
        'users': [{
            'id': user.id,
            'username': user.username,
            'avatar': user.profile.avatar if user.profile else None,
            'bio': user.profile.bio if user.profile else None
        } for user in users]
    }), 200


@social_bp.route('/users/suggestions', methods=['GET'])
@jwt_required()
@handle_errors
def get_friend_suggestions():
    """Get friend suggestions."""
    current_user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)
    
    # Get users who are not friends and not enemies
    friends = Friendship.query.filter(
        or_(
            Friendship.sender_id == current_user_id,
            Friendship.receiver_id == current_user_id
        )
    ).all()
    
    friend_ids = set()
    for friendship in friends:
        if friendship.sender_id == current_user_id:
            friend_ids.add(friendship.receiver_id)
        else:
            friend_ids.add(friendship.sender_id)
    
    enemies = EnemyRelationship.query.filter(
        or_(
            EnemyRelationship.user_id == current_user_id,
            EnemyRelationship.enemy_id == current_user_id
        )
    ).all()
    
    enemy_ids = set()
    for enemy in enemies:
        if enemy.user_id == current_user_id:
            enemy_ids.add(enemy.enemy_id)
        else:
            enemy_ids.add(enemy.user_id)
    
    excluded_ids = friend_ids.union(enemy_ids)
    excluded_ids.add(current_user_id)
    
    suggestions = User.query.filter(
        ~User.id.in_(excluded_ids)
    ).limit(limit).all()
    
    return jsonify({
        'success': True,
        'suggestions': [{
            'id': user.id,
            'username': user.username,
            'avatar': user.profile.avatar if user.profile else None,
            'bio': user.profile.bio if user.profile else None
        } for user in suggestions]
    }), 200


# Social Status Routes
@social_bp.route('/status', methods=['PUT'])
@jwt_required()
@handle_errors
def update_social_status():
    """Update social status."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    status = data.get('status')
    
    if not status or status not in ['online', 'offline', 'away', 'busy']:
        return jsonify({'success': False, 'message': 'Valid status is required'}), 400
    
    try:
        social_profile = SocialProfile.query.filter_by(user_id=current_user_id).first()
        if not social_profile:
            social_profile = SocialProfile(user_id=current_user_id)
            db.session.add(social_profile)
        
        social_profile.social_status = status
        social_profile.last_seen = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Status updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500 