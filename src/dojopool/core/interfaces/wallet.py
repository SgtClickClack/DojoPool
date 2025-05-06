"""
Wallet Service Interface

This module defines the interface for wallet-related operations across the platform.
All wallet implementations should conform to this interface.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, List, Dict, Any
from decimal import Decimal

from dojopool.models.marketplace import Wallet, Transaction
from dojopool.core.types.wallet_types import TransactionType, RewardType


class IWalletService(ABC):
    """Interface for wallet services."""

    @abstractmethod
    def create_wallet(self, user_id: int) -> Wallet:
        """Create a new wallet for a user.
        
        Args:
            user_id: The ID of the user.
            
        Returns:
            The created wallet.
            
        Raises:
            WalletError: If the user already has a wallet.
        """
        pass

    @abstractmethod
    def get_wallet(self, wallet_id: int) -> Optional[Wallet]:
        """Get a wallet by ID.
        
        Args:
            wallet_id: The ID of the wallet.
            
        Returns:
            The wallet if found, None otherwise.
        """
        pass

    @abstractmethod
    def get_user_wallet(self, user_id: int) -> Optional[Wallet]:
        """Get a user's wallet.
        
        Args:
            user_id: The ID of the user.
            
        Returns:
            The user's wallet if found, None otherwise.
        """
        pass

    @abstractmethod
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
        pass

    @abstractmethod
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
            The created transaction.
            
        Raises:
            WalletError: If either wallet is not found.
            InsufficientFundsError: If the sender has insufficient funds.
        """
        pass

    @abstractmethod
    def get_transaction_history(
        self,
        wallet_id: int,
        transaction_type: Optional[TransactionType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Transaction]:
        """Get transaction history for a wallet.
        
        Args:
            wallet_id: The ID of the wallet.
            transaction_type: Optional filter by transaction type.
            start_date: Optional start date filter.
            end_date: Optional end date filter.
            limit: Maximum number of transactions to return.
            
        Returns:
            List of transactions.
        """
        pass

    @abstractmethod
    def get_wallet_stats(self, wallet_id: int) -> Dict[str, Any]:
        """Get statistics for a wallet.
        
        Args:
            wallet_id: The ID of the wallet.
            
        Returns:
            Dictionary containing wallet statistics.
        """
        pass 