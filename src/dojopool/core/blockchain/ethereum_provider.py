"""
Ethereum blockchain provider implementation.
"""
from typing import Dict, Optional, List, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from web3 import Web3
from web3.exceptions import TransactionNotFound, InvalidAddress, TimeExhausted
from eth_account import Account
from dojopool.models.marketplace import Transaction
from dojopool.core.blockchain.base_provider import BlockchainProvider
from dojopool.core.blockchain.utils import with_retry, validate_address
from dojopool.core.exceptions import BlockchainError

@dataclass
class EthereumTransaction(Transaction):
    """Represents a transaction on Ethereum blockchain."""
    gas_price: int
    gas_used: int
    nonce: int
    block_number: int
    block_hash: str

class EthereumProvider(BlockchainProvider):
    """Ethereum blockchain provider implementation."""
    
    def __init__(self, network: str = "mainnet"):
        """Initialize provider with network.
        
        Args:
            network: Network to connect to (mainnet, testnet, etc)
        """
        self.network = network
        if network == "mainnet":
            self.endpoint = "https://mainnet.infura.io/v3/YOUR-PROJECT-ID"
        elif network == "goerli":
            self.endpoint = "https://goerli.infura.io/v3/YOUR-PROJECT-ID"
        else:
            raise ValueError(f"Unsupported network: {network}")
            
        self.web3 = Web3(Web3.HTTPProvider(self.endpoint))
        if not self.web3.is_connected():
            raise BlockchainError(f"Failed to connect to Ethereum {network} network")
        
    @with_retry(max_attempts=3, exceptions=(TransactionNotFound, TimeExhausted))
    async def create_wallet(self) -> Tuple[str, str]:
        """Create new Ethereum wallet.
        
        Returns:
            Tuple of (address, private key)
        """
        try:
            account = Account.create()
            return account.address, account.privateKey.hex()
        except Exception as e:
            raise BlockchainError(f"Failed to create wallet: {str(e)}")

    @with_retry(max_attempts=3, exceptions=(TransactionNotFound, TimeExhausted))
    async def get_balance(self, address: str) -> Decimal:
        """Get ETH balance for address.
        
        Args:
            address: Ethereum address
            
        Returns:
            ETH balance as Decimal
        """
        if not validate_address(address, 'ethereum'):
            raise ValueError("Invalid Ethereum address")
            
        try:
            balance = self.web3.eth.get_balance(address)
            return Decimal(self.web3.from_wei(balance, 'ether'))
        except Exception as e:
            raise BlockchainError(f"Failed to get balance: {str(e)}")

    @with_retry(max_attempts=3, exceptions=(TransactionNotFound, TimeExhausted))
    async def transfer(
        self,
        from_address: str,
        to_address: str, 
        amount: Decimal,
        private_key: str
    ) -> str:
        """Transfer ETH between addresses.
        
        Args:
            from_address: Sender address
            to_address: Recipient address
            amount: Amount in ETH
            private_key: Sender's private key
            
        Returns:
            Transaction hash
        """
        if not validate_address(from_address, 'ethereum'):
            raise ValueError("Invalid sender address")
        if not validate_address(to_address, 'ethereum'):
            raise ValueError("Invalid recipient address")
            
        try:
            # Convert ETH amount to Wei
            amount_wei = self.web3.to_wei(amount, 'ether')
            
            # Get the current gas price with a small buffer
            gas_price = int(self.web3.eth.gas_price * 1.1)
            
            # Estimate gas (with buffer)
            estimated_gas = int(self.web3.eth.estimate_gas({
                'from': from_address,
                'to': to_address,
                'value': amount_wei
            }) * 1.2)
            
            # Build transaction
            tx = {
                'nonce': self.web3.eth.get_transaction_count(from_address),
                'to': to_address,
                'value': amount_wei,
                'gas': estimated_gas,
                'gasPrice': gas_price,
                'chainId': self.web3.eth.chain_id
            }
            
            # Sign and send transaction
            signed = self.web3.eth.account.sign_transaction(tx, private_key)
            tx_hash = self.web3.eth.send_raw_transaction(signed.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.web3.eth.wait_for_transaction_receipt(
                tx_hash,
                timeout=120,
                poll_latency=0.1
            )
            
            if receipt['status'] == 0:
                raise BlockchainError("Transaction failed")
                
            return tx_hash.hex()
            
        except Exception as e:
            raise BlockchainError(f"Transfer failed: {str(e)}")

    @with_retry(max_attempts=3, exceptions=(TransactionNotFound, TimeExhausted))
    async def get_transaction(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Get transaction details.
        
        Args:
            tx_hash: Transaction hash
            
        Returns:
            Transaction details or None
        """
        try:
            tx = self.web3.eth.get_transaction(tx_hash)
            receipt = self.web3.eth.get_transaction_receipt(tx_hash)
            
            if not tx or not receipt:
                return None
                
            return {
                'hash': tx['hash'].hex(),
                'from': tx['from'],
                'to': tx['to'],
                'value': Decimal(self.web3.from_wei(tx['value'], 'ether')),
                'gas_price': tx['gasPrice'],
                'gas_used': receipt['gasUsed'],
                'status': 'success' if receipt['status'] == 1 else 'failed',
                'block_number': receipt['blockNumber'],
                'block_hash': receipt['blockHash'].hex(),
                'timestamp': self.web3.eth.get_block(receipt['blockNumber'])['timestamp']
            }
        except Exception as e:
            raise BlockchainError(f"Failed to get transaction: {str(e)}")

    @with_retry(max_attempts=3, exceptions=(TransactionNotFound, TimeExhausted))
    async def get_transactions(
        self,
        address: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent transactions for address.
        
        Args:
            address: Ethereum address
            limit: Maximum transactions to return
            
        Returns:
            List of transactions
        """
        if not validate_address(address, 'ethereum'):
            raise ValueError("Invalid Ethereum address")
            
        try:
            latest_block = self.web3.eth.block_number
            transactions = []
            
            # Scan the last 10000 blocks or until we find enough transactions
            for block_number in range(latest_block, max(latest_block - 10000, 0), -1):
                block = self.web3.eth.get_block(block_number, full_transactions=True)
                
                for tx in block.transactions:
                    if tx['from'].lower() == address.lower() or tx['to'].lower() == address.lower():
                        tx_details = await self.get_transaction(tx['hash'].hex())
                        if tx_details:
                            transactions.append(tx_details)
                            if len(transactions) >= limit:
                                return transactions
                                
            return transactions
            
        except Exception as e:
            raise BlockchainError(f"Failed to get transactions: {str(e)}")

    @with_retry(max_attempts=3, exceptions=(TransactionNotFound, TimeExhausted))
    async def get_network_info(self) -> Dict[str, Any]:
        """Get Ethereum network info.
        
        Returns:
            Network details
        """
        try:
            return {
                'network': self.network,
                'chain_id': self.web3.eth.chain_id,
                'gas_price': Decimal(self.web3.from_wei(self.web3.eth.gas_price, 'gwei')),
                'latest_block': self.web3.eth.block_number,
                'is_connected': self.web3.is_connected(),
                'sync_status': self.web3.eth.syncing
            }
        except Exception as e:
            raise BlockchainError(f"Failed to get network info: {str(e)}")

    def get_recent_transactions(self, address: str, limit: int = 10) -> List[EthereumTransaction]:
        """Get recent transactions for an address."""
        try:
            if not self.web3.is_address(address):
                raise ValueError("Invalid Ethereum address")

            latest_block = self.web3.eth.block_number
            transactions = []
            
            # Scan the last 10000 blocks or until we find enough transactions
            for block_number in range(latest_block, max(latest_block - 10000, 0), -1):
                block = self.web3.eth.get_block(block_number, full_transactions=True)
                
                for tx in block.transactions:
                    if tx['from'].lower() == address.lower() or tx['to'].lower() == address.lower():
                        transaction = self.get_transaction(tx['hash'].hex())
                        if transaction:
                            transactions.append(transaction)
                            if len(transactions) >= limit:
                                return transactions

            return transactions
        except Exception as e:
            raise BlockchainError(f"Failed to get recent transactions: {str(e)}") 