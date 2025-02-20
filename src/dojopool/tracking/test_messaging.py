"""Tests for messaging system."""

from datetime import datetime, timedelta

import pytest

from .messaging import Challenge, Message, MessageManager, MessageType


@pytest.fixture
def message_manager() -> MessageManager:
    """Create a message manager for testing."""
    return MessageManager()


class TestMessaging:
    """Test messaging functionality."""

    def test_send_direct_message(self, message_manager: MessageManager):
        """Test sending direct messages."""
        message = message_manager.send_message(
            sender_id="player1",
            recipient_id="player2",
            content="Hello!",
            message_type=MessageType.DIRECT,
        )

        assert message.sender_id == "player1"
        assert message.recipient_id == "player2"
        assert message.content == "Hello!"
        assert message.message_type == MessageType.DIRECT
        assert message.read_at is None

        # Test retrieving messages
        messages = message_manager.get_player_messages("player2")
        assert len(messages) == 1
        assert messages[0].message_id == message.message_id

    def test_clan_messages(self, message_manager: MessageManager):
        """Test clan messaging."""
        # Send multiple clan messages
        message1 = message_manager.send_message(
            sender_id="player1",
            recipient_id="clan1",
            content="Clan message 1",
            message_type=MessageType.CLAN,
        )

        message2 = message_manager.send_message(
            sender_id="player2",
            recipient_id="clan1",
            content="Clan message 2",
            message_type=MessageType.CLAN,
        )

        # Test retrieving clan messages
        messages = message_manager.get_clan_messages("clan1")
        assert len(messages) == 2
        assert messages[0].message_id == message2.message_id  # Most recent first
        assert messages[1].message_id == message1.message_id

    def test_message_filtering(self, message_manager: MessageManager):
        """Test message filtering options."""
        # Send different types of messages
        message_manager.send_message(
            sender_id="player1",
            recipient_id="player2",
            content="Direct message",
            message_type=MessageType.DIRECT,
        )

        message_manager.send_message(
            sender_id="system",
            recipient_id="player2",
            content="System message",
            message_type=MessageType.SYSTEM,
        )

        # Test filtering by type
        direct_messages = message_manager.get_player_messages(
            "player2", message_type=MessageType.DIRECT
        )
        assert len(direct_messages) == 1
        assert direct_messages[0].content == "Direct message"

        system_messages = message_manager.get_player_messages(
            "player2", message_type=MessageType.SYSTEM
        )
        assert len(system_messages) == 1
        assert system_messages[0].content == "System message"

    def test_read_status(self, message_manager: MessageManager) -> None:
        """Test message read status management."""
        message = message_manager.send_message(
            sender_id="player1",
            recipient_id="player2",
            content="Test message",
            message_type=MessageType.DIRECT,
        )

        # Test unread filtering
        unread = message_manager.get_player_messages("player2", unread_only=True)
        assert len(unread) == 1

        # Mark as read
        assert message_manager.mark_as_read(message.message_id)

        # Should not appear in unread messages
        unread = message_manager.get_player_messages("player2", unread_only=True)
        assert len(unread) == 0

    def test_challenge_system(self, message_manager: MessageManager):
        """Test challenge system."""
        # Send challenge
        challenge = message_manager.send_challenge(
            challenger_id="player1",
            challenged_id="player2",
            game_type="8-ball",
            race_to=5,
            venue_id="venue1",
            wager_amount=100,
        )

        assert challenge.status == "pending"

        # Check challenge message
        messages = message_manager.get_player_messages(
            "player2", message_type=MessageType.CHALLENGE
        )
        assert len(messages) == 1
        assert messages[0].metadata["challenge_id"] == challenge.challenge_id
        assert messages[0].metadata["game_type"] == "8-ball"
        assert messages[0].metadata["race_to"] == "5"
        assert messages[0].metadata["venue_id"] == "venue1"
        assert messages[0].metadata["wager_amount"] == "100"

        # Accept challenge
        assert message_manager.respond_to_challenge(challenge.challenge_id, True)

        # Check response message
        messages = message_manager.get_player_messages(
            "player1", message_type=MessageType.CHALLENGE
        )
        assert len(messages) == 1
        assert messages[0].metadata["response"] == "accept"

        # Complete challenge
        assert message_manager.complete_challenge(challenge.challenge_id, "match123")

        # Both players should receive completion message
        for player_id in ["player1", "player2"]:
            messages = message_manager.get_player_messages(
                player_id, message_type=MessageType.CHALLENGE
            )
            completion_messages = [m for m in messages if "result_id" in m.metadata]
            assert len(completion_messages) == 1
            assert completion_messages[0].metadata["result_id"] == "match123"

    def test_invalid_operations(self, message_manager: MessageManager) -> None:
        """Test invalid operations."""
        # Try to mark nonexistent message as read
        assert not message_manager.mark_as_read("nonexistent")

        # Try to respond to nonexistent challenge
        assert not message_manager.respond_to_challenge("nonexistent", True)

        # Try to complete nonexistent challenge
        assert not message_manager.complete_challenge("nonexistent", "result123")

        # Try to complete pending challenge
        challenge = message_manager.send_challenge(
            challenger_id="player1",
            challenged_id="player2",
            game_type="8-ball",
            race_to=5,
        )
        assert not message_manager.complete_challenge(
            challenge.challenge_id, "result123"
        )
