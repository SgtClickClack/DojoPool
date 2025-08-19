"""
Abstract base class for blockchain providers.
Defines the interface that all blockchain providers must implement.
"""
from abc import ABC, abstractmethod
from typing import Dict, Optional, List, Any
from decimal import Decimal

class BlockchainProvider(ABC):
    """Abstract base class for blockchain providers."""
    
    @abstractmethod
    async def create_wallet(self) -> Dict[str, str]:
        """Create a new wallet.
        
        Returns:
            Dict containing public key and private key
        """
        pass
        
    @abstractmethod
    async def get_balance(self, address: str) -> Decimal:
        """Get token balance for address.
        
        Args:
            address: Wallet address
            
        Returns:
            Token balance as Decimal
        """
        pass
        
    @abstractmethod
    async def transfer(
        self,
        from_address: str,
        to_address: str,
        amount: Decimal,
        private_key: str
    ) -> str:
        """Transfer tokens between addresses.
        
        Args:
            from_address: Sender's wallet address
            to_address: Recipient's wallet address
            amount: Amount to transfer
            private_key: Sender's private key
            
        Returns:
            Transaction signature/hash
        """
        pass
        
    @abstractmethod
    async def get_transaction(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Get transaction details by hash/signature.
        
        Args:
            tx_hash: Transaction hash/signature
            
        Returns:
            Transaction details or None if not found
        """
        pass
        
    @abstractmethod
    async def get_transactions(
        self,
        address: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent transactions for address.
        
        Args:
            address: Wallet address
            limit: Maximum number of transactions to return
            
        Returns:
            List of transactions
        """
        pass
        
    @abstractmethod
    def get_network_info(self) -> Dict[str, Any]:
        """Get current network information.
        
        Returns:
            Dict containing network details
        """
        pass 