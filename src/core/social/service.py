from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy import and_, or_
from .models import Friendship, ChatMessage, CommunityChallenge, ChallengeParticipant, SocialShare
from ..models import db, User

class SocialService:
    def send_friend_request(self, user_id: int, friend_id: int) -> Friendship:
        """Send a friend request to another user."""
        if user_id == friend_id:
            raise ValueError("Cannot send friend request to yourself")
            
        existing = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id)
            )
        ).first()
        
        if existing:
            raise ValueError("Friendship already exists")
            
        friendship = Friendship(
            user_id=user_id,
            friend_id=friend_id,
            status='pending'
        )
        db.session.add(friendship)
        db.session.commit()
        return friendship

    def handle_friend_request(self, friendship_id: int, user_id: int, accept: bool) -> Friendship:
        """Accept or reject a friend request."""
        friendship = Friendship.query.get(friendship_id)
        if not friendship or friendship.friend_id != user_id:
            raise ValueError("Invalid friendship request")
            
        friendship.status = 'accepted' if accept else 'blocked'
        friendship.updated_at = datetime.utcnow()
        db.session.commit()
        return friendship

    def get_friends(self, user_id: int) -> List[Dict]:
        """Get list of user's friends."""
        friendships = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == user_id, Friendship.status == 'accepted'),
                and_(Friendship.friend_id == user_id, Friendship.status == 'accepted')
            )
        ).all()
        
        friends = []
        for f in friendships:
            friend = f.friend if f.user_id == user_id else f.user
            friends.append({
                'id': friend.id,
                'username': friend.username,
                'avatar_url': friend.avatar_url,
                'friendship_id': f.id,
                'since': f.created_at.isoformat()
            })
        return friends

    def send_message(self, sender_id: int, receiver_id: int, content: str) -> ChatMessage:
        """Send a chat message to another user."""
        message = ChatMessage(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content
        )
        db.session.add(message)
        db.session.commit()
        return message

    def get_messages(self, user_id: int, other_user_id: int, limit: int = 50) -> List[ChatMessage]:
        """Get chat messages between two users."""
        return ChatMessage.query.filter(
            or_(
                and_(ChatMessage.sender_id == user_id, ChatMessage.receiver_id == other_user_id),
                and_(ChatMessage.sender_id == other_user_id, ChatMessage.receiver_id == user_id)
            )
        ).order_by(ChatMessage.created_at.desc()).limit(limit).all()

    def mark_messages_read(self, user_id: int, other_user_id: int) -> None:
        """Mark all messages from other_user as read."""
        ChatMessage.query.filter_by(
            sender_id=other_user_id,
            receiver_id=user_id,
            is_read=False
        ).update({'is_read': True})
        db.session.commit()

    def create_challenge(self, data: Dict) -> CommunityChallenge:
        """Create a new community challenge."""
        challenge = CommunityChallenge(
            title=data['title'],
            description=data.get('description'),
            creator_id=data['creator_id'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            requirements=data.get('requirements'),
            reward_points=data.get('reward_points', 0)
        )
        db.session.add(challenge)
        db.session.commit()
        return challenge

    def join_challenge(self, user_id: int, challenge_id: int) -> ChallengeParticipant:
        """Join a community challenge."""
        existing = ChallengeParticipant.query.filter_by(
            user_id=user_id,
            challenge_id=challenge_id
        ).first()
        
        if existing:
            raise ValueError("Already participating in this challenge")
            
        participant = ChallengeParticipant(
            user_id=user_id,
            challenge_id=challenge_id,
            status='joined'
        )
        db.session.add(participant)
        db.session.commit()
        return participant

    def update_challenge_progress(self, participant_id: int, status: str, progress_data: Optional[str] = None) -> ChallengeParticipant:
        """Update a participant's challenge progress."""
        participant = ChallengeParticipant.query.get(participant_id)
        if not participant:
            raise ValueError("Invalid participant")
            
        participant.status = status
        if progress_data:
            participant.progress_data = progress_data
        if status == 'completed':
            participant.completed_at = datetime.utcnow()
            
        db.session.commit()
        return participant

    def get_active_challenges(self) -> List[CommunityChallenge]:
        """Get all active community challenges."""
        return CommunityChallenge.query.filter_by(
            is_active=True
        ).filter(CommunityChallenge.end_date > datetime.utcnow()).all()

    def create_social_share(self, data: Dict) -> SocialShare:
        """Create a new social share."""
        share = SocialShare(
            user_id=data['user_id'],
            content_type=data['content_type'],
            content_id=data['content_id'],
            platform=data['platform'],
            share_text=data.get('share_text'),
            media_url=data.get('media_url')
        )
        db.session.add(share)
        db.session.commit()
        return share

    def get_user_shares(self, user_id: int) -> List[SocialShare]:
        """Get all social shares by a user."""
        return SocialShare.query.filter_by(user_id=user_id).order_by(SocialShare.created_at.desc()).all() 