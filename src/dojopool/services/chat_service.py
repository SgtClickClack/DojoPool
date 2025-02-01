"""Chat service for handling messaging between users."""

from typing import List, Optional

from ..core.database import db
from ..core.exceptions import ValidationError
from ..models.chat import ChatMessage, ChatParticipant, ChatRoom


class ChatService:
    """Service for handling chat operations."""

    @staticmethod
    def create_chat_room(
        creator_id: int, participant_ids: List[int], name: Optional[str] = None
    ) -> ChatRoom:
        """Create a new chat room.

        Args:
            creator_id: ID of the user creating the chat
            participant_ids: List of participant user IDs
            name: Optional name for group chats

        Returns:
            ChatRoom: Created chat room

        Raises:
            ValidationError: If participants cannot interact
        """
        # Check if all participants can interact with each other
        for participant_id in participant_ids:
            if participant_id != creator_id and not ChatRoom.can_users_interact(
                creator_id, participant_id
            ):
                raise ValidationError(
                    "Cannot create chat - users must be in the same dojo to interact"
                )

        room_type = "group" if len(participant_ids) > 1 else "direct"
        room = ChatRoom(type=room_type, name=name)
        db.session.add(room)

        # Add participants
        participants = [creator_id] + [pid for pid in participant_ids if pid != creator_id]
        for user_id in participants:
            participant = ChatParticipant(
                room=room, user_id=user_id, role="admin" if user_id == creator_id else "member"
            )
            db.session.add(participant)

        db.session.commit()
        return room

    @staticmethod
    def send_message(room_id: int, sender_id: int, content: str) -> ChatMessage:
        """Send a message in a chat room.

        Args:
            room_id: Chat room ID
            sender_id: Message sender's user ID
            content: Message content

        Returns:
            ChatMessage: Created message

        Raises:
            ValidationError: If sender cannot interact with room participants
        """
        # Get room participants
        participants = ChatParticipant.query.filter_by(room_id=room_id).all()

        # Check if sender can interact with all participants
        for participant in participants:
            if participant.user_id != sender_id and not ChatRoom.can_users_interact(
                sender_id, participant.user_id
            ):
                raise ValidationError(
                    "Cannot send message - users must be in the same dojo to interact"
                )

        message = ChatMessage(room_id=room_id, sender_id=sender_id, content=content)
        db.session.add(message)
        db.session.commit()
        return message
