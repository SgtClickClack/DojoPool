import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.services.ai.RealTimeAICommentaryService import RealTimeAICommentaryService
from src.types.ai import CommentaryEvent, CommentaryStyle, PoolGod
from src.types.game import MatchEvent, GameState

class TestRealTimeAICommentaryService:
    @pytest.fixture
    def service(self):
        return RealTimeAICommentaryService()
    
    @pytest.fixture
    def mock_match_event(self):
        return MatchEvent(
            id="event-1",
            type="shot_made",
            playerId="player-1",
            timestamp="2025-01-30T10:00:00Z",
            data={
                "ball": "8",
                "pocket": "corner",
                "difficulty": "hard"
            }
        )
    
    @pytest.fixture
    def mock_game_state(self):
        return GameState(
            matchId="match-1",
            currentPlayer="player-1",
            score={"player-1": 3, "player-2": 2},
            remainingBalls=["1", "2", "3", "4", "5", "6", "7", "8"],
            timestamp="2025-01-30T10:00:00Z"
        )

    def test_init(self, service):
        """Test service initialization"""
        assert service.socket is None
        assert service.active_commentary == {}
        assert service.commentary_history == {}
        assert service.pool_gods == {
            PoolGod.AI_UMPIRE: "The AI Umpire",
            PoolGod.MATCH_COMMENTATOR: "The Match Commentator",
            PoolGod.GOD_OF_LUCK: "The God of Luck (Fluke)"
        }

    @patch('src.services.ai.RealTimeAICommentaryService.socketio')
    def test_connect_socket(self, mock_socketio, service):
        """Test socket connection"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        
        service.connect_socket()
        
        assert service.socket == mock_socket
        mock_socketio.assert_called_once()

    def test_generate_commentary(self, service, mock_match_event):
        """Test generating commentary for match event"""
        commentary = service.generate_commentary(
            event=mock_match_event,
            style=CommentaryStyle.DRAMATIC,
            pool_god=PoolGod.MATCH_COMMENTATOR
        )
        
        assert commentary.id is not None
        assert commentary.eventId == mock_match_event.id
        assert commentary.style == CommentaryStyle.DRAMATIC
        assert commentary.poolGod == PoolGod.MATCH_COMMENTATOR
        assert commentary.text is not None
        assert len(commentary.text) > 0

    def test_generate_commentary_ai_umpire(self, service, mock_match_event):
        """Test generating AI Umpire commentary"""
        commentary = service.generate_commentary(
            event=mock_match_event,
            style=CommentaryStyle.FORMAL,
            pool_god=PoolGod.AI_UMPIRE
        )
        
        assert commentary.poolGod == PoolGod.AI_UMPIRE
        assert "umpire" in commentary.text.lower() or "rule" in commentary.text.lower()

    def test_generate_commentary_god_of_luck(self, service, mock_match_event):
        """Test generating God of Luck commentary"""
        commentary = service.generate_commentary(
            event=mock_match_event,
            style=CommentaryStyle.PLAYFUL,
            pool_god=PoolGod.GOD_OF_LUCK
        )
        
        assert commentary.poolGod == PoolGod.GOD_OF_LUCK
        assert "luck" in commentary.text.lower() or "fluke" in commentary.text.lower()

    def test_generate_commentary_dramatic_style(self, service, mock_match_event):
        """Test generating dramatic commentary"""
        commentary = service.generate_commentary(
            event=mock_match_event,
            style=CommentaryStyle.DRAMATIC,
            pool_god=PoolGod.MATCH_COMMENTATOR
        )
        
        assert commentary.style == CommentaryStyle.DRAMATIC
        # Check for dramatic language patterns
        dramatic_words = ["incredible", "amazing", "spectacular", "unbelievable", "fantastic"]
        assert any(word in commentary.text.lower() for word in dramatic_words)

    def test_generate_commentary_technical_style(self, service, mock_match_event):
        """Test generating technical commentary"""
        commentary = service.generate_commentary(
            event=mock_match_event,
            style=CommentaryStyle.TECHNICAL,
            pool_god=PoolGod.MATCH_COMMENTATOR
        )
        
        assert commentary.style == CommentaryStyle.TECHNICAL
        # Check for technical language patterns
        technical_words = ["angle", "spin", "velocity", "trajectory", "physics"]
        assert any(word in commentary.text.lower() for word in technical_words)

    def test_generate_commentary_playful_style(self, service, mock_match_event):
        """Test generating playful commentary"""
        commentary = service.generate_commentary(
            event=mock_match_event,
            style=CommentaryStyle.PLAYFUL,
            pool_god=PoolGod.MATCH_COMMENTATOR
        )
        
        assert commentary.style == CommentaryStyle.PLAYFUL
        # Check for playful language patterns
        playful_words = ["wow", "oops", "nice", "smooth", "clean"]
        assert any(word in commentary.text.lower() for word in playful_words)

    def test_start_commentary_session(self, service, mock_game_state):
        """Test starting a commentary session"""
        session = service.start_commentary_session(
            match_id="match-1",
            game_state=mock_game_state,
            style=CommentaryStyle.DRAMATIC
        )
        
        assert session.matchId == "match-1"
        assert session.style == CommentaryStyle.DRAMATIC
        assert session.isActive is True
        assert session.startTime is not None
        assert "match-1" in service.active_commentary

    def test_stop_commentary_session(self, service, mock_game_state):
        """Test stopping a commentary session"""
        service.start_commentary_session(
            match_id="match-1",
            game_state=mock_game_state,
            style=CommentaryStyle.DRAMATIC
        )
        
        service.stop_commentary_session("match-1")
        
        assert "match-1" not in service.active_commentary
        assert "match-1" in service.commentary_history

    def test_stop_commentary_session_not_found(self, service):
        """Test stopping non-existent commentary session"""
        result = service.stop_commentary_session("non-existent")
        assert result is False

    def test_process_match_event(self, service, mock_match_event, mock_game_state):
        """Test processing match event with commentary"""
        service.start_commentary_session(
            match_id="match-1",
            game_state=mock_game_state,
            style=CommentaryStyle.DRAMATIC
        )
        
        commentary = service.process_match_event("match-1", mock_match_event)
        
        assert commentary is not None
        assert commentary.eventId == mock_match_event.id
        assert "match-1" in service.active_commentary

    def test_process_match_event_no_session(self, service, mock_match_event):
        """Test processing match event without active session"""
        commentary = service.process_match_event("match-1", mock_match_event)
        assert commentary is None

    def test_get_commentary_history(self, service, mock_game_state):
        """Test getting commentary history"""
        service.start_commentary_session(
            match_id="match-1",
            game_state=mock_game_state,
            style=CommentaryStyle.DRAMATIC
        )
        service.stop_commentary_session("match-1")
        
        history = service.get_commentary_history("match-1")
        assert history is not None
        assert history.matchId == "match-1"

    def test_get_commentary_history_not_found(self, service):
        """Test getting commentary history for non-existent match"""
        history = service.get_commentary_history("non-existent")
        assert history is None

    def test_get_active_sessions(self, service, mock_game_state):
        """Test getting active commentary sessions"""
        service.start_commentary_session(
            match_id="match-1",
            game_state=mock_game_state,
            style=CommentaryStyle.DRAMATIC
        )
        service.start_commentary_session(
            match_id="match-2",
            game_state=mock_game_state,
            style=CommentaryStyle.TECHNICAL
        )
        
        sessions = service.get_active_sessions()
        assert len(sessions) == 2
        assert "match-1" in sessions
        assert "match-2" in sessions

    @patch('src.services.ai.RealTimeAICommentaryService.socketio')
    def test_broadcast_commentary(self, mock_socketio, service, mock_match_event):
        """Test broadcasting commentary"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        commentary = service.generate_commentary(
            event=mock_match_event,
            style=CommentaryStyle.DRAMATIC,
            pool_god=PoolGod.MATCH_COMMENTATOR
        )
        
        service.broadcast_commentary(commentary)
        
        mock_socket.emit.assert_called_with(
            'commentary_update',
            commentary.dict()
        )

    def test_generate_shot_commentary(self, service, mock_match_event):
        """Test generating shot-specific commentary"""
        commentary = service.generate_shot_commentary(
            event=mock_match_event,
            style=CommentaryStyle.DRAMATIC
        )
        
        assert commentary is not None
        assert "shot" in commentary.text.lower() or "ball" in commentary.text.lower()

    def test_generate_foul_commentary(self, service):
        """Test generating foul commentary"""
        foul_event = MatchEvent(
            id="foul-1",
            type="foul",
            playerId="player-1",
            timestamp="2025-01-30T10:00:00Z",
            data={"foul_type": "scratch", "penalty": "ball_in_hand"}
        )
        
        commentary = service.generate_foul_commentary(
            event=foul_event,
            style=CommentaryStyle.FORMAL
        )
        
        assert commentary is not None
        assert "foul" in commentary.text.lower() or "penalty" in commentary.text.lower()

    def test_generate_victory_commentary(self, service, mock_game_state):
        """Test generating victory commentary"""
        commentary = service.generate_victory_commentary(
            winner_id="player-1",
            final_score={"player-1": 7, "player-2": 3},
            style=CommentaryStyle.DRAMATIC
        )
        
        assert commentary is not None
        assert "victory" in commentary.text.lower() or "winner" in commentary.text.lower()

    def test_generate_match_start_commentary(self, service, mock_game_state):
        """Test generating match start commentary"""
        commentary = service.generate_match_start_commentary(
            player1_id="player-1",
            player2_id="player-2",
            style=CommentaryStyle.DRAMATIC
        )
        
        assert commentary is not None
        assert "begin" in commentary.text.lower() or "start" in commentary.text.lower()

    def test_get_pool_god_name(self, service):
        """Test getting pool god name"""
        name = service.get_pool_god_name(PoolGod.AI_UMPIRE)
        assert name == "The AI Umpire"
        
        name = service.get_pool_god_name(PoolGod.MATCH_COMMENTATOR)
        assert name == "The Match Commentator"
        
        name = service.get_pool_god_name(PoolGod.GOD_OF_LUCK)
        assert name == "The God of Luck (Fluke)"

    def test_cleanup_old_sessions(self, service, mock_game_state):
        """Test cleaning up old commentary sessions"""
        # Start multiple sessions
        service.start_commentary_session(
            match_id="match-1",
            game_state=mock_game_state,
            style=CommentaryStyle.DRAMATIC
        )
        service.start_commentary_session(
            match_id="match-2",
            game_state=mock_game_state,
            style=CommentaryStyle.TECHNICAL
        )
        
        # Stop one session
        service.stop_commentary_session("match-1")
        
        # Cleanup old sessions (older than 1 hour)
        with patch('src.services.ai.RealTimeAICommentaryService.datetime') as mock_datetime:
            mock_datetime.now.return_value = "2025-01-30T12:00:00Z"
            mock_datetime.fromisoformat.return_value = "2025-01-30T12:00:00Z"
            
            service.cleanup_old_sessions()
            
            # Should still have active session
            assert "match-2" in service.active_commentary
            # Should still have history
            assert "match-1" in service.commentary_history

    def test_get_commentary_statistics(self, service, mock_game_state):
        """Test getting commentary statistics"""
        service.start_commentary_session(
            match_id="match-1",
            game_state=mock_game_state,
            style=CommentaryStyle.DRAMATIC
        )
        service.stop_commentary_session("match-1")
        
        stats = service.get_commentary_statistics()
        assert stats is not None
        assert "total_sessions" in stats
        assert "active_sessions" in stats
        assert "total_commentary" in stats 