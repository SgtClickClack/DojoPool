"""
Hardware wallet support for blockchain operations.
"""
from typing import Dict, Any, Optional, List, Tuple, Union
from abc import ABC, abstractmethod
from decimal import Decimal
import asyncio
from eth_account.messages import encode_defunct
from trezorlib.client import TrezorClient
from trezorlib.transport import get_transport
from trezorlib.tools import parse_path
from trezorlib import ethereum, bitcoin
from ledgerblue.comm import getDongle
from ledgerblue.commException import CommException
from dojopool.core.exceptions import BlockchainError

class HardwareWallet(ABC):
    """Abstract base class for hardware wallet implementations."""
    
    @abstractmethod
    def get_addresses(self, start_index: int = 0, count: int = 1) -> List[str]:
        """Get a list of addresses from the hardware wallet."""
        pass
        
    @abstractmethod
    def sign_transaction(self, transaction: Dict[str, Any]) -> str:
        """Sign a transaction using the hardware wallet."""
        pass
        
    @abstractmethod
    def sign_message(self, message: str) -> str:
        """Sign a message using the hardware wallet."""
        pass

class LedgerWallet(HardwareWallet):
    """Implementation for Ledger hardware wallet."""
    
    def __init__(self):
        """Initialize Ledger connection."""
        try:
            self.dongle = getDongle(True)
        except CommException as e:
            raise BlockchainError(f"Failed to connect to Ledger device: {str(e)}")
            
    def get_addresses(self, start_index: int = 0, count: int = 1) -> List[str]:
        """Get addresses from Ledger wallet."""
        try:
            addresses = []
            for i in range(start_index, start_index + count):
                # Format BIP32 path
                path = f"44'/60'/{i}'/0/0"
                result = self.dongle.exchange(bytes.fromhex("e0020100"))
                addresses.append(result.hex())
            return addresses
        except CommException as e:
            raise BlockchainError(f"Failed to get addresses from Ledger: {str(e)}")
            
    def sign_transaction(self, transaction: Dict[str, Any]) -> str:
        """Sign transaction with Ledger wallet."""
        try:
            # Serialize and sign transaction
            serialized_tx = self._serialize_transaction(transaction)
            signature = self.dongle.exchange(
                bytes.fromhex("e0080000") + len(serialized_tx).to_bytes(1, 'big') + serialized_tx
            )
            return signature.hex()
        except CommException as e:
            raise BlockchainError(f"Failed to sign transaction with Ledger: {str(e)}")
            
    def sign_message(self, message: str) -> str:
        """Sign message with Ledger wallet."""
        try:
            encoded_msg = encode_defunct(text=message)
            signature = self.dongle.exchange(
                bytes.fromhex("e0080000") + len(encoded_msg).to_bytes(1, 'big') + encoded_msg
            )
            return signature.hex()
        except CommException as e:
            raise BlockchainError(f"Failed to sign message with Ledger: {str(e)}")
            
    def _serialize_transaction(self, transaction: Dict[str, Any]) -> bytes:
        """Helper method to serialize transaction data."""
        # Implementation depends on specific transaction format
        return bytes()

class TrezorWallet(HardwareWallet):
    """Implementation for Trezor hardware wallet."""
    
    def __init__(self):
        """Initialize Trezor connection."""
        try:
            transport = get_transport()
            self.client = TrezorClient(transport)
        except Exception as e:
            raise BlockchainError(f"Failed to connect to Trezor device: {str(e)}")
            
    def get_addresses(self, start_index: int = 0, count: int = 1) -> List[str]:
        """Get addresses from Trezor wallet."""
        try:
            addresses = []
            for i in range(start_index, start_index + count):
                path = f"m/44'/60'/{i}'/0/0"
                address = self.client.get_address('Ethereum', path)
                addresses.append(address)
            return addresses
        except Exception as e:
            raise BlockchainError(f"Failed to get addresses from Trezor: {str(e)}")
            
    def sign_transaction(self, transaction: Dict[str, Any]) -> str:
        """Sign transaction with Trezor wallet."""
        try:
            # Sign transaction using Trezor
            signature = self.client.ethereum_sign_tx(
                address_n=self._get_address_path(),
                **transaction
            )
            return signature.hex()
        except Exception as e:
            raise BlockchainError(f"Failed to sign transaction with Trezor: {str(e)}")
            
    def sign_message(self, message: str) -> str:
        """Sign message with Trezor wallet."""
        try:
            signature = self.client.ethereum_sign_message(
                address_n=self._get_address_path(),
                message=message
            )
            return signature.hex()
        except Exception as e:
            raise BlockchainError(f"Failed to sign message with Trezor: {str(e)}")
            
    def _get_address_path(self) -> List[int]:
        """Helper method to get default address path."""
        return [44 | 0x80000000, 60 | 0x80000000, 0 | 0x80000000, 0, 0]

class HardwareWalletManager:
    """Manager class for hardware wallet operations."""
    
    def __init__(self):
        """Initialize hardware wallet manager."""
        self._ledger: Optional[LedgerWallet] = None
        self._trezor: Optional[TrezorWallet] = None
        
    def get_ledger(self) -> LedgerWallet:
        """Get or create Ledger wallet instance."""
        if not self._ledger:
            self._ledger = LedgerWallet()
        return self._ledger
        
    def get_trezor(self) -> TrezorWallet:
        """Get or create Trezor wallet instance."""
        if not self._trezor:
            self._trezor = TrezorWallet()
        return self._trezor
        
    def close_all(self):
        """Close all hardware wallet connections."""
        if self._trezor:
            self._trezor = None
            
        if self._ledger:
            self._ledger = None 