from flask_caching import Cache
from flask_caching import Cache
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, or_

from ..exceptions import ResourceNotFound, ValidationError
from ..models import db
from ..models.user import User
from .models import (
    ChallengeParticipant,
    ChatMessage,
    CommunityChallenge,
    FriendRequest,
    Friendship,
    SocialShare,
)


class SocialService:
    def send_friend_request(self, user_id: int, friend_id: int) -> Friendship:
        """Send a friend request to another user."""
        if user_id == friend_id:
            raise ValueError("Cannot send friend request to yourself")

        existing: Any = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id),
            )
        ).first()

        if existing:
            raise ValueError("Friendship already exists")

        friendship: Friendship = Friendship(
            user_id=user_id, friend_id=friend_id, status="pending"
        )
        db.session.add(friendship)
        db.session.commit()
        return friendship

    def handle_friend_request(self, friendship_id: int, user_id: int, accept: bool):
        """Accept or reject a friend request."""
        friendship: Friendship = Friendship.query.get(friendship_id)
        if not friendship or friendship.friend_id != user_id:
            raise ValueError("Invalid friendship request")

        friendship.status = "accepted" if accept else "blocked"
        friendship.updated_at = datetime.utcnow()
        db.session.commit()
        return friendship

    def get_friends(self, user_id: int):
        """Get list of user's friends."""
        friendships: Any = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == user_id, Friendship.status == "accepted"),
                and_(Friendship.friend_id == user_id, Friendship.status == "accepted"),
            )
        ).all()

        friends: List[Any] = []
        for f in friendships:
            friend: Any = f.friend if f.user_id == user_id else f.user
            friends.append(
                {
                    "id": friend.id,
                    "username": friend.username,
                    "avatar_url": friend.avatar_url,
                    "friendship_id": f.id,
                    "since": f.created_at.isoformat(),
                }
            )
        return friends

    def send_message(self, sender_id: int, receiver_id: int, content: str):
        """Send a chat message to another user."""
        message: ChatMessage = ChatMessage(
            sender_id=sender_id, receiver_id=receiver_id, content=content
        )
        db.session.add(message)
        db.session.commit()
        return message

    def get_messages(
        self, user_id: int, other_user_id: int, limit: int = 50
    ) -> List[ChatMessage]:
        """Get chat messages between two users."""
        return (
            ChatMessage.query.filter(
                or_(
                    and_(
                        ChatMessage.sender_id == user_id,
                        ChatMessage.receiver_id == other_user_id,
                    ),
                    and_(
                        ChatMessage.sender_id == other_user_id,
                        ChatMessage.receiver_id == user_id,
                    ),
                )
            )
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
            .all()
        )

    def mark_messages_read(self, user_id: int, other_user_id: int):
        """Mark all messages from other_user as read."""
        ChatMessage.query.filter_by(
            sender_id=other_user_id, receiver_id=user_id, is_read=False
        ).update({"is_read": True})
        db.session.commit()

    def create_challenge(self, data: Dict):
        """Create a new community challenge."""
        challenge: CommunityChallenge = CommunityChallenge(
            title=data["title"],
            description=data.get("description"),
            creator_id=data["creator_id"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            requirements=data.get("requirements"),
            reward_points=data.get("reward_points", 0),
        )
        db.session.add(challenge)
        db.session.commit()
        return challenge

    def join_challenge(self, user_id: int, challenge_id: int):
        """Join a community challenge."""
        existing: Any = ChallengeParticipant.query.filter_by(
            user_id=user_id, challenge_id=challenge_id
        ).first()

        if existing:
            raise ValueError("Already participating in this challenge")

        participant: ChallengeParticipant = ChallengeParticipant(
            user_id=user_id, challenge_id=challenge_id, status="joined"
        )
        db.session.add(participant)
        db.session.commit()
        return participant

    def update_challenge_progress(
        self, participant_id: int, status: str, progress_data: Optional[str] = None
    ) -> ChallengeParticipant:
        """Update a participant's challenge progress."""
        participant: ChallengeParticipant = ChallengeParticipant.query.get(
            participant_id
        )
        if not participant:
            raise ValueError("Invalid participant")

        participant.status = status
        if progress_data:
            participant.progress_data = progress_data
        if status == "completed":
            participant.completed_at = datetime.utcnow()

        db.session.commit()
        return participant

    def get_active_challenges(self):
        """Get all active community challenges."""
        return (
            CommunityChallenge.query.filter_by(is_active=True)
            .filter(CommunityChallenge.end_date > datetime.utcnow())
            .all()
        )

    def create_social_share(self, data: Dict) -> SocialShare:
        """Create a new social share."""
        share: SocialShare = SocialShare(
            user_id=data["user_id"],
            content_type=data["content_type"],
            content_id=data["content_id"],
            platform=data["platform"],
            share_text=data.get("share_text"),
            media_url=data.get("media_url"),
        )
        db.session.add(share)
        db.session.commit()
        return share

    def get_user_shares(self, user_id: int):
        """Get all social shares by a user."""
        return (
            SocialShare.query.filter_by(user_id=user_id)
            .order_by(SocialShare.created_at.desc())
            .all()
        )

    @staticmethod
    def get_user_friends(user_id: int):
        """Get a list of friends for a given user."""
        friendships = Friendship.query.filter(
            (Friendship.user1_id == user_id) | (Friendship.user2_id == user_id)
        ).all()

        friends = []
        for friendship in friendships:
            friend = (
                friendship.user2 if friendship.user1_id == user_id else friendship.user1
            )
            friends.append(
                {
                    "id": friend.id,
                    "username": friend.username,
                    "status": "online" if friend.is_online else "offline",
                    "friendship_date": friendship.created_at.isoformat(),
                }
            )

        return friends

    @staticmethod
    def get_pending_friend_requests(user_id: int):
        """Get all pending friend requests for a user."""
        pending_requests = FriendRequest.query.filter_by(
            recipient_id=user_id, status="pending"
        ).all()

        return [
            {
                "id": req.id,
                "sender": {"id": req.sender.id, "username": req.sender.username},
                "created_at": req.created_at.isoformat(),
            }
            for req in pending_requests
        ]

    @staticmethod
    def send_friend_request(sender_id: int, recipient_id: int) -> None:
        """Send a friend request from one user to another."""
        if sender_id == recipient_id:
            raise ValidationError("Cannot send friend request to yourself")

        recipient = User.query.get(recipient_id)
        if not recipient:
            raise ResourceNotFound("Recipient user not found")

        # Check if request already exists
        existing_request = FriendRequest.query.filter_by(
            sender_id=sender_id, recipient_id=recipient_id, status="pending"
        ).first()

        if existing_request:
            raise ValidationError("Friend request already sent")

        # Check if they're already friends
        existing_friendship = Friendship.query.filter(
            ((Friendship.user1_id == sender_id) & (Friendship.user2_id == recipient_id))
            | (
                (Friendship.user1_id == recipient_id)
                & (Friendship.user2_id == sender_id)
            )
        ).first()

        if existing_friendship:
            raise ValidationError("Already friends with this user")

        new_request = FriendRequest(
            sender_id=sender_id, recipient_id=recipient_id, created_at=datetime.utcnow()
        )
        db.session.add(new_request)
        db.session.commit()

    @staticmethod
    def handle_friend_request(request_id: int, recipient_id: int, action: str):
        """Handle (accept/reject) a friend request."""
        if action not in ["accept", "reject"]:
            raise ValidationError("Invalid action")

        friend_request = FriendRequest.query.get(request_id)
        if not friend_request:
            raise ResourceNotFound("Friend request not found")

        if friend_request.recipient_id != recipient_id:
            raise ValidationError("Unauthorized to handle this request")

        if friend_request.status != "pending":
            raise ValidationError("Request already handled")

        if action == "accept":
            new_friendship = Friendship(
                user1_id=friend_request.sender_id,
                user2_id=friend_request.recipient_id,
                created_at=datetime.utcnow(),
            )
            db.session.add(new_friendship)
            friend_request.status = "accepted"
        else:
            friend_request.status = "rejected"

        db.session.commit()

    @staticmethod
    def remove_friend(user_id: int, friend_id: int):
        """Remove a friendship between two users."""
        friendship = Friendship.query.filter(
            ((Friendship.user1_id == user_id) & (Friendship.user2_id == friend_id))
            | ((Friendship.user1_id == friend_id) & (Friendship.user2_id == user_id))
        ).first()

        if not friendship:
            raise ResourceNotFound("Friendship not found")

        db.session.delete(friendship)
        db.session.commit()
