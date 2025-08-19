import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.services.economy.DojoCoinEconomyService import DojoCoinEconomyService
from src.types.economy import Transaction, TransactionType, Rank, EconomicBalance
from src.types.user import User

class TestDojoCoinEconomyService:
    @pytest.fixture
    def service(self):
        return DojoCoinEconomyService()
    
    @pytest.fixture
    def mock_user(self):
        return User(
            id="user-1",
            username="testuser",
            email="test@example.com",
            avatar="avatar-1",
            clan="test-clan"
        )
    
    @pytest.fixture
    def mock_transaction(self):
        return Transaction(
            id="tx-1",
            userId="user-1",
            type=TransactionType.EARN,
            amount=100,
            category="match_win",
            description="Won a pool match",
            timestamp="2025-01-30T10:00:00Z",
            metadata={"matchId": "match-1", "opponent": "player-2"}
        )

    def test_init(self, service):
        """Test service initialization"""
        assert service.socket is None
        assert service.balances == {}
        assert service.transactions == {}
        assert service.leaderboards == {}
        assert service.daily_limits == {}
        assert service.weekly_limits == {}

    @patch('src.services.economy.DojoCoinEconomyService.socketio')
    def test_connect_socket(self, mock_socketio, service):
        """Test socket connection"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        
        service.connect_socket()
        
        assert service.socket == mock_socket
        mock_socketio.assert_called_once()

    def test_create_user_balance(self, service, mock_user):
        """Test creating user balance"""
        balance = service.create_user_balance(mock_user.id)
        
        assert balance.userId == mock_user.id
        assert balance.balance == 0
        assert balance.rank == Rank.BRONZE
        assert balance.totalEarned == 0
        assert balance.totalSpent == 0
        assert mock_user.id in service.balances

    def test_get_user_balance(self, service, mock_user):
        """Test getting user balance"""
        service.create_user_balance(mock_user.id)
        
        balance = service.get_user_balance(mock_user.id)
        assert balance is not None
        assert balance.userId == mock_user.id

    def test_get_user_balance_not_found(self, service):
        """Test getting non-existent user balance"""
        balance = service.get_user_balance("non-existent")
        assert balance is None

    def test_add_transaction(self, service, mock_user, mock_transaction):
        """Test adding transaction"""
        service.create_user_balance(mock_user.id)
        
        transaction = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=100,
            category="match_win",
            description="Won a pool match",
            metadata={"matchId": "match-1"}
        )
        
        assert transaction.id is not None
        assert transaction.userId == mock_user.id
        assert transaction.type == TransactionType.EARN
        assert transaction.amount == 100
        assert transaction.id in service.transactions

    def test_add_transaction_user_not_found(self, service):
        """Test adding transaction for non-existent user"""
        with pytest.raises(ValueError, match="User balance not found"):
            service.add_transaction(
                user_id="non-existent",
                type=TransactionType.EARN,
                amount=100,
                category="match_win",
                description="Won a pool match"
            )

    def test_process_earn_transaction(self, service, mock_user):
        """Test processing earn transaction"""
        service.create_user_balance(mock_user.id)
        
        transaction = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=100,
            category="match_win",
            description="Won a pool match"
        )
        
        service.process_transaction(transaction)
        
        balance = service.get_user_balance(mock_user.id)
        assert balance.balance == 100
        assert balance.totalEarned == 100

    def test_process_spend_transaction(self, service, mock_user):
        """Test processing spend transaction"""
        service.create_user_balance(mock_user.id)
        
        # First earn some coins
        earn_tx = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=200,
            category="match_win",
            description="Won a pool match"
        )
        service.process_transaction(earn_tx)
        
        # Then spend some coins
        spend_tx = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.SPEND,
            amount=50,
            category="avatar_upgrade",
            description="Upgraded avatar"
        )
        service.process_transaction(spend_tx)
        
        balance = service.get_user_balance(mock_user.id)
        assert balance.balance == 150
        assert balance.totalEarned == 200
        assert balance.totalSpent == 50

    def test_process_spend_transaction_insufficient_funds(self, service, mock_user):
        """Test processing spend transaction with insufficient funds"""
        service.create_user_balance(mock_user.id)
        
        spend_tx = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.SPEND,
            amount=100,
            category="avatar_upgrade",
            description="Upgraded avatar"
        )
        
        with pytest.raises(ValueError, match="Insufficient funds"):
            service.process_transaction(spend_tx)

    def test_calculate_rank_progression(self, service, mock_user):
        """Test rank progression calculation"""
        service.create_user_balance(mock_user.id)
        
        # Earn enough to reach Silver rank (1000 coins)
        transaction = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=1000,
            category="match_win",
            description="Won multiple matches"
        )
        service.process_transaction(transaction)
        
        balance = service.get_user_balance(mock_user.id)
        assert balance.rank == Rank.SILVER

    def test_calculate_rank_progression_gold(self, service, mock_user):
        """Test progression to Gold rank"""
        service.create_user_balance(mock_user.id)
        
        # Earn enough to reach Gold rank (5000 coins)
        transaction = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=5000,
            category="match_win",
            description="Won many matches"
        )
        service.process_transaction(transaction)
        
        balance = service.get_user_balance(mock_user.id)
        assert balance.rank == Rank.GOLD

    def test_calculate_rank_progression_platinum(self, service, mock_user):
        """Test progression to Platinum rank"""
        service.create_user_balance(mock_user.id)
        
        # Earn enough to reach Platinum rank (10000 coins)
        transaction = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=10000,
            category="match_win",
            description="Won many matches"
        )
        service.process_transaction(transaction)
        
        balance = service.get_user_balance(mock_user.id)
        assert balance.rank == Rank.PLATINUM

    def test_calculate_rank_progression_diamond(self, service, mock_user):
        """Test progression to Diamond rank"""
        service.create_user_balance(mock_user.id)
        
        # Earn enough to reach Diamond rank (25000 coins)
        transaction = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=25000,
            category="match_win",
            description="Won many matches"
        )
        service.process_transaction(transaction)
        
        balance = service.get_user_balance(mock_user.id)
        assert balance.rank == Rank.DIAMOND

    def test_get_category_multiplier(self, service):
        """Test getting category multipliers"""
        assert service.get_category_multiplier("match_win") == 1.0
        assert service.get_category_multiplier("tournament_win") == 2.0
        assert service.get_category_multiplier("territory_control") == 1.5
        assert service.get_category_multiplier("achievement") == 3.0
        assert service.get_category_multiplier("unknown") == 1.0

    def test_check_daily_limit(self, service, mock_user):
        """Test daily earning limit check"""
        service.create_user_balance(mock_user.id)
        
        # Set daily limit
        service.daily_limits[mock_user.id] = {"amount": 500, "reset_time": "2025-01-30T23:59:59Z"}
        
        # Try to earn within limit
        assert service.check_daily_limit(mock_user.id, 100) is True
        
        # Try to earn beyond limit
        assert service.check_daily_limit(mock_user.id, 600) is False

    def test_check_weekly_limit(self, service, mock_user):
        """Test weekly earning limit check"""
        service.create_user_balance(mock_user.id)
        
        # Set weekly limit
        service.weekly_limits[mock_user.id] = {"amount": 2000, "reset_time": "2025-02-05T23:59:59Z"}
        
        # Try to earn within limit
        assert service.check_weekly_limit(mock_user.id, 500) is True
        
        # Try to earn beyond limit
        assert service.check_weekly_limit(mock_user.id, 2500) is False

    def test_transfer_coins(self, service, mock_user):
        """Test transferring coins between users"""
        service.create_user_balance(mock_user.id)
        service.create_user_balance("user-2")
        
        # Give user-1 some coins first
        earn_tx = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=200,
            category="match_win",
            description="Won a pool match"
        )
        service.process_transaction(earn_tx)
        
        # Transfer coins
        transfer = service.transfer_coins(
            from_user_id=mock_user.id,
            to_user_id="user-2",
            amount=50,
            description="Gift to friend"
        )
        
        assert transfer is not None
        assert transfer.type == TransactionType.TRANSFER
        
        # Check balances
        balance1 = service.get_user_balance(mock_user.id)
        balance2 = service.get_user_balance("user-2")
        assert balance1.balance == 150
        assert balance2.balance == 50

    def test_transfer_coins_insufficient_funds(self, service, mock_user):
        """Test transferring coins with insufficient funds"""
        service.create_user_balance(mock_user.id)
        service.create_user_balance("user-2")
        
        with pytest.raises(ValueError, match="Insufficient funds"):
            service.transfer_coins(
                from_user_id=mock_user.id,
                to_user_id="user-2",
                amount=100,
                description="Gift to friend"
            )

    def test_get_user_transactions(self, service, mock_user):
        """Test getting user transactions"""
        service.create_user_balance(mock_user.id)
        
        # Add multiple transactions
        tx1 = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=100,
            category="match_win",
            description="Won a pool match"
        )
        tx2 = service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=200,
            category="tournament_win",
            description="Won a tournament"
        )
        
        transactions = service.get_user_transactions(mock_user.id)
        assert len(transactions) == 2
        assert tx1 in transactions
        assert tx2 in transactions

    def test_get_transaction_statistics(self, service, mock_user):
        """Test getting transaction statistics"""
        service.create_user_balance(mock_user.id)
        
        # Add various transactions
        service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=100,
            category="match_win",
            description="Won a pool match"
        )
        service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=200,
            category="tournament_win",
            description="Won a tournament"
        )
        service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.SPEND,
            amount=50,
            category="avatar_upgrade",
            description="Upgraded avatar"
        )
        
        stats = service.get_transaction_statistics(mock_user.id)
        assert stats["total_earned"] == 300
        assert stats["total_spent"] == 50
        assert stats["net_balance"] == 250
        assert stats["transaction_count"] == 3

    def test_update_leaderboards(self, service, mock_user):
        """Test updating leaderboards"""
        service.create_user_balance(mock_user.id)
        service.create_user_balance("user-2")
        service.create_user_balance("user-3")
        
        # Give different amounts to users
        service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=1000,
            category="match_win",
            description="Won matches"
        )
        service.add_transaction(
            user_id="user-2",
            type=TransactionType.EARN,
            amount=2000,
            category="match_win",
            description="Won matches"
        )
        service.add_transaction(
            user_id="user-3",
            type=TransactionType.EARN,
            amount=500,
            category="match_win",
            description="Won matches"
        )
        
        service.update_leaderboards()
        
        balance_leaderboard = service.leaderboards.get("balance", [])
        assert len(balance_leaderboard) == 3
        assert balance_leaderboard[0]["userId"] == "user-2"  # Highest balance
        assert balance_leaderboard[1]["userId"] == mock_user.id
        assert balance_leaderboard[2]["userId"] == "user-3"

    def test_get_leaderboard(self, service, mock_user):
        """Test getting leaderboard"""
        service.create_user_balance(mock_user.id)
        service.create_user_balance("user-2")
        
        # Give different amounts to users
        service.add_transaction(
            user_id=mock_user.id,
            type=TransactionType.EARN,
            amount=1000,
            category="match_win",
            description="Won matches"
        )
        service.add_transaction(
            user_id="user-2",
            type=TransactionType.EARN,
            amount=2000,
            category="match_win",
            description="Won matches"
        )
        
        service.update_leaderboards()
        
        leaderboard = service.get_leaderboard("balance")
        assert len(leaderboard) == 2
        assert leaderboard[0]["userId"] == "user-2"
        assert leaderboard[1]["userId"] == mock_user.id

    @patch('src.services.economy.DojoCoinEconomyService.socketio')
    def test_broadcast_balance_update(self, mock_socketio, service, mock_user):
        """Test broadcasting balance updates"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        balance = service.create_user_balance(mock_user.id)
        
        service.broadcast_balance_update(balance)
        
        mock_socket.emit.assert_called_with(
            'balance_update',
            balance.dict()
        )

    @patch('src.services.economy.DojoCoinEconomyService.socketio')
    def test_broadcast_transaction(self, mock_socketio, service, mock_user, mock_transaction):
        """Test broadcasting transactions"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        service.broadcast_transaction(mock_transaction)
        
        mock_socket.emit.assert_called_with(
            'transaction_update',
            mock_transaction.dict()
        )

    def test_reset_daily_limits(self, service, mock_user):
        """Test resetting daily limits"""
        service.create_user_balance(mock_user.id)
        service.daily_limits[mock_user.id] = {"amount": 500, "reset_time": "2025-01-30T23:59:59Z"}
        
        with patch('src.services.economy.DojoCoinEconomyService.datetime') as mock_datetime:
            mock_datetime.now.return_value = "2025-01-31T00:00:00Z"
            mock_datetime.fromisoformat.return_value = "2025-01-31T00:00:00Z"
            
            service.reset_daily_limits()
            
            assert mock_user.id not in service.daily_limits

    def test_reset_weekly_limits(self, service, mock_user):
        """Test resetting weekly limits"""
        service.create_user_balance(mock_user.id)
        service.weekly_limits[mock_user.id] = {"amount": 2000, "reset_time": "2025-02-05T23:59:59Z"}
        
        with patch('src.services.economy.DojoCoinEconomyService.datetime') as mock_datetime:
            mock_datetime.now.return_value = "2025-02-06T00:00:00Z"
            mock_datetime.fromisoformat.return_value = "2025-02-06T00:00:00Z"
            
            service.reset_weekly_limits()
            
            assert mock_user.id not in service.weekly_limits

    def test_get_economic_statistics(self, service):
        """Test getting economic statistics"""
        stats = service.get_economic_statistics()
        assert stats is not None
        assert "total_users" in stats
        assert "total_transactions" in stats
        assert "total_volume" in stats
        assert "average_balance" in stats 