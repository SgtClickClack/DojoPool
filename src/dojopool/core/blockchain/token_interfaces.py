"""
Interfaces for token contracts (ERC20 and SPL).
"""
from typing import Dict, Optional, List, Any
from decimal import Decimal
from abc import ABC, abstractmethod

class TokenInterface(ABC):
    """Abstract base class for token interfaces."""
    
    @abstractmethod
    async def get_balance(self, address: str) -> Decimal:
        """Get token balance for address."""
        pass
        
    @abstractmethod
    async def get_allowance(self, owner: str, spender: str) -> Decimal:
        """Get token allowance."""
        pass
        
    @abstractmethod
    async def approve(self, spender: str, amount: Decimal, private_key: str) -> str:
        """Approve token spending."""
        pass
        
    @abstractmethod
    async def transfer(
        self,
        from_address: str,
        to_address: str,
        amount: Decimal,
        private_key: str
    ) -> str:
        """Transfer tokens."""
        pass
        
    @abstractmethod
    async def get_metadata(self) -> Dict[str, Any]:
        """Get token metadata."""
        pass

class ERC20Token(TokenInterface):
    """ERC20 token interface."""
    
    def __init__(self, web3, contract_address: str):
        """Initialize with Web3 instance and contract address."""
        self.web3 = web3
        self.contract_address = contract_address
        
        # ERC20 ABI - minimal interface
        self.abi = [
            # Read-only functions
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "name",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [
                    {"name": "_owner", "type": "address"},
                    {"name": "_spender", "type": "address"}
                ],
                "name": "allowance",
                "outputs": [{"name": "", "type": "uint256"}],
                "type": "function"
            },
            # State-changing functions
            {
                "constant": False,
                "inputs": [
                    {"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": False,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            }
        ]
        
        self.contract = self.web3.eth.contract(
            address=self.contract_address,
            abi=self.abi
        )
        
    async def get_balance(self, address: str) -> Decimal:
        """Get token balance for address."""
        balance = self.contract.functions.balanceOf(address).call()
        decimals = self.contract.functions.decimals().call()
        return Decimal(balance) / Decimal(10 ** decimals)
        
    async def get_allowance(self, owner: str, spender: str) -> Decimal:
        """Get token allowance."""
        allowance = self.contract.functions.allowance(owner, spender).call()
        decimals = self.contract.functions.decimals().call()
        return Decimal(allowance) / Decimal(10 ** decimals)
        
    async def approve(self, spender: str, amount: Decimal, private_key: str) -> str:
        """Approve token spending."""
        decimals = self.contract.functions.decimals().call()
        amount_raw = int(amount * Decimal(10 ** decimals))
        
        # Build transaction
        tx = self.contract.functions.approve(
            spender,
            amount_raw
        ).build_transaction({
            'from': self.web3.eth.account.from_key(private_key).address,
            'nonce': self.web3.eth.get_transaction_count(
                self.web3.eth.account.from_key(private_key).address
            )
        })
        
        # Sign and send
        signed = self.web3.eth.account.sign_transaction(tx, private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed.rawTransaction)
        return tx_hash.hex()
        
    async def transfer(
        self,
        from_address: str,
        to_address: str,
        amount: Decimal,
        private_key: str
    ) -> str:
        """Transfer tokens."""
        decimals = self.contract.functions.decimals().call()
        amount_raw = int(amount * Decimal(10 ** decimals))
        
        # Build transaction
        tx = self.contract.functions.transfer(
            to_address,
            amount_raw
        ).build_transaction({
            'from': from_address,
            'nonce': self.web3.eth.get_transaction_count(from_address)
        })
        
        # Sign and send
        signed = self.web3.eth.account.sign_transaction(tx, private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed.rawTransaction)
        return tx_hash.hex()
        
    async def get_metadata(self) -> Dict[str, Any]:
        """Get token metadata."""
        return {
            'name': self.contract.functions.name().call(),
            'symbol': self.contract.functions.symbol().call(),
            'decimals': self.contract.functions.decimals().call(),
            'contract_address': self.contract_address
        }

class SPLToken(TokenInterface):
    """SPL token interface."""
    
    def __init__(self, client, mint_address: str):
        """Initialize with Solana client and mint address."""
        self.client = client
        self.mint_address = mint_address
        
    async def get_balance(self, address: str) -> Decimal:
        """Get token balance for address."""
        try:
            response = self.client.get_token_account_balance(address)
            if 'error' in response:
                raise ValueError(f"Failed to get balance: {response['error']}")
                
            amount = response['result']['value']['amount']
            decimals = response['result']['value']['decimals']
            return Decimal(amount) / Decimal(10 ** decimals)
        except Exception as e:
            raise ValueError(f"Failed to get balance: {str(e)}")
            
    async def get_allowance(self, owner: str, spender: str) -> Decimal:
        """Get token allowance.
        Note: SPL tokens use different permission model than ERC20
        """
        # SPL tokens use different permission model
        # This is a placeholder that always returns max value
        return Decimal('115792089237316195423570985008687907853269984665640564039457584007913129639935')
        
    async def approve(self, spender: str, amount: Decimal, private_key: str) -> str:
        """Approve token spending.
        Note: SPL tokens use different permission model than ERC20
        """
        raise NotImplementedError(
            "SPL tokens use a different permission model. "
            "Use transfer() directly."
        )
        
    async def transfer(
        self,
        from_address: str,
        to_address: str,
        amount: Decimal,
        private_key: str
    ) -> str:
        """Transfer tokens."""
        try:
            # Get source token account
            source_account = self.client.get_token_accounts_by_owner(
                from_address,
                {'mint': self.mint_address}
            )['result']['value'][0]['pubkey']
            
            # Get or create destination token account
            dest_accounts = self.client.get_token_accounts_by_owner(
                to_address,
                {'mint': self.mint_address}
            )['result']['value']
            
            if not dest_accounts:
                # Create associated token account for recipient
                create_account_ix = self.client.create_associated_token_account(
                    payer=from_address,
                    owner=to_address,
                    mint=self.mint_address
                )
                dest_account = create_account_ix['result']
            else:
                dest_account = dest_accounts[0]['pubkey']
            
            # Get token decimals
            mint_info = self.client.get_token_supply(self.mint_address)
            decimals = mint_info['result']['value']['decimals']
            amount_raw = int(amount * Decimal(10 ** decimals))
            
            # Build and send transaction
            result = self.client.transfer_tokens(
                source=source_account,
                destination=dest_account,
                owner=from_address,
                amount=amount_raw,
                private_key=private_key
            )
            
            if 'error' in result:
                raise ValueError(f"Transfer failed: {result['error']}")
                
            return result['result']
            
        except Exception as e:
            raise ValueError(f"Transfer failed: {str(e)}")
            
    async def get_metadata(self) -> Dict[str, Any]:
        """Get token metadata."""
        try:
            # Get mint info
            mint_info = self.client.get_token_supply(self.mint_address)
            if 'error' in mint_info:
                raise ValueError(f"Failed to get mint info: {mint_info['error']}")
                
            # Get metadata from token metadata program
            metadata = self.client.get_token_metadata(self.mint_address)
            
            return {
                'name': metadata.get('name', 'Unknown'),
                'symbol': metadata.get('symbol', 'Unknown'),
                'decimals': mint_info['result']['value']['decimals'],
                'mint_address': self.mint_address
            }
        except Exception as e:
            raise ValueError(f"Failed to get metadata: {str(e)}") 