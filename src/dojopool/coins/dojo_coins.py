"""
Dojo Coins Management Module

DEPRECATED: This module contains legacy wallet and transaction models that conflict
with the unified system in dojopool/models/marketplace.py.

The unified wallet system in marketplace.py provides:
- Consistent SQLAlchemy models (Wallet, Transaction)
- Proper database relationships and constraints
- Audit logging and security features
- Marketplace integration

This module should be refactored to use the unified wallet service
(dojopool/services/wallet_service.py) instead of maintaining separate models.

TODO: Migrate DojoCoinsManager to use the unified WalletService
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
import uuid
from decimal import Decimal

# DEPRECATED: These models conflict with the unified system in marketplace.py
# TODO: Migrate to use WalletService from dojopool/services/wallet_service.py

class RewardType(Enum):
    """Types of rewards that can earn Dojo Coins."""

    MATCH_WIN = "match_win"
    TOURNAMENT_WIN = "tournament_win"
    TRICK_SHOT = "trick_shot"
    ACHIEVEMENT = "achievement"
    DAILY_CHALLENGE = "daily_challenge"
    WEEKLY_CHALLENGE = "weekly_challenge"
    CLAN_BONUS = "clan_bonus"
    VENUE_BONUS = "venue_bonus"


class TransactionType(Enum):
    """Types of Dojo Coin transactions."""

    REWARD = "reward"
    PURCHASE = "purchase"
    TRANSFER = "transfer"
    TOURNAMENT_ENTRY = "tournament_entry"
    CLAN_CONTRIBUTION = "clan_contribution"
    VENUE_PAYMENT = "venue_payment"


@dataclass
class Transaction:
    """Record of a Dojo Coin transaction."""

    transaction_id: str
    timestamp: datetime
    transaction_type: TransactionType
    amount: Decimal
    sender_id: str
    recipient_id: str
    description: str
    reward_type: Optional[RewardType] = None
    blockchain_hash: Optional[str] = None


@dataclass
class WalletStats:
    """Statistics for a Dojo Coin wallet."""

    total_earned: Decimal = Decimal("0")
    total_spent: Decimal = Decimal("0")
    matches_rewarded: int = 0
    tournaments_rewarded: int = 0
    trick_shots_rewarded: int = 0
    achievements_rewarded: int = 0
    challenges_completed: int = 0


@dataclass
class Wallet:
    """Dojo Coin wallet for a player."""

    wallet_id: str
    player_id: str
    balance: Decimal
    created_at: datetime
    stats: WalletStats = WalletStats()
    transactions: Optional[List[Transaction]] = None

    def __post_init__(self):
        """Initialize default values after dataclass creation."""
        if self.transactions is None:
            self.transactions = []


class DojoCoinsManager:
    """Manages Dojo Coins system including wallets and transactions.
    
    DEPRECATED: This class should be replaced with WalletService from 
    dojopool/services/wallet_service.py which provides the unified wallet system.
    """

    def __init__(self, blockchain_provider: str = "solana"):
        """Initialize the Dojo Coins manager."""
        self._wallets: Dict[str, Wallet] = {}
        self._transactions: List[Transaction] = []
        self._blockchain_provider = blockchain_provider
        self._reward_rates = self._initialize_reward_rates()

    def _initialize_reward_rates(self) -> Dict[RewardType, Decimal]:
        """Initialize reward rates for different actions."""
        return {
            RewardType.MATCH_WIN: Decimal("10.0"),
            RewardType.TOURNAMENT_WIN: Decimal("100.0"),
            RewardType.TRICK_SHOT: Decimal("25.0"),
            RewardType.ACHIEVEMENT: Decimal("50.0"),
            RewardType.DAILY_CHALLENGE: Decimal("15.0"),
            RewardType.WEEKLY_CHALLENGE: Decimal("75.0"),
            RewardType.CLAN_BONUS: Decimal("5.0"),
            RewardType.VENUE_BONUS: Decimal("5.0"),
        }

    def create_wallet(self, player_id: str) -> Wallet:
        """Create a new wallet for a player."""
        wallet_id = str(uuid.uuid4())
        wallet = Wallet(
            wallet_id=wallet_id,
            player_id=player_id,
            balance=Decimal("0"),
            created_at=datetime.now(),
            transactions=[],
        )
        self._wallets[wallet_id] = wallet
        return wallet

    def get_wallet(self, wallet_id: str) -> Optional[Wallet]:
        """Get wallet by ID."""
        return self._wallets.get(wallet_id)

    def get_player_wallet(self, player_id: str) -> Optional[Wallet]:
        """Get wallet by player ID."""
        for wallet in self._wallets.values():
            if wallet.player_id == player_id:
                return wallet
        return None

    def award_coins(
        self,
        player_id: str,
        reward_type: RewardType,
        multiplier: float = 1.0,
        description: str = "",
    ) -> Optional[Transaction]:
        """Award Dojo Coins for an action."""
        wallet = self.get_player_wallet(player_id)
        if not wallet:
            return None

        # Calculate reward amount
        base_amount = self._reward_rates[reward_type]
        amount = base_amount * Decimal(str(multiplier))

        # Create transaction
        transaction = Transaction(
            transaction_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            transaction_type=TransactionType.REWARD,
            amount=amount,
            sender_id="SYSTEM",
            recipient_id=player_id,
            description=description,
            reward_type=reward_type,
        )

        # Update wallet
        wallet.balance += amount
        wallet.transactions.append(transaction)
        self._update_wallet_stats(wallet, transaction)

        # Record transaction
        self._transactions.append(transaction)

        # Submit to blockchain
        self._submit_to_blockchain(transaction)

        return transaction

    def transfer_coins(
        self,
        sender_wallet_id: str,
        recipient_wallet_id: str,
        amount: Decimal,
        description: str = "",
    ) -> Optional[Transaction]:
        """Transfer coins between wallets."""
        sender = self.get_wallet(sender_wallet_id)
        recipient = self.get_wallet(recipient_wallet_id)

        if not sender or not recipient:
            return None

        if sender.balance < amount:
            return None

        # Create transaction
        transaction = Transaction(
            transaction_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            transaction_type=TransactionType.TRANSFER,
            amount=amount,
            sender_id=sender.player_id,
            recipient_id=recipient.player_id,
            description=description,
        )

        # Update wallets
        sender.balance -= amount
        recipient.balance += amount
        sender.transactions.append(transaction)
        recipient.transactions.append(transaction)

        # Record transaction
        self._transactions.append(transaction)

        # Submit to blockchain
        self._submit_to_blockchain(transaction)

        return transaction

    def _update_wallet_stats(self, wallet: Wallet, transaction: Transaction) -> None:
        """Update wallet statistics based on transaction."""
        if transaction.transaction_type == TransactionType.REWARD:
            wallet.stats.total_earned += transaction.amount
            if transaction.reward_type == RewardType.MATCH_WIN:
                wallet.stats.matches_rewarded += 1
            elif transaction.reward_type == RewardType.TOURNAMENT_WIN:
                wallet.stats.tournaments_rewarded += 1
            elif transaction.reward_type == RewardType.TRICK_SHOT:
                wallet.stats.trick_shots_rewarded += 1
            elif transaction.reward_type == RewardType.ACHIEVEMENT:
                wallet.stats.achievements_rewarded += 1
            elif transaction.reward_type in [
                RewardType.DAILY_CHALLENGE,
                RewardType.WEEKLY_CHALLENGE,
            ]:
                wallet.stats.challenges_completed += 1
        else:
            wallet.stats.total_spent += transaction.amount

    def _submit_to_blockchain(self, transaction: Transaction) -> None:
        """Submit transaction to blockchain."""
        # TODO: Implement blockchain integration
        # This will vary based on the chosen blockchain (Solana/ERC-20)
        pass

    def get_transaction_history(self, wallet_id: str, limit: int = 50) -> List[Transaction]:
        """Get transaction history for a wallet."""
        wallet = self.get_wallet(wallet_id)
        if not wallet:
            return []

        return sorted(wallet.transactions, key=lambda t: t.timestamp, reverse=True)[:limit]

    def get_wallet_stats(self, wallet_id: str) -> Optional[WalletStats]:
        """Get statistics for a wallet."""
        wallet = self.get_wallet(wallet_id)
        if not wallet:
            return None
        return wallet.stats

    def get_top_earners(self, limit: int = 10) -> List[Wallet]:
        """Get top earning wallets."""
        wallets = list(self._wallets.values())
        return sorted(wallets, key=lambda w: w.stats.total_earned, reverse=True)[:limit]
