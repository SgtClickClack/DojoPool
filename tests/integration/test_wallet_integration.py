"""Integration tests for the wallet system."""

import pytest
import os
from decimal import Decimal
from datetime import datetime, timedelta

from dojopool.core.extensions import db
from dojopool.models.marketplace import Wallet, Transaction
from dojopool.models.user import User
from dojopool.services.wallet_service import WalletService, TransactionType, RewardType
from dojopool.core.exceptions import WalletError, InsufficientFundsError

# Use environment variables for test credentials
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "test_password_123")

@pytest.fixture
def test_users():
    """Create test users with secure passwords"""
    users = []
    for i in range(3):
        user = User()
        user.username = f"test_user_{i}"
        user.email = f"test{i}@example.com"
        user.password_hash = TEST_PASSWORD
        users.append(user)
    return users


@pytest.fixture
def wallet_service():
    """Create a wallet service instance."""
    return WalletService()


@pytest.fixture
def wallets(app, test_users, wallet_service):
    """Create test wallets."""
    wallets = []
    for user in test_users:
        wallet = wallet_service.create_wallet(user.id)
        wallets.append(wallet)
    return wallets


def test_reward_and_transfer_flow(app, test_users, wallets, wallet_service):
    """Test complete flow of rewards and transfers."""
    # Award coins to first user for winning a match
    transaction1 = wallet_service.award_coins(
        test_users[0].id,
        RewardType.MATCH_WIN,
        multiplier=2.0,  # Double reward for a great performance
        description="Perfect game win"
    )

    # Verify the reward transaction
    assert transaction1.transaction_type == TransactionType.REWARD.value
    assert transaction1.amount == 20.0  # 10.0 * 2.0
    assert transaction1.description == "Perfect game win"
    assert transaction1.metadata["reward_type"] == RewardType.MATCH_WIN.value
    assert transaction1.metadata["multiplier"] == 2.0

    # Award tournament win bonus to second user
    transaction2 = wallet_service.award_coins(
        test_users[1].id,
        RewardType.TOURNAMENT_WIN,
        description="Tournament champion"
    )

    # Verify tournament reward
    assert transaction2.transaction_type == TransactionType.REWARD.value
    assert transaction2.amount == 100.0
    assert transaction2.description == "Tournament champion"

    # First user transfers some coins to third user
    transfer = wallet_service.transfer_coins(
        test_users[0].id,
        test_users[2].id,
        amount=5.0,
        description="Friendly bet payment"
    )

    # Verify the transfer
    assert transfer.transaction_type == TransactionType.TRANSFER.value
    assert transfer.amount == -5.0  # Negative for sender
    assert transfer.description == "Friendly bet payment"
    assert transfer.metadata["recipient_user_id"] == test_users[2].id

    # Check final balances
    wallet0 = wallet_service.get_user_wallet(test_users[0].id)
    wallet1 = wallet_service.get_user_wallet(test_users[1].id)
    wallet2 = wallet_service.get_user_wallet(test_users[2].id)

    assert wallet0.balance == 15.0  # 20.0 reward - 5.0 transfer
    assert wallet1.balance == 100.0  # Tournament win
    assert wallet2.balance == 5.0  # Received transfer


def test_concurrent_transfers(app, test_users, wallets, wallet_service):
    """Test handling of concurrent transfers."""
    # Award initial coins to first user
    wallet_service.award_coins(test_users[0].id, RewardType.MATCH_WIN)

    # Try to make multiple transfers that would exceed balance
    transfer_amount = 4.0  # Total would be 12.0, exceeding balance of 10.0
    
    # Should succeed
    transfer1 = wallet_service.transfer_coins(
        test_users[0].id,
        test_users[1].id,
        transfer_amount,
        "First transfer"
    )
    assert transfer1 is not None
    
    # Should succeed
    transfer2 = wallet_service.transfer_coins(
        test_users[0].id,
        test_users[2].id,
        transfer_amount,
        "Second transfer"
    )
    assert transfer2 is not None
    
    # Should fail - insufficient funds
    with pytest.raises(InsufficientFundsError):
        wallet_service.transfer_coins(
            test_users[0].id,
            test_users[1].id,
            transfer_amount,
            "Third transfer"
        )

    # Verify final balances
    wallet0 = wallet_service.get_user_wallet(test_users[0].id)
    wallet1 = wallet_service.get_user_wallet(test_users[1].id)
    wallet2 = wallet_service.get_user_wallet(test_users[2].id)

    assert wallet0.balance == 2.0  # 10.0 - 4.0 - 4.0
    assert wallet1.balance == 4.0
    assert wallet2.balance == 4.0


