import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.services.territory.TerritoryGameplayService import TerritoryGameplayService
from src.types.territory import Territory, TerritoryChallenge, ChallengeStatus
from src.types.game import MatchResult

class TestTerritoryGameplayService:
    @pytest.fixture
    def service(self):
        return TerritoryGameplayService()
    
    @pytest.fixture
    def mock_territory(self):
        return Territory(
            id="test-territory-1",
            name="Test Dojo",
            coordinates={"lat": -27.4698, "lng": 153.0251},
            owner="player-1",
            clan="test-clan",
            requiredNFT="trophy-1"
        )
    
    @pytest.fixture
    def mock_challenge(self):
        return TerritoryChallenge(
            id="challenge-1",
            territoryId="test-territory-1",
            challengerId="player-2",
            defenderId="player-1",
            status=ChallengeStatus.PENDING,
            createdAt="2025-01-30T10:00:00Z",
            expiresAt="2025-01-30T11:00:00Z"
        )

    def test_init(self, service):
        """Test service initialization"""
        assert service.socket is None
        assert service.territories == {}
        assert service.active_challenges == {}
        assert service.match_results == {}

    @patch('src.services.territory.TerritoryGameplayService.socketio')
    def test_connect_socket(self, mock_socketio, service):
        """Test socket connection"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        
        service.connect_socket()
        
        assert service.socket == mock_socket
        mock_socketio.assert_called_once()

    def test_add_territory(self, service, mock_territory):
        """Test adding territory to service"""
        service.add_territory(mock_territory)
        
        assert mock_territory.id in service.territories
        assert service.territories[mock_territory.id] == mock_territory

    def test_get_territory(self, service, mock_territory):
        """Test getting territory by ID"""
        service.add_territory(mock_territory)
        
        result = service.get_territory(mock_territory.id)
        assert result == mock_territory

    def test_get_territory_not_found(self, service):
        """Test getting non-existent territory"""
        result = service.get_territory("non-existent")
        assert result is None

    def test_get_all_territories(self, service, mock_territory):
        """Test getting all territories"""
        service.add_territory(mock_territory)
        
        territories = service.get_all_territories()
        assert len(territories) == 1
        assert mock_territory in territories

    def test_create_challenge(self, service, mock_territory, mock_challenge):
        """Test creating a territory challenge"""
        service.add_territory(mock_territory)
        
        challenge = service.create_challenge(
            territory_id=mock_territory.id,
            challenger_id="player-2",
            defender_id="player-1"
        )
        
        assert challenge.territoryId == mock_territory.id
        assert challenge.challengerId == "player-2"
        assert challenge.defenderId == "player-1"
        assert challenge.status == ChallengeStatus.PENDING
        assert challenge.id in service.active_challenges

    def test_create_challenge_territory_not_found(self, service):
        """Test creating challenge for non-existent territory"""
        with pytest.raises(ValueError, match="Territory not found"):
            service.create_challenge(
                territory_id="non-existent",
                challenger_id="player-2",
                defender_id="player-1"
            )

    def test_accept_challenge(self, service, mock_challenge):
        """Test accepting a challenge"""
        service.active_challenges[mock_challenge.id] = mock_challenge
        
        result = service.accept_challenge(mock_challenge.id)
        
        assert result is True
        assert service.active_challenges[mock_challenge.id].status == ChallengeStatus.ACCEPTED

    def test_accept_challenge_not_found(self, service):
        """Test accepting non-existent challenge"""
        result = service.accept_challenge("non-existent")
        assert result is False

    def test_decline_challenge(self, service, mock_challenge):
        """Test declining a challenge"""
        service.active_challenges[mock_challenge.id] = mock_challenge
        
        result = service.decline_challenge(mock_challenge.id)
        
        assert result is True
        assert service.active_challenges[mock_challenge.id].status == ChallengeStatus.DECLINED

    def test_decline_challenge_not_found(self, service):
        """Test declining non-existent challenge"""
        result = service.decline_challenge("non-existent")
        assert result is False

    def test_get_challenge(self, service, mock_challenge):
        """Test getting challenge by ID"""
        service.active_challenges[mock_challenge.id] = mock_challenge
        
        result = service.get_challenge(mock_challenge.id)
        assert result == mock_challenge

    def test_get_challenge_not_found(self, service):
        """Test getting non-existent challenge"""
        result = service.get_challenge("non-existent")
        assert result is None

    def test_get_user_challenges(self, service, mock_challenge):
        """Test getting challenges for a user"""
        service.active_challenges[mock_challenge.id] = mock_challenge
        
        challenges = service.get_user_challenges("player-2")
        assert len(challenges) == 1
        assert mock_challenge in challenges

    def test_process_match_result(self, service, mock_territory, mock_challenge):
        """Test processing match result"""
        service.add_territory(mock_territory)
        service.active_challenges[mock_challenge.id] = mock_challenge
        
        match_result = MatchResult(
            id="match-1",
            challengerId="player-2",
            defenderId="player-1",
            winnerId="player-2",
            score={"player-2": 5, "player-1": 3},
            timestamp="2025-01-30T10:30:00Z"
        )
        
        service.process_match_result(mock_challenge.id, match_result)
        
        assert mock_challenge.id in service.match_results
        assert service.match_results[mock_challenge.id] == match_result
        assert service.active_challenges[mock_challenge.id].status == ChallengeStatus.COMPLETED

    def test_process_match_result_challenge_not_found(self, service):
        """Test processing match result for non-existent challenge"""
        match_result = MatchResult(
            id="match-1",
            challengerId="player-2",
            defenderId="player-1",
            winnerId="player-2",
            score={"player-2": 5, "player-1": 3},
            timestamp="2025-01-30T10:30:00Z"
        )
        
        with pytest.raises(ValueError, match="Challenge not found"):
            service.process_match_result("non-existent", match_result)

    @patch('src.services.territory.TerritoryGameplayService.socketio')
    def test_broadcast_territory_update(self, mock_socketio, service, mock_territory):
        """Test broadcasting territory updates"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_territory_update(mock_territory)
        
        mock_socket.emit.assert_called_with(
            'territory_update',
            mock_territory.dict()
        )

    @patch('src.services.territory.TerritoryGameplayService.socketio')
    def test_broadcast_challenge_update(self, mock_socketio, service, mock_challenge):
        """Test broadcasting challenge updates"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_challenge_update(mock_challenge)
        
        mock_socket.emit.assert_called_with(
            'challenge_update',
            mock_challenge.dict()
        )

    def test_get_territory_owner(self, service, mock_territory):
        """Test getting territory owner"""
        service.add_territory(mock_territory)
        
        owner = service.get_territory_owner(mock_territory.id)
        assert owner == "player-1"

    def test_get_territory_owner_not_found(self, service):
        """Test getting owner of non-existent territory"""
        owner = service.get_territory_owner("non-existent")
        assert owner is None

    def test_is_territory_owned_by(self, service, mock_territory):
        """Test checking if territory is owned by specific player"""
        service.add_territory(mock_territory)
        
        assert service.is_territory_owned_by(mock_territory.id, "player-1") is True
        assert service.is_territory_owned_by(mock_territory.id, "player-2") is False

    def test_get_territories_by_owner(self, service, mock_territory):
        """Test getting territories owned by specific player"""
        service.add_territory(mock_territory)
        
        territories = service.get_territories_by_owner("player-1")
        assert len(territories) == 1
        assert mock_territory in territories

    def test_get_territories_by_clan(self, service, mock_territory):
        """Test getting territories owned by specific clan"""
        service.add_territory(mock_territory)
        
        territories = service.get_territories_by_clan("test-clan")
        assert len(territories) == 1
        assert mock_territory in territories

    def test_remove_territory(self, service, mock_territory):
        """Test removing territory"""
        service.add_territory(mock_territory)
        
        service.remove_territory(mock_territory.id)
        
        assert mock_territory.id not in service.territories

    def test_remove_challenge(self, service, mock_challenge):
        """Test removing challenge"""
        service.active_challenges[mock_challenge.id] = mock_challenge
        
        service.remove_challenge(mock_challenge.id)
        
        assert mock_challenge.id not in service.active_challenges

    def test_get_expired_challenges(self, service, mock_challenge):
        """Test getting expired challenges"""
        service.active_challenges[mock_challenge.id] = mock_challenge
        
        # Mock current time to be after challenge expiration
        with patch('src.services.territory.TerritoryGameplayService.datetime') as mock_datetime:
            mock_datetime.now.return_value = "2025-01-30T12:00:00Z"
            mock_datetime.fromisoformat.return_value = "2025-01-30T12:00:00Z"
            
            expired = service.get_expired_challenges()
            assert len(expired) == 1
            assert mock_challenge in expired

    def test_cleanup_expired_challenges(self, service, mock_challenge):
        """Test cleaning up expired challenges"""
        service.active_challenges[mock_challenge.id] = mock_challenge
        
        # Mock current time to be after challenge expiration
        with patch('src.services.territory.TerritoryGameplayService.datetime') as mock_datetime:
            mock_datetime.now.return_value = "2025-01-30T12:00:00Z"
            mock_datetime.fromisoformat.return_value = "2025-01-30T12:00:00Z"
            
            service.cleanup_expired_challenges()
            
            assert mock_challenge.id not in service.active_challenges 