"""
Batch transaction handler for blockchain operations.
"""
from typing import List, Dict, Any, Optional
from decimal import Decimal
from abc import ABC, abstractmethod
from web3 import Web3
from solana.transaction import Transaction as SolanaTransaction
from dojopool.core.exceptions import BlockchainError
from dojopool.core.blockchain.utils import validate_address

class BatchTransactionHandler(ABC):
    """Abstract base class for batch transaction handlers."""
    
    @abstractmethod
    async def prepare_batch(self, transactions: List[Dict[str, Any]]) -> Any:
        """Prepare batch transaction."""
        pass
        
    @abstractmethod
    async def execute_batch(self, batch: Any, private_key: str) -> str:
        """Execute batch transaction."""
        pass
        
    @abstractmethod
    async def get_batch_status(self, tx_hash: str) -> Dict[str, Any]:
        """Get batch transaction status."""
        pass

class EthereumBatchHandler(BatchTransactionHandler):
    """Ethereum batch transaction handler."""
    
    def __init__(self, web3: Web3):
        """Initialize with Web3 instance."""
        self.web3 = web3
        
    async def prepare_batch(
        self,
        transactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Prepare Ethereum batch transaction.
        
        Args:
            transactions: List of transaction details
            
        Returns:
            Prepared batch transaction
        """
        if not transactions:
            raise ValueError("No transactions provided")
            
        # Validate all transactions
        total_value = Decimal(0)
        for tx in transactions:
            if not validate_address(tx['to'], 'ethereum'):
                raise ValueError(f"Invalid recipient address: {tx['to']}")
            if 'value' not in tx:
                raise ValueError("Transaction missing value")
            total_value += Decimal(tx['value'])
            
        # Get gas price with buffer
        gas_price = int(self.web3.eth.gas_price * 1.1)
        
        # Estimate total gas (21000 per transfer)
        estimated_gas = 21000 * len(transactions)
        
        return {
            'transactions': transactions,
            'total_value': total_value,
            'gas_price': gas_price,
            'estimated_gas': estimated_gas
        }
        
    async def execute_batch(
        self,
        batch: Dict[str, Any],
        private_key: str
    ) -> str:
        """Execute Ethereum batch transaction.
        
        Args:
            batch: Prepared batch transaction
            private_key: Sender's private key
            
        Returns:
            Transaction hash
        """
        try:
            from_address = self.web3.eth.account.from_key(private_key).address
            
            # Build multicall transaction
            multicall_abi = [
                {
                    "inputs": [
                        {
                            "components": [
                                {"name": "target", "type": "address"},
                                {"name": "value", "type": "uint256"},
                                {"name": "data", "type": "bytes"}
                            ],
                            "name": "calls",
                            "type": "tuple[]"
                        }
                    ],
                    "name": "aggregate",
                    "outputs": [
                        {"name": "blockNumber", "type": "uint256"},
                        {"name": "returnData", "type": "bytes[]"}
                    ],
                    "stateMutability": "payable",
                    "type": "function"
                }
            ]
            
            # Prepare calls
            calls = []
            for tx in batch['transactions']:
                calls.append({
                    'target': tx['to'],
                    'value': self.web3.to_wei(tx['value'], 'ether'),
                    'data': b''  # Empty data for simple transfers
                })
            
            # Build transaction
            tx = {
                'from': from_address,
                'to': batch['multicall_address'],  # Multicall contract address
                'value': self.web3.to_wei(batch['total_value'], 'ether'),
                'gas': batch['estimated_gas'],
                'gasPrice': batch['gas_price'],
                'nonce': self.web3.eth.get_transaction_count(from_address),
                'data': self.web3.eth.contract(
                    abi=multicall_abi
                ).encodeABI('aggregate', [calls])
            }
            
            # Sign and send
            signed = self.web3.eth.account.sign_transaction(tx, private_key)
            tx_hash = self.web3.eth.send_raw_transaction(signed.rawTransaction)
            
            # Wait for receipt
            receipt = self.web3.eth.wait_for_transaction_receipt(
                tx_hash,
                timeout=120
            )
            
            if receipt['status'] == 0:
                raise BlockchainError("Batch transaction failed")
                
            return tx_hash.hex()
            
        except Exception as e:
            raise BlockchainError(f"Failed to execute batch: {str(e)}")
            
    async def get_batch_status(self, tx_hash: str) -> Dict[str, Any]:
        """Get Ethereum batch transaction status.
        
        Args:
            tx_hash: Transaction hash
            
        Returns:
            Transaction status
        """
        try:
            receipt = self.web3.eth.get_transaction_receipt(tx_hash)
            return {
                'status': 'success' if receipt['status'] == 1 else 'failed',
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'events': receipt['logs']
            }
        except Exception as e:
            raise BlockchainError(f"Failed to get batch status: {str(e)}")

class SolanaBatchHandler(BatchTransactionHandler):
    """Solana batch transaction handler."""
    
    def __init__(self, client):
        """Initialize with Solana client."""
        self.client = client
        
    async def prepare_batch(
        self,
        transactions: List[Dict[str, Any]]
    ) -> SolanaTransaction:
        """Prepare Solana batch transaction.
        
        Args:
            transactions: List of transaction details
            
        Returns:
            Prepared Solana transaction
        """
        if not transactions:
            raise ValueError("No transactions provided")
            
        # Create new transaction
        batch_tx = SolanaTransaction()
        
        # Add all transfer instructions
        for tx in transactions:
            if not validate_address(tx['to'], 'solana'):
                raise ValueError(f"Invalid recipient address: {tx['to']}")
                
            # Convert SOL to lamports
            lamports = int(Decimal(tx['value']) * Decimal(1e9))
            
            # Create transfer instruction
            transfer_ix = self.client.transfer(
                from_pubkey=tx['from'],
                to_pubkey=tx['to'],
                lamports=lamports
            )
            
            # Add to transaction
            batch_tx.add(transfer_ix)
            
        return batch_tx
        
    async def execute_batch(
        self,
        batch: SolanaTransaction,
        private_key: str
    ) -> str:
        """Execute Solana batch transaction.
        
        Args:
            batch: Prepared Solana transaction
            private_key: Sender's private key
            
        Returns:
            Transaction signature
        """
        try:
            # Send transaction
            result = self.client.send_transaction(
                batch,
                private_key,
                opts={
                    "skip_confirmation": False,
                    "preflight_commitment": "confirmed",
                    "max_retries": 3
                }
            )
            
            if 'error' in result:
                raise BlockchainError(f"Batch transaction failed: {result['error']}")
                
            return result['result']
            
        except Exception as e:
            raise BlockchainError(f"Failed to execute batch: {str(e)}")
            
    async def get_batch_status(self, signature: str) -> Dict[str, Any]:
        """Get Solana batch transaction status.
        
        Args:
            signature: Transaction signature
            
        Returns:
            Transaction status
        """
        try:
            response = self.client.get_transaction(
                signature,
                commitment="confirmed"
            )
            
            if 'error' in response:
                raise BlockchainError(f"Failed to get status: {response['error']}")
                
            tx = response['result']
            return {
                'status': 'success' if tx['meta']['err'] is None else 'failed',
                'slot': tx['slot'],
                'confirmations': tx.get('confirmations', 0),
                'fee': tx['meta']['fee']
            }
            
        except Exception as e:
            raise BlockchainError(f"Failed to get batch status: {str(e)}") 