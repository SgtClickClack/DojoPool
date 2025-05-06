"""
Wallet Service Module

This module provides a unified service layer for managing wallets, transactions,
and Dojo Coins across the platform. It combines the functionality of the legacy
DojoCoinsManager with the new SQLAlchemy-based wallet system.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func

from dojopool.core.extensions import db
from dojopool.models.marketplace import Wallet, Transaction
from dojopool.models.user import User
from dojopool.core.exceptions import WalletError, InsufficientFundsError, BlockchainError
from dojopool.core.interfaces.wallet import IWalletService
from dojopool.core.types.wallet_types import TransactionType, RewardType


class WalletService(IWalletService):
    """Service for managing user wallets and transactions."""

    def __init__(self, blockchain_provider: str = "solana"):
        """Initialize the wallet service.
        
        Args:
            blockchain_provider: The blockchain provider to use (default: "solana")
        """
        self._blockchain_provider = blockchain_provider
        self._reward_rates = self._initialize_reward_rates()

    def _initialize_reward_rates(self) -> Dict[RewardType, Decimal]:
        """Initialize reward rates for different actions."""
        return {
            RewardType.MATCH_WIN: Decimal("10.0"),
            RewardType.TOURNAMENT_WIN: Decimal("100.0"),
            RewardType.TRICK_SHOT: Decimal("25.0"),
            RewardType.ACHIEVEMENT: Decimal("50.0"),
            RewardType.DAILY_BONUS: Decimal("1.0"),
            RewardType.WEEKLY_CHALLENGE: Decimal("75.0"),
            RewardType.CLAN_BONUS: Decimal("5.0"),
            RewardType.VENUE_BONUS: Decimal("5.0"),
        }

    def create_wallet(self, user_id: int) -> Wallet:
        """Create a new wallet for a user.
        
        Args:
            user_id: The ID of the user.
            
        Returns:
            The created wallet.
            
        Raises:
            WalletError: If the user already has a wallet.
        """
        existing_wallet = self.get_user_wallet(user_id)
        if existing_wallet:
            raise WalletError("User already has a wallet")

        wallet = Wallet(
            user_id=user_id,
            balance=0.0,
            currency="DP",  # DojoPool coins
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.session.add(wallet)
        db.session.commit()
        return wallet

    def get_wallet(self, wallet_id: int) -> Optional[Wallet]:
        """Get a wallet by ID.
        
        Args:
            wallet_id: The ID of the wallet.
            
        Returns:
            The wallet if found, None otherwise.
        """
        return Wallet.query.get(wallet_id)

    def get_user_wallet(self, user_id: int) -> Optional[Wallet]:
        """Get a user's wallet.
        
        Args:
            user_id: The ID of the user.
            
        Returns:
            The user's wallet if found, None otherwise.
        """
        return Wallet.query.filter_by(user_id=user_id).first()

    def award_coins(
        self,
        user_id: int,
        reward_type: RewardType,
        multiplier: float = 1.0,
        description: Optional[str] = None
    ) -> Transaction:
        """Award coins to a user's wallet.
        
        Args:
            user_id: The ID of the user.
            reward_type: The type of reward.
            multiplier: Optional multiplier for the reward amount.
            description: Optional description of the reward.
            
        Returns:
            The created transaction.
            
        Raises:
            WalletError: If the user's wallet is not found.
        """
        wallet = self.get_user_wallet(user_id)
        if not wallet:
            raise WalletError("User wallet not found")

        amount = float(self._reward_rates[reward_type] * Decimal(str(multiplier)))
        description = description or f"{reward_type.value} reward"

        transaction = Transaction(
            wallet_id=wallet.id,
            transaction_type=TransactionType.REWARD.value,
            amount=amount,
            description=description,
            metadata={
                "reward_type": reward_type.value,
                "multiplier": multiplier
            },
            created_at=datetime.utcnow()
        )
        
        wallet.balance += amount
        wallet.updated_at = datetime.utcnow()
        db.session.add(transaction)
        db.session.commit()

        # Submit to blockchain
        try:
            self._submit_to_blockchain(transaction)
        except BlockchainError as e:
            # Log error but don't rollback - transaction is still valid locally
            print(f"Blockchain submission failed: {e}")

        return transaction

    def transfer_coins(
        self,
        sender_user_id: int,
        recipient_user_id: int,
        amount: float,
        description: Optional[str] = None
    ) -> Transaction:
        """Transfer coins between users.
        
        Args:
            sender_user_id: The ID of the sending user.
            recipient_user_id: The ID of the receiving user.
            amount: The amount to transfer.
            description: Optional description of the transfer.
            
        Returns:
            The sender's transaction.
            
        Raises:
            WalletError: If either wallet is not found.
            InsufficientFundsError: If sender has insufficient funds.
        """
        sender_wallet = self.get_user_wallet(sender_user_id)
        recipient_wallet = self.get_user_wallet(recipient_user_id)

        if not sender_wallet or not recipient_wallet:
            raise WalletError("Sender or recipient wallet not found")

        if sender_wallet.balance < amount:
            raise InsufficientFundsError("Insufficient funds for transfer")

        description = description or f"Transfer to user {recipient_user_id}"

        # Create sender's transaction (negative amount)
        sender_transaction = Transaction(
            wallet_id=sender_wallet.id,
            transaction_type=TransactionType.TRANSFER.value,
            amount=-amount,
            description=description,
            metadata={
                "recipient_user_id": recipient_user_id,
                "recipient_wallet_id": recipient_wallet.id
            },
            created_at=datetime.utcnow()
        )

        # Create recipient's transaction (positive amount)
        recipient_transaction = Transaction(
            wallet_id=recipient_wallet.id,
            transaction_type=TransactionType.TRANSFER.value,
            amount=amount,
            description=f"Transfer from user {sender_user_id}",
            metadata={
                "sender_user_id": sender_user_id,
                "sender_wallet_id": sender_wallet.id
            },
            created_at=datetime.utcnow()
        )

        # Update wallet balances
        sender_wallet.balance -= amount
        recipient_wallet.balance += amount
        sender_wallet.updated_at = datetime.utcnow()
        recipient_wallet.updated_at = datetime.utcnow()

        # Save changes
        db.session.add_all([sender_transaction, recipient_transaction])
        db.session.commit()

        # Submit to blockchain
        try:
            self._submit_to_blockchain(sender_transaction)
        except BlockchainError as e:
            # Log error but don't rollback - transaction is still valid locally
            print(f"Blockchain submission failed: {e}")

        return sender_transaction

    def get_transaction_history(self, wallet_id: int, limit: int = 50) -> List[Transaction]:
        """Get transaction history for a wallet.
        
        Args:
            wallet_id: The ID of the wallet.
            limit: Maximum number of transactions to return.
            
        Returns:
            List of transactions, sorted by creation date descending.
        """
        return Transaction.query.filter_by(wallet_id=wallet_id)\
            .order_by(Transaction.created_at.desc())\
            .limit(limit)\
            .all()

    def get_wallet_stats(self, wallet_id: int) -> Dict[str, Any]:
        """Get statistics for a wallet.
        
        Args:
            wallet_id: The ID of the wallet.
            
        Returns:
            Dictionary containing wallet statistics.
            
        Raises:
            WalletError: If the wallet is not found.
        """
        wallet = self.get_wallet(wallet_id)
        if not wallet:
            raise WalletError("Wallet not found")

        # Get total transactions and volume
        total_transactions = Transaction.query.filter_by(wallet_id=wallet_id).count()
        total_volume = db.session.query(
            func.sum(func.abs(Transaction.amount))
        ).filter_by(wallet_id=wallet_id).scalar() or 0

        # Get incoming and outgoing totals
        total_incoming = db.session.query(
            func.sum(Transaction.amount)
        ).filter(
            Transaction.wallet_id == wallet_id,
            Transaction.amount > 0
        ).scalar() or 0

        total_outgoing = abs(db.session.query(
            func.sum(Transaction.amount)
        ).filter(
            Transaction.wallet_id == wallet_id,
            Transaction.amount < 0
        ).scalar() or 0)

        # Get reward statistics
        rewards = db.session.query(
            Transaction.metadata['reward_type'].label('reward_type'),
            func.count().label('count'),
            func.sum(Transaction.amount).label('total_amount')
        ).filter(
            Transaction.wallet_id == wallet_id,
            Transaction.transaction_type == TransactionType.REWARD.value
        ).group_by('reward_type').all()

        rewards_dict = {
            reward.reward_type: {
                'count': reward.count,
                'total_amount': float(reward.total_amount)
            } for reward in rewards
        }

        return {
            'total_transactions': total_transactions,
            'total_volume': float(total_volume),
            'total_incoming': float(total_incoming),
            'total_outgoing': float(total_outgoing),
            'rewards': rewards_dict
        }

    def _submit_to_blockchain(self, transaction: Transaction) -> None:
        """Submit a transaction to the blockchain.
        
        Args:
            transaction: The transaction to submit.
            
        Raises:
            BlockchainError: If the blockchain submission fails.
        """
        # TODO: Implement blockchain integration based on provider
        if self._blockchain_provider == "solana":
            # Implement Solana blockchain submission
            pass
        elif self._blockchain_provider == "ethereum":
            # Implement Ethereum blockchain submission
            pass
        else:
            raise BlockchainError(f"Unsupported blockchain provider: {self._blockchain_provider}") 