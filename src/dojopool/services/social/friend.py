"""
Friend Service Module

This module provides services for managing friend relationships between users.
"""

from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import or_, and_
from ..models import Friend, User, FriendshipStatus
from ..extensions import db


class FriendService:
    """Service for managing friend relationships."""

    @staticmethod
    def send_friend_request(user_id: int, friend_id: int) -> Tuple[bool, Optional[str]]:
        """Send a friend request.
        
        Args:
            user_id: ID of the user sending the request
            friend_id: ID of the user receiving the request
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Check if friendship already exists
            existing = Friend.query.filter(
                or_(
                    and_(Friend.user_id == user_id, Friend.friend_id == friend_id),
                    and_(Friend.user_id == friend_id, Friend.friend_id == user_id)
                )
            ).first()

            if existing:
                if existing.status == FriendshipStatus.BLOCKED:
                    return False, "Cannot send friend request to blocked user"
                if existing.status == FriendshipStatus.PENDING:
                    return False, "Friend request already pending"
                if existing.status == FriendshipStatus.ACCEPTED:
                    return False, "Already friends with this user"
                if existing.status == FriendshipStatus.REJECTED:
                    # Reset rejected friendship
                    existing.update_status(FriendshipStatus.PENDING)
                    db.session.commit()
                    return True, None

            # Create new friendship
            friendship = Friend(
                user_id=user_id,
                friend_id=friend_id,
                status=FriendshipStatus.PENDING
            )
            db.session.add(friendship)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def accept_friend_request(friendship_id: int, user_id: int) -> Tuple[bool, Optional[str]]:
        """Accept a friend request.
        
        Args:
            friendship_id: ID of the friendship
            user_id: ID of the user accepting the request
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            friendship = Friend.query.get(friendship_id)
            if not friendship:
                return False, "Friendship not found"
            if friendship.friend_id != user_id:
                return False, "Not authorized to accept this request"
            if friendship.status != FriendshipStatus.PENDING:
                return False, "Friend request is not pending"

            friendship.update_status(FriendshipStatus.ACCEPTED)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def reject_friend_request(friendship_id: int, user_id: int) -> Tuple[bool, Optional[str]]:
        """Reject a friend request.
        
        Args:
            friendship_id: ID of the friendship
            user_id: ID of the user rejecting the request
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            friendship = Friend.query.get(friendship_id)
            if not friendship:
                return False, "Friendship not found"
            if friendship.friend_id != user_id:
                return False, "Not authorized to reject this request"
            if friendship.status != FriendshipStatus.PENDING:
                return False, "Friend request is not pending"

            friendship.update_status(FriendshipStatus.REJECTED)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def block_user(user_id: int, blocked_id: int) -> Tuple[bool, Optional[str]]:
        """Block a user.
        
        Args:
            user_id: ID of the user doing the blocking
            blocked_id: ID of the user being blocked
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Check if friendship exists
            friendship = Friend.query.filter(
                or_(
                    and_(Friend.user_id == user_id, Friend.friend_id == blocked_id),
                    and_(Friend.user_id == blocked_id, Friend.friend_id == user_id)
                )
            ).first()

            if friendship:
                friendship.update_status(FriendshipStatus.BLOCKED)
            else:
                friendship = Friend(
                    user_id=user_id,
                    friend_id=blocked_id,
                    status=FriendshipStatus.BLOCKED
                )
                db.session.add(friendship)

            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def get_friends(user_id: int, status: Optional[FriendshipStatus] = None) -> List[Dict[str, Any]]:
        """Get user's friends.
        
        Args:
            user_id: ID of the user
            status: Optional friendship status to filter by
            
        Returns:
            List of friend relationships
        """
        query = Friend.query.filter(
            or_(
                Friend.user_id == user_id,
                Friend.friend_id == user_id
            )
        )

        if status:
            query = query.filter(Friend.status == status)

        friendships = query.all()
        return [friendship.to_dict() for friendship in friendships]

    @staticmethod
    def get_pending_requests(user_id: int) -> List[Dict[str, Any]]:
        """Get pending friend requests for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of pending friend requests
        """
        return FriendService.get_friends(user_id, FriendshipStatus.PENDING)

    @staticmethod
    def get_blocked_users(user_id: int) -> List[Dict[str, Any]]:
        """Get users blocked by a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of blocked users
        """
        return FriendService.get_friends(user_id, FriendshipStatus.BLOCKED)

    @staticmethod
    def update_interaction(friendship_id: int) -> None:
        """Update last interaction timestamp for a friendship.
        
        Args:
            friendship_id: ID of the friendship
        """
        friendship = Friend.query.get(friendship_id)
        if friendship:
            friendship.update_interaction()
            db.session.commit() 