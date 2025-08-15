"""Tests for the wallet service."""

import pytest
import os
from decimal import Decimal
from datetime import datetime
from unittest.mock import Mock, patch

from dojopool.core.extensions import db
from dojopool.models.marketplace import Wallet, Transaction
from dojopool.models.user import User
from dojopool.services.wallet_service import WalletService, TransactionType, RewardType
from dojopool.core.exceptions import WalletError, InsufficientFundsError

# Use environment variables for test credentials
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "test_password_123")

@pytest.fixture
def mock_db_session():
    return Mock()

@pytest.fixture
def wallet_service(mock_db_session):
    return WalletService(mock_db_session)

@pytest.fixture
def sample_user():
    user = User()
    user.username = "testuser"
    user.email = "test@example.com"
    user.password_hash = TEST_PASSWORD
    return user

@pytest.fixture
def sample_wallet():
    wallet = Wallet()
    wallet.user_id = 1
    wallet.balance = 100.0
    wallet.currency = "USD"
    return wallet

@pytest.fixture
def sample_transaction():
    transaction = Transaction(
        wallet_id=1,
        user_id=1,
        amount=50.0,
        type="credit",
        status="completed",
        description="Test transaction"
    )
    return transaction

class TestWalletService:
    def test_create_wallet(self, wallet_service, sample_user, mock_db_session):
        # Test wallet creation
        wallet_service.create_wallet(sample_user.id)
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

    def test_get_wallet_balance(self, wallet_service, sample_wallet, mock_db_session):
        # Mock the query
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_wallet
        
        balance = wallet_service.get_wallet_balance(1)
        assert balance == 100.0

    def test_add_funds(self, wallet_service, sample_wallet, mock_db_session):
        # Mock the query
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_wallet
        
        wallet_service.add_funds(1, 50.0, "Test deposit")
        
        # Verify wallet balance was updated
        assert sample_wallet.balance == 150.0
        mock_db_session.commit.assert_called_once()

    def test_deduct_funds_sufficient_balance(self, wallet_service, sample_wallet, mock_db_session):
        # Mock the query
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_wallet
        
        result = wallet_service.deduct_funds(1, 50.0, "Test withdrawal")
        
        assert result is True
        assert sample_wallet.balance == 50.0
        mock_db_session.commit.assert_called_once()

    def test_deduct_funds_insufficient_balance(self, wallet_service, sample_wallet, mock_db_session):
        # Mock the query
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_wallet
        
        result = wallet_service.deduct_funds(1, 150.0, "Test withdrawal")
        
        assert result is False
        assert sample_wallet.balance == 100.0  # Balance unchanged

    def test_get_transaction_history(self, wallet_service, sample_transaction, mock_db_session):
        # Mock the query
        mock_db_session.query.return_value.filter.return_value.order_by.return_value.all.return_value = [sample_transaction]
        
        transactions = wallet_service.get_transaction_history(1)
        
        assert len(transactions) == 1
        assert transactions[0].amount == 50.0

    def test_transfer_funds_success(self, wallet_service, mock_db_session):
        # Create test users with secure passwords
        user1 = User()
        user1.username = "user1"
        user1.email = "user1@example.com"
        user1.password_hash = TEST_PASSWORD
        
        user2 = User()
        user2.username = "user2"
        user2.email = "user2@example.com"
        user2.password_hash = TEST_PASSWORD
        
        wallet1 = Wallet()
        wallet1.user_id = 1
        wallet1.balance = 100.0
        wallet1.currency = "USD"
        
        wallet2 = Wallet()
        wallet2.user_id = 2
        wallet2.balance = 50.0
        wallet2.currency = "USD"
        
        # Mock queries
        mock_db_session.query.return_value.filter.side_effect = [
            Mock(first=Mock(return_value=wallet1)),
            Mock(first=Mock(return_value=wallet2))
        ]
        
        result = wallet_service.transfer_funds(1, 2, 30.0, "Test transfer")
        
        assert result is True
        assert wallet1.balance == 70.0
        assert wallet2.balance == 80.0
        mock_db_session.commit.assert_called_once()

@pytest.fixture
def wallet_service():
    """Create a wallet service instance."""
    return WalletService()


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user = User(
        username="test_user",
        email="test@example.com",
        password="password123"
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def test_wallet(db, test_user, wallet_service):
    """Create a test wallet."""
    wallet = wallet_service.create_wallet(test_user.id)
    return wallet


def test_create_wallet(db, test_user, wallet_service):
    """Test wallet creation."""
    wallet = wallet_service.create_wallet(test_user.id)
    assert wallet is not None
    assert wallet.user_id == test_user.id
    assert wallet.balance == 0.0
    assert wallet.currency == "DP"
    assert wallet.is_active is True

    # Test duplicate wallet creation
    with pytest.raises(WalletError):
        wallet_service.create_wallet(test_user.id)


def test_get_wallet(db, test_wallet, wallet_service):
    """Test getting a wallet by ID."""
    wallet = wallet_service.get_wallet(test_wallet.id)
    assert wallet is not None
    assert wallet.id == test_wallet.id


def test_get_user_wallet(db, test_user, test_wallet, wallet_service):
    """Test getting a wallet by user ID."""
    wallet = wallet_service.get_user_wallet(test_user.id)
    assert wallet is not None
    assert wallet.id == test_wallet.id


def test_award_coins(db, test_user, test_wallet, wallet_service):
    """Test awarding coins."""
    transaction = wallet_service.award_coins(
        test_user.id,
        RewardType.MATCH_WIN,
        multiplier=1.5,
        description="Test reward"
    )

    assert transaction is not None
    assert transaction.transaction_type == TransactionType.REWARD.value
    assert transaction.amount == 15.0  # 10.0 * 1.5
    assert transaction.description == "Test reward"
    assert transaction.metadata["reward_type"] == RewardType.MATCH_WIN.value
    assert transaction.metadata["multiplier"] == 1.5

    # Check wallet balance
    wallet = wallet_service.get_user_wallet(test_user.id)
    assert wallet.balance == 15.0


def test_transfer_coins(db, wallet_service):
    """Test transferring coins between users."""
    # Create two users with wallets
    user1 = User(username="user1", email="user1@example.com", password="pass123")
    user2 = User(username="user2", email="user2@example.com", password="pass123")
    db.session.add_all([user1, user2])
    db.session.commit()

    wallet1 = wallet_service.create_wallet(user1.id)
    wallet2 = wallet_service.create_wallet(user2.id)

    # Award coins to user1
    wallet_service.award_coins(user1.id, RewardType.MATCH_WIN)
    initial_balance = wallet1.balance

    # Transfer coins
    amount = 5.0
    transaction = wallet_service.transfer_coins(
        user1.id,
        user2.id,
        amount,
        description="Test transfer"
    )

    assert transaction is not None
    assert transaction.transaction_type == TransactionType.TRANSFER.value
    assert transaction.amount == -amount  # Negative for sender
    assert transaction.description == "Test transfer"
    assert transaction.metadata["recipient_wallet_id"] == wallet2.id
    assert transaction.metadata["recipient_user_id"] == user2.id

    # Check balances
    wallet1 = wallet_service.get_user_wallet(user1.id)
    wallet2 = wallet_service.get_user_wallet(user2.id)
    assert wallet1.balance == initial_balance - amount
    assert wallet2.balance == amount

    # Test insufficient funds
    with pytest.raises(InsufficientFundsError):
        wallet_service.transfer_coins(user1.id, user2.id, 1000.0)


def test_get_transaction_history(db, test_user, test_wallet, wallet_service):
    """Test getting transaction history."""
    # Create some transactions
    wallet_service.award_coins(test_user.id, RewardType.MATCH_WIN)
    wallet_service.award_coins(test_user.id, RewardType.TOURNAMENT_WIN)
    wallet_service.award_coins(test_user.id, RewardType.TRICK_SHOT)

    # Get all transactions
    transactions = wallet_service.get_transaction_history(test_wallet.id)
    assert len(transactions) == 3

    # Get only reward transactions
    reward_transactions = wallet_service.get_transaction_history(
        test_wallet.id,
        transaction_type=TransactionType.REWARD
    )
    assert len(reward_transactions) == 3
    assert all(t.transaction_type == TransactionType.REWARD.value for t in reward_transactions)


def test_get_wallet_stats(db, test_user, test_wallet, wallet_service):
    """Test getting wallet statistics."""
    # Create some transactions
    wallet_service.award_coins(test_user.id, RewardType.MATCH_WIN)
    wallet_service.award_coins(test_user.id, RewardType.TOURNAMENT_WIN)
    wallet_service.award_coins(test_user.id, RewardType.TRICK_SHOT)

    stats = wallet_service.get_wallet_stats(test_wallet.id)
    assert stats["total_transactions"] == 3
    assert stats["total_volume"] == 135.0  # 10 + 100 + 25
    assert stats["average_transaction"] == 45.0  # (10 + 100 + 25) / 3
    assert stats["current_balance"] == 135.0

    # Check reward stats
    rewards = stats["rewards"]
    assert rewards[RewardType.MATCH_WIN.value]["count"] == 1
    assert rewards[RewardType.MATCH_WIN.value]["total_amount"] == 10.0
    assert rewards[RewardType.TOURNAMENT_WIN.value]["count"] == 1
    assert rewards[RewardType.TOURNAMENT_WIN.value]["total_amount"] == 100.0
    assert rewards[RewardType.TRICK_SHOT.value]["count"] == 1
    assert rewards[RewardType.TRICK_SHOT.value]["total_amount"] == 25.0 