"""Messaging system for DojoPool."""

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Set


class MessageType(Enum):
    """Types of messages in the system."""

    DIRECT = "direct"
    CLAN = "clan"
    SYSTEM = "system"
    CHALLENGE = "challenge"
    TOURNAMENT = "tournament"


@dataclass
class Message:
    """Message details."""

    message_id: str
    sender_id: str
    recipient_id: str  # Can be player_id, clan_id, or "system"
    message_type: MessageType
    content: str
    created_at: datetime
    read_at: Optional[datetime] = None
    metadata: Dict[str, str] = field(
        default_factory=dict
    )  # For challenge/tournament details


@dataclass
class Challenge:
    """Challenge details for challenge messages."""

    challenge_id: str
    challenger_id: str
    challenged_id: str
    game_type: str
    race_to: int
    venue_id: Optional[str]
    scheduled_time: Optional[datetime]
    wager_amount: int = 0
    status: str = "pending"  # pending, accepted, rejected, completed
    result_id: Optional[str] = None


class MessageManager:
    """Manage messaging system."""

    def __init__(self) -> None:
        """Initialize message manager."""
        self._messages: Dict[str, Message] = {}
        self._player_messages: Dict[str, List[str]] = (
            {}
        )  # player_id : Dict[str, List[str]] = {}  # clan_id : Dict[str, Challenge] = {}

    def send_message(
        self,
        sender_id: str,
        recipient_id: str,
        content: str,
        message_type: MessageType,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Message:
        """Send a message."""
        message_id = str(uuid.uuid4())

        message = Message(
            message_id=message_id,
            sender_id=sender_id,
            recipient_id=recipient_id,
            message_type=message_type,
            content=content,
            created_at=datetime.now(),
            metadata=metadata or {},
        )

        self._messages[message_id] = message

        # Store in appropriate inbox
        if message_type == MessageType.CLAN:
            if recipient_id not in self._clan_messages:
                self._clan_messages[recipient_id] = []
            self._clan_messages[recipient_id].append(message_id)
        else:
            if recipient_id not in self._player_messages:
                self._player_messages[recipient_id] = []
            self._player_messages[recipient_id].append(message_id)

        return message

    def get_player_messages(
        self,
        player_id: str,
        message_type: Optional[MessageType] = None,
        unread_only: bool = False,
    ):
        """Get messages for a player."""
        message_ids = self._player_messages.get(player_id, [])
        messages = []

        for message_id in message_ids:
            message = self._messages.get(message_id)
            if message:
                if message_type and message.message_type != message_type:
                    continue
                if unread_only and message.read_at is not None:
                    continue
                messages.append(message)

        return sorted(messages, key=lambda m: m.created_at, reverse=True)

    def get_clan_messages(self, clan_id: str, unread_only: bool = False):
        """Get messages for a clan."""
        message_ids = self._clan_messages.get(clan_id, [])
        messages = []

        for message_id in message_ids:
            message = self._messages.get(message_id)
            if message:
                if unread_only and message.read_at is not None:
                    continue
                messages.append(message)

        return sorted(messages, key=lambda m: m.created_at, reverse=True)

    def mark_as_read(self, message_id: str):
        """Mark a message as read."""
        message = self._messages.get(message_id)
        if not message:
            return False

        message.read_at = datetime.now()
        return True

    def send_challenge(
        self,
        challenger_id: str,
        challenged_id: str,
        game_type: str,
        race_to: int,
        venue_id: Optional[str] = None,
        scheduled_time: Optional[datetime] = None,
        wager_amount: int = 0,
    ) -> Challenge:
        """Send a challenge to another player."""
        challenge_id = str(uuid.uuid4())

        challenge = Challenge(
            challenge_id=challenge_id,
            challenger_id=challenger_id,
            challenged_id=challenged_id,
            game_type=game_type,
            race_to=race_to,
            venue_id=venue_id,
            scheduled_time=scheduled_time,
            wager_amount=wager_amount,
        )

        self._challenges[challenge_id] = challenge

        # Send challenge message
        metadata = {
            "challenge_id": challenge_id,
            "game_type": game_type,
            "race_to": str(race_to),
        }
        if venue_id:
            metadata["venue_id"] = venue_id
        if scheduled_time:
            metadata["scheduled_time"] = scheduled_time.isoformat()
        if wager_amount:
            metadata["wager_amount"] = str(wager_amount)

        self.send_message(
            sender_id=challenger_id,
            recipient_id=challenged_id,
            content=f"Challenge: {game_type} race to {race_to}",
            message_type=MessageType.CHALLENGE,
            metadata=metadata,
        )

        return challenge

    def respond_to_challenge(self, challenge_id: str, accept: bool):
        """Accept or reject a challenge."""
        challenge = self._challenges.get(challenge_id)
        if not challenge or challenge.status != "pending":
            return False

        challenge.status = "accepted" if accept else "rejected"

        # Send response message
        self.send_message(
            sender_id=challenge.challenged_id,
            recipient_id=challenge.challenger_id,
            content=f"Challenge {'accepted' if accept else 'rejected'}",
            message_type=MessageType.CHALLENGE,
            metadata={
                "challenge_id": challenge_id,
                "response": "accept" if accept else "reject",
            },
        )

        return True

    def complete_challenge(self, challenge_id: str, result_id: str):
        """Mark a challenge as completed with a result."""
        challenge = self._challenges.get(challenge_id)
        if not challenge or challenge.status != "accepted":
            return False

        challenge.status = "completed"
        challenge.result_id = result_id

        # Send completion message to both players
        metadata = {"challenge_id": challenge_id, "result_id": result_id}

        self.send_message(
            sender_id="system",
            recipient_id=challenge.challenger_id,
            content="Challenge completed",
            message_type=MessageType.CHALLENGE,
            metadata=metadata,
        )

        self.send_message(
            sender_id="system",
            recipient_id=challenge.challenged_id,
            content="Challenge completed",
            message_type=MessageType.CHALLENGE,
            metadata=metadata,
        )

        return True
