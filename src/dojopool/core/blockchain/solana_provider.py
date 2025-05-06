"""
Solana blockchain provider implementation.
"""
from typing import Dict, Optional, List, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from solana.rpc.api import Client
from solana.keypair import Keypair
from solana.transaction import Transaction
from solana.system_program import transfer
from solana.rpc.commitment import Confirmed
from dojopool.models.marketplace import Transaction as MarketplaceTransaction
from dojopool.core.blockchain.base_provider import BlockchainProvider
from dojopool.core.blockchain.utils import with_retry, validate_address
from dojopool.core.exceptions import BlockchainError

@dataclass
class SolanaTransactionInfo:
    """Represents a transaction on Solana blockchain."""
    signature: str
    timestamp: datetime
    status: str
    amount: Decimal
    sender: str
    recipient: str
    fee: Decimal
    block_number: int

class SolanaProvider(BlockchainProvider):
    """Solana blockchain provider implementation."""
    
    def __init__(self, network: str = "mainnet"):
        """Initialize provider with network.
        
        Args:
            network: Network to connect to (mainnet, devnet, testnet)
        """
        self.network = network
        if network == "mainnet":
            self.endpoint = "https://api.mainnet-beta.solana.com"
        elif network == "devnet":
            self.endpoint = "https://api.devnet.solana.com"
        elif network == "testnet":
            self.endpoint = "https://api.testnet.solana.com"
        else:
            raise ValueError(f"Unsupported network: {network}")
            
        self.client = Client(self.endpoint)
        
        # Test connection
        try:
            self.client.get_version()
        except Exception as e:
            raise BlockchainError(f"Failed to connect to Solana {network} network: {str(e)}")
        
    @with_retry(max_attempts=3)
    async def create_wallet(self) -> Tuple[str, str]:
        """Create new Solana wallet.
        
        Returns:
            Tuple of (address, private key)
        """
        try:
            keypair = Keypair()
            return str(keypair.public_key), keypair.secret_key.hex()
        except Exception as e:
            raise BlockchainError(f"Failed to create wallet: {str(e)}")

    @with_retry(max_attempts=3)
    async def get_balance(self, address: str) -> Decimal:
        """Get SOL balance for address.
        
        Args:
            address: Solana address
            
        Returns:
            SOL balance as Decimal
        """
        if not validate_address(address, 'solana'):
            raise ValueError("Invalid Solana address")
            
        try:
            response = self.client.get_balance(address)
            if 'error' in response:
                raise BlockchainError(f"Failed to get balance: {response['error']}")
                
            lamports = response['result']['value']
            return Decimal(lamports) / Decimal(1e9)  # Convert lamports to SOL
        except Exception as e:
            raise BlockchainError(f"Failed to get balance: {str(e)}")

    @with_retry(max_attempts=3)
    async def transfer(
        self,
        from_address: str,
        to_address: str,
        amount: Decimal,
        private_key: str
    ) -> str:
        """Transfer SOL between addresses.
        
        Args:
            from_address: Sender address
            to_address: Recipient address 
            amount: Amount in SOL
            private_key: Sender's private key
            
        Returns:
            Transaction signature
        """
        if not validate_address(from_address, 'solana'):
            raise ValueError("Invalid sender address")
        if not validate_address(to_address, 'solana'):
            raise ValueError("Invalid recipient address")
            
        try:
            # Convert SOL to lamports
            lamports = int(amount * Decimal(1e9))
            
            # Create transfer instruction
            transfer_ix = transfer(
                from_pubkey=from_address,
                to_pubkey=to_address,
                lamports=lamports
            )
            
            # Build transaction
            transaction = Transaction()
            transaction.add(transfer_ix)
            
            # Send transaction with confirmation
            result = self.client.send_transaction(
                transaction,
                private_key,
                opts={
                    "skip_confirmation": False,
                    "preflight_commitment": Confirmed,
                    "max_retries": 3
                }
            )
            
            if 'error' in result:
                raise BlockchainError(f"Transaction failed: {result['error']}")
                
            return result['result']
            
        except Exception as e:
            raise BlockchainError(f"Transfer failed: {str(e)}")

    @with_retry(max_attempts=3)
    async def get_transaction(self, signature: str) -> Optional[Dict[str, Any]]:
        """Get transaction details.
        
        Args:
            signature: Transaction signature
            
        Returns:
            Transaction details or None
        """
        try:
            response = self.client.get_transaction(
                signature,
                commitment=Confirmed
            )
            
            if 'error' in response:
                raise BlockchainError(f"Failed to get transaction: {response['error']}")
                
            if not response['result']:
                return None
                
            tx = response['result']
            
            # Extract fee from transaction metadata
            fee = Decimal(tx['meta']['fee']) / Decimal(1e9) if 'meta' in tx else Decimal(0)
            
            return {
                'signature': signature,
                'from': tx['transaction']['message']['accountKeys'][0],
                'to': tx['transaction']['message']['accountKeys'][1],
                'amount': Decimal(tx['meta']['postBalances'][1] - tx['meta']['preBalances'][1]) / Decimal(1e9),
                'fee': fee,
                'status': 'success' if tx['meta']['err'] is None else 'failed',
                'block_time': datetime.fromtimestamp(tx['blockTime']) if 'blockTime' in tx else None,
                'block_number': tx.get('slot'),
                'confirmations': tx.get('confirmations', 0)
            }
        except Exception as e:
            raise BlockchainError(f"Failed to get transaction: {str(e)}")

    @with_retry(max_attempts=3)
    async def get_transactions(
        self, 
        address: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent transactions for address.
        
        Args:
            address: Solana address
            limit: Maximum transactions to return
            
        Returns:
            List of transactions
        """
        if not validate_address(address, 'solana'):
            raise ValueError("Invalid Solana address")
            
        try:
            response = self.client.get_signatures_for_address(
                address,
                limit=limit,
                commitment=Confirmed
            )
            
            if 'error' in response:
                raise BlockchainError(f"Failed to get transactions: {response['error']}")
            
            txs = []
            for item in response['result']:
                tx = await self.get_transaction(item['signature'])
                if tx:
                    txs.append(tx)
            return txs
            
        except Exception as e:
            raise BlockchainError(f"Failed to get transactions: {str(e)}")

    @with_retry(max_attempts=3)
    async def get_network_info(self) -> Dict[str, Any]:
        """Get Solana network info.
        
        Returns:
            Network details
        """
        try:
            version = self.client.get_version()
            if 'error' in version:
                raise BlockchainError(f"Failed to get version: {version['error']}")
                
            slot = self.client.get_slot()
            if 'error' in slot:
                raise BlockchainError(f"Failed to get slot: {slot['error']}")
                
            return {
                'network': self.network,
                'endpoint': self.endpoint,
                'slot': slot['result'],
                'version': version['result']['solana-core'],
                'feature_set': version['result'].get('feature-set'),
                'cluster_nodes': len(self.client.get_cluster_nodes()['result'])
            }
        except Exception as e:
            raise BlockchainError(f"Failed to get network info: {str(e)}") 