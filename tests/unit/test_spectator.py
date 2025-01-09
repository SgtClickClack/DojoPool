import pytest
from datetime import datetime, timedelta
from dojopool.services.spectator_service import SpectatorService
from dojopool.models.user import User
from dojopool.models.game import Game
from dojopool.models.spectator import SpectatorSession
from dojopool.extensions import db
from dojopool.exceptions import SpectatorError

@pytest.fixture
def spectator_service():
    return SpectatorService()

@pytest.fixture
def sample_spectator_session(sample_user, sample_game):
    return SpectatorSession(
        user=sample_user,
        game=sample_game,
        joined_at=datetime.utcnow(),
        status="active"
    )

class TestSpectator:
    def test_spectator_join(self, spectator_service, sample_user, sample_game):
        """Test spectator joining a game"""
        # Join game as spectator
        session = spectator_service.join_game(
            user_id=sample_user.id,
            game_id=sample_game.id
        )
        
        assert session.user_id == sample_user.id
        assert session.game_id == sample_game.id
        assert session.status == "active"
        assert session.joined_at is not None
        
        # Verify spectator count
        count = spectator_service.get_spectator_count(game_id=sample_game.id)
        assert count == 1

    def test_spectator_leave(self, spectator_service, sample_spectator_session):
        """Test spectator leaving a game"""
        # Leave game
        result = spectator_service.leave_game(
            session_id=sample_spectator_session.id
        )
        
        assert result["success"] is True
        assert result["left_at"] is not None
        
        # Verify session status
        session = spectator_service.get_session(
            session_id=sample_spectator_session.id
        )
        assert session.status == "ended"

    def test_spectator_chat(self, spectator_service, sample_spectator_session):
        """Test spectator chat functionality"""
        # Send chat message
        message = spectator_service.send_chat_message(
            session_id=sample_spectator_session.id,
            content="Great shot!",
            message_type="text"
        )
        
        assert message.content == "Great shot!"
        assert message.sender_id == sample_spectator_session.user_id
        assert message.timestamp is not None
        
        # Get chat history
        history = spectator_service.get_chat_history(
            game_id=sample_spectator_session.game_id
        )
        assert len(history) > 0
        assert history[0].content == "Great shot!"

    def test_spectator_permissions(self, spectator_service, sample_user, sample_game):
        """Test spectator permissions"""
        # Test permission checks
        permissions = spectator_service.get_spectator_permissions(
            user_id=sample_user.id,
            game_id=sample_game.id
        )
        
        assert "can_chat" in permissions
        assert "can_react" in permissions
        assert "can_share" in permissions
        
        # Test permission update
        updated = spectator_service.update_permissions(
            game_id=sample_game.id,
            updates={
                "chat_enabled": False,
                "reactions_enabled": True
            }
        )
        assert updated["chat_enabled"] is False
        assert updated["reactions_enabled"] is True

    def test_spectator_reactions(self, spectator_service, sample_spectator_session):
        """Test spectator reactions"""
        # Add reaction
        reaction = spectator_service.add_reaction(
            session_id=sample_spectator_session.id,
            reaction_type="applause",
            timestamp=datetime.utcnow()
        )
        
        assert reaction.type == "applause"
        assert reaction.user_id == sample_spectator_session.user_id
        
        # Get reactions
        reactions = spectator_service.get_reactions(
            game_id=sample_spectator_session.game_id
        )
        assert len(reactions) > 0
        assert reactions[0].type == "applause"

    def test_spectator_analytics(self, spectator_service, sample_game):
        """Test spectator analytics"""
        # Generate analytics
        analytics = spectator_service.generate_analytics(
            game_id=sample_game.id
        )
        
        assert "peak_spectators" in analytics
        assert "average_watch_time" in analytics
        assert "total_reactions" in analytics
        assert "chat_activity" in analytics
        
        # Test detailed metrics
        metrics = spectator_service.get_detailed_metrics(
            game_id=sample_game.id,
            metric_type="engagement"
        )
        assert "engagement_score" in metrics
        assert "interaction_rate" in metrics

    def test_spectator_moderation(self, spectator_service, sample_spectator_session):
        """Test spectator moderation"""
        # Test message moderation
        moderation = spectator_service.moderate_message(
            message_content="Test message",
            user_id=sample_spectator_session.user_id
        )
        
        assert moderation["allowed"] is True
        assert "moderation_score" in moderation
        
        # Test user timeout
        timeout = spectator_service.timeout_user(
            user_id=sample_spectator_session.user_id,
            game_id=sample_spectator_session.game_id,
            duration_minutes=5
        )
        assert timeout["success"] is True
        assert timeout["expires_at"] is not None

    def test_spectator_notifications(self, spectator_service, sample_user, sample_game):
        """Test spectator notifications"""
        # Subscribe to notifications
        subscription = spectator_service.subscribe_to_notifications(
            user_id=sample_user.id,
            game_id=sample_game.id,
            notification_types=["game_start", "game_end"]
        )
        
        assert subscription["success"] is True
        assert "game_start" in subscription["subscribed_types"]
        
        # Test notification delivery
        notification = spectator_service.send_notification(
            game_id=sample_game.id,
            notification_type="game_start",
            data={"start_time": datetime.utcnow().isoformat()}
        )
        assert notification["delivered"] is True
        assert notification["recipient_count"] > 0

    def test_spectator_sharing(self, spectator_service, sample_spectator_session):
        """Test game sharing functionality"""
        # Generate share link
        share = spectator_service.generate_share_link(
            game_id=sample_spectator_session.game_id,
            user_id=sample_spectator_session.user_id
        )
        
        assert "share_url" in share
        assert "expires_at" in share
        
        # Track share analytics
        analytics = spectator_service.track_share(
            share_id=share["share_id"],
            platform="twitter"
        )
        assert analytics["shares"] > 0
        assert "twitter" in analytics["platforms"]

    def test_spectator_highlights(self, spectator_service, sample_game):
        """Test game highlights functionality"""
        # Create highlight
        highlight = spectator_service.create_highlight(
            game_id=sample_game.id,
            timestamp=datetime.utcnow(),
            title="Amazing Shot",
            description="Perfect bank shot into corner pocket"
        )
        
        assert highlight.title == "Amazing Shot"
        assert highlight.game_id == sample_game.id
        
        # Get game highlights
        highlights = spectator_service.get_game_highlights(
            game_id=sample_game.id
        )
        assert len(highlights) > 0
        assert highlights[0].title == "Amazing Shot"

    def test_error_handling(self, spectator_service, sample_user):
        """Test spectator error handling"""
        # Test invalid game join
        with pytest.raises(SpectatorError):
            spectator_service.join_game(
                user_id=sample_user.id,
                game_id=999999  # Non-existent game
            )
        
        # Test invalid session operations
        with pytest.raises(SpectatorError):
            spectator_service.send_chat_message(
                session_id=999999,  # Invalid session
                content="Test message",
                message_type="text"
            ) 