def test_transaction_history_and_stats(app, test_users, wallets, wallet_service):
    """Test transaction history retrieval and statistics calculation."""
    # Create various transactions
    wallet_service.award_coins(test_users[0].id, RewardType.MATCH_WIN)
    wallet_service.award_coins(test_users[0].id, RewardType.TOURNAMENT_WIN)
    wallet_service.award_coins(test_users[0].id, RewardType.TRICK_SHOT)
    
    # Transfer some coins
    wallet_service.transfer_coins(test_users[0].id, test_users[1].id, 20.0, "Test transfer")

    # Get transaction history
    wallet = wallet_service.get_user_wallet(test_users[0].id)
    transactions = wallet_service.get_transaction_history(
        wallet.id,
        start_date=datetime.utcnow() - timedelta(days=1),
        end_date=datetime.utcnow() + timedelta(days=1)
    )

    # Verify transaction history
    assert len(transactions) == 4  # 3 rewards + 1 transfer
    assert sum(1 for t in transactions if t.transaction_type == TransactionType.REWARD.value) == 3
    assert sum(1 for t in transactions if t.transaction_type == TransactionType.TRANSFER.value) == 1

    # Get wallet stats
    stats = wallet_service.get_wallet_stats(wallet.id)

    # Verify stats
    assert stats["total_transactions"] == 4
    assert stats["total_volume"] == 155.0  # 10 + 100 + 25 + 20
    assert stats["average_transaction"] == 38.75  # 155 / 4
    assert stats["current_balance"] == 115.0  # 135 - 20

    # Verify reward stats
    rewards = stats["rewards"]
    assert rewards[RewardType.MATCH_WIN.value]["count"] == 1
    assert rewards[RewardType.MATCH_WIN.value]["total_amount"] == 10.0
    assert rewards[RewardType.TOURNAMENT_WIN.value]["count"] == 1
    assert rewards[RewardType.TOURNAMENT_WIN.value]["total_amount"] == 100.0
    assert rewards[RewardType.TRICK_SHOT.value]["count"] == 1
    assert rewards[RewardType.TRICK_SHOT.value]["total_amount"] == 25.0


def test_error_handling(app, test_users, wallets, wallet_service):
    """Test error handling in various scenarios."""
    # Try to create duplicate wallet
    with pytest.raises(WalletError) as exc:
        wallet_service.create_wallet(test_users[0].id)
    assert "already has a wallet" in str(exc.value)

    # Try to award coins to non-existent wallet
    with pytest.raises(WalletError) as exc:
        wallet_service.award_coins(999999, RewardType.MATCH_WIN)
    assert "not found" in str(exc.value)

    # Try to transfer with insufficient funds
    with pytest.raises(InsufficientFundsError) as exc:
        wallet_service.transfer_coins(test_users[0].id, test_users[1].id, 1000.0)
    assert "insufficient" in str(exc.value).lower()

    # Try to transfer to non-existent wallet
    with pytest.raises(WalletError) as exc:
        wallet_service.transfer_coins(test_users[0].id, 999999, 10.0)
    assert "not found" in str(exc.value)

    # Try to get stats for non-existent wallet
    with pytest.raises(WalletError) as exc:
        wallet_service.get_wallet_stats(999999)
    assert "not found" in str(exc.value) 