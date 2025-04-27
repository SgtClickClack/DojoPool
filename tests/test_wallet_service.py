"""Tests for the wallet service."""

import pytest
from decimal import Decimal
from datetime import datetime

from dojopool.core.extensions import db
from dojopool.models.marketplace import Wallet, Transaction
from dojopool.models.user import User
from dojopool.services.wallet_service import WalletService, TransactionType, RewardType
from dojopool.core.exceptions import WalletError, InsufficientFundsError


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