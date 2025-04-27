from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Union, List, Tuple, Sequence, cast, TypedDict
from decimal import Decimal, ROUND_DOWN
import os
import json
from enum import Enum, auto
from dotenv import load_dotenv
from ledgerblue.comm import getDongle
from ledgerblue.commException import CommException
from solana.rpc.api import Client
from solana.transaction import Transaction
from solana.system_program import TransferParams, transfer
from web3 import Web3
from web3.contract import Contract
from web3.exceptions import ContractLogicError
from web3.gas_strategies.time_based import medium_gas_price_strategy
from web3.middleware import geth_poa_middleware
from trezorlib.client import TrezorClient
from trezorlib.transport import get_transport
from dojopool.core.exceptions import BlockchainError, WalletError
from dojopool.core.blockchain.utils import validate_address
from dojopool.core.blockchain.token_interfaces import ERC20Token
from web3.types import TxParams, Wei, HexStr, FilterParams
from eth_typing import BlockIdentifier, ChecksumAddress
import asyncio
import time
from eth_utils import to_checksum_address

# Load environment variables
load_dotenv()

class TokenType(Enum):
    """Supported token standards."""
    NATIVE = "NATIVE"  # ETH, etc.
    ERC20 = "ERC20"
    ERC721 = "ERC721"
    ERC1155 = "ERC1155"
    ERC4907 = "ERC4907"  # Rentable NFT
    ERC2981 = "ERC2981"  # NFT Royalty Standard

class BridgeProtocol(Enum):
    """Supported bridge protocols."""
    NATIVE = auto()  # Native bridge (Arbitrum, Optimism, etc.)
    HOP = auto()     # Hop Protocol
    ACROSS = auto()  # Across Protocol
    CONNEXT = auto() # Connext Protocol

class BridgeType(Enum):
    """Types of assets that can be bridged."""
    NATIVE = auto()  # Native tokens (ETH)
    ERC20 = auto()   # ERC20 tokens
    ERC721 = auto()  # NFTs (ERC721)
    ERC1155 = auto() # NFTs (ERC1155)

# Network configurations
ETHEREUM_NETWORKS = {
    "mainnet": {
        "chain_id": 1,
        "endpoint": f"https://mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://etherscan.io",
        "supports_eip1559": True
    },
    "goerli": {
        "chain_id": 5,
        "endpoint": f"https://goerli.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://goerli.etherscan.io",
        "supports_eip1559": True
    },
    "sepolia": {
        "chain_id": 11155111,
        "endpoint": f"https://sepolia.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://sepolia.etherscan.io",
        "supports_eip1559": True
    },
    "arbitrum": {
        "chain_id": 42161,
        "endpoint": f"https://arbitrum-mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://arbiscan.io",
        "supports_eip1559": False
    },
    "optimism": {
        "chain_id": 10,
        "endpoint": f"https://optimism-mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://optimistic.etherscan.io",
        "supports_eip1559": False
    },
    "polygon": {
        "chain_id": 137,
        "endpoint": f"https://polygon-mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://polygonscan.com",
        "supports_eip1559": True
    },
    "base": {
        "chain_id": 8453,
        "endpoint": f"https://base-mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://basescan.org",
        "supports_eip1559": True
    },
    "avalanche": {
        "chain_id": 43114,
        "endpoint": f"https://avalanche-mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://snowtrace.io",
        "supports_eip1559": True
    },
    "zksync_era": {
        "chain_id": 324,
        "endpoint": f"https://zksync-era.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://explorer.zksync.io",
        "supports_eip1559": True
    },
    "starknet": {
        "chain_id": "SN_MAIN",  # StarkNet uses string chain IDs
        "endpoint": f"https://starknet-mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://starkscan.co",
        "supports_eip1559": False
    },
    "linea": {
        "chain_id": 59144,
        "endpoint": f"https://linea-mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}",
        "explorer": "https://lineascan.build",
        "supports_eip1559": True
    },
    "scroll": {
        "chain_id": 534352,
        "endpoint": "https://rpc.scroll.io",
        "explorer": "https://scrollscan.com",
        "supports_eip1559": True
    },
    "fuel": {
        "chain_id": 0,  # Placeholder
        "endpoint": "https://beta-5.fuel.network/graphql",
        "explorer": "https://fuellabs.github.io/block-explorer-v2",
        "supports_eip1559": False
    },
    "zksync2": {
        "chain_id": 280,
        "endpoint": "https://zksync2-mainnet.zksync.io",
        "explorer": "https://explorer.zksync.io",
        "supports_eip1559": True
    },
    "mode": {
        "chain_id": 34443,
        "endpoint": "https://mainnet.mode.network",
        "explorer": "https://explorer.mode.network",
        "supports_eip1559": True
    }
}

# Token ABIs
ERC721_ABI = json.loads('''[
    {"inputs":[{"name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"name":"","type":"address"}],"type":"function"},
    {"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"type":"function"},
    {"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"type":"function"}
]''')

ERC1155_ABI = json.loads('''[
    {"inputs":[{"name":"account","type":"address"},{"name":"id","type":"uint256"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},
    {"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"id","type":"uint256"},{"name":"amount","type":"uint256"},{"name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"type":"function"}
]''')

# Add ERC4907 ABI
ERC4907_ABI = json.loads('''[
    {"inputs":[{"name":"tokenId","type":"uint256"}],"name":"userOf","outputs":[{"name":"","type":"address"}],"type":"function"},
    {"inputs":[{"name":"tokenId","type":"uint256"}],"name":"userExpires","outputs":[{"name":"","type":"uint256"}],"type":"function"},
    {"inputs":[{"name":"user","type":"address"},{"name":"tokenId","type":"uint256"},{"name":"expires","type":"uint64"}],"name":"setUser","outputs":[],"type":"function"}
]''')

# Add ERC2981 ABI
ERC2981_ABI = json.loads('''[
    {"inputs": [{"name": "tokenId","type": "uint256"},{"name": "salePrice","type": "uint256"}],"name": "royaltyInfo","outputs": [{"name": "receiver","type": "address"},{"name": "royaltyAmount","type": "uint256"}],"type": "function"},
    {"inputs": [],"name": "supportsInterface","outputs": [{"name": "","type": "bool"}],"type": "function"}
]''')

# Bridge configurations
BRIDGE_CONFIGS = {
    "arbitrum": {
        "l1_gateway": "0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a",
        "l2_gateway": "0x5288c571Fd7aD117beA99bF60FE0846C4E84F933"
    },
    "optimism": {
        "l1_gateway": "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
        "l2_gateway": "0x4200000000000000000000000000000000000010"
    },
    "polygon": {
        "pos_bridge": "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77",
        "plasma_bridge": "0x401F6c983eA34274ec46f84D70b31C151321188b"
    },
    "zksync": {
        "bridge": "0x32400084C286CF3E17e7B677ea9583e60a000324"
    },
    "hop": {
        "ethereum": "0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a",
        "arbitrum": "0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a",
        "optimism": "0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a",
        "polygon": "0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a"
    },
    "across": {
        "hub": "0x4D9079Bb4165aA204549B4d5D78f6a8bb08C6b61",
        "spoke": "0x4D9079Bb4165aA204549B4d5D78f6a8bb08C6b61"
    },
    "connext": {
        "diamond": "0x8898B472C54c31894e3B9bb83cEA802a5d0e63C6"
    }
}

# Add new networks
ETHEREUM_NETWORKS.update({
    "arbitrum_nova": {
        "chain_id": 42170,
        "endpoint": "https://nova.arbitrum.io/rpc",
        "explorer": "https://nova.arbiscan.io",
        "supports_eip1559": False
    },
    "zksync_lite": {
        "chain_id": 324,
        "endpoint": "https://mainnet.era.zksync.io",
        "explorer": "https://zkscan.io",
        "supports_eip1559": False
    },
    "metis": {
        "chain_id": 1088,
        "endpoint": "https://andromeda.metis.io/?owner=1088",
        "explorer": "https://andromeda-explorer.metis.io",
        "supports_eip1559": False
    },
    "mantle": {
        "chain_id": 5000,
        "endpoint": "https://rpc.mantle.xyz",
        "explorer": "https://explorer.mantle.xyz",
        "supports_eip1559": True
    }
})

# Add bridge ABIs
with open("src/dojopool/core/blockchain/abi/hop_bridge.json") as f:
    HOP_BRIDGE_ABI = json.load(f)

with open("src/dojopool/core/blockchain/abi/across_bridge.json") as f:
    ACROSS_BRIDGE_ABI = json.load(f)

with open("src/dojopool/core/blockchain/abi/connext_bridge.json") as f:
    CONNEXT_BRIDGE_ABI = json.load(f)

class HardwareWallet(ABC):
    """Abstract base class for hardware wallet implementations."""
    
    def __init__(self):
        self._connected = False
        self._device_info = None
        self._dongle = None
    
    @property
    def is_connected(self) -> bool:
        """Check if the hardware wallet is connected."""
        return self._connected
    
    @property
    def device_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the connected device."""
        return self._device_info
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection with the hardware wallet."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from the hardware wallet."""
        pass
    
    @abstractmethod
    async def get_address(self) -> str:
        """Get the public address from the hardware wallet."""
        pass
    
    @abstractmethod
    async def get_balance(self, token: str = "SOL") -> float:
        """Get the balance for a specific token."""
        pass
    
    @abstractmethod
    async def sign_transaction(self, transaction: Dict[str, Any]) -> str:
        """Sign a transaction using the hardware wallet."""
        pass
    
    @abstractmethod
    async def transfer(self, to_address: str, amount: float, token: str = "SOL") -> str:
        """Transfer tokens to another address."""
        pass
    
    def validate_connection(self):
        """Validate that the wallet is connected before operations."""
        if not self.is_connected:
            raise WalletError("Hardware wallet is not connected")
    
    def validate_amount(self, amount: float):
        """Validate that the amount is positive."""
        if amount <= 0:
            raise WalletError("Amount must be positive")

class SolanaHardwareWallet(HardwareWallet):
    """Solana-specific hardware wallet implementation using Ledger."""
    
    def __init__(self, network: str = "mainnet"):
        super().__init__()
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
    
    async def connect(self) -> bool:
        try:
            self._dongle = getDongle(True)
            # Get device info
            response = self._dongle.exchange(bytes.fromhex("e001000000"))
            version = response[1:3].hex()
            
            self._connected = True
            self._device_info = {
                "type": "Solana",
                "protocol": "USB HID",
                "manufacturer": "Ledger",
                "version": version,
                "network": self.network
            }
            return True
        except CommException as e:
            raise BlockchainError(f"Failed to connect to Solana hardware wallet: {str(e)}")
    
    async def disconnect(self) -> bool:
        try:
            if self._dongle:
                self._dongle.close()
            self._connected = False
            self._device_info = None
            self._dongle = None
            return True
        except CommException as e:
            raise BlockchainError(f"Failed to disconnect from Solana hardware wallet: {str(e)}")
    
    async def get_address(self) -> str:
        self.validate_connection()
        try:
            # Format BIP32 path for Solana (44'/501'/0'/0')
            path = bytes.fromhex("8000002c8000001f80000000800000000000000000")
            
            # Get public key command
            command = bytes.fromhex("e002000000") + len(path).to_bytes(1, 'big') + path
            response = self._dongle.exchange(command)
            
            # Extract public key from response
            public_key = response[0:32].hex()
            return public_key
        except CommException as e:
            raise BlockchainError(f"Failed to get address from Solana hardware wallet: {str(e)}")
    
    async def get_balance(self, token: str = "SOL") -> float:
        self.validate_connection()
        try:
            address = await self.get_address()
            response = self.client.get_balance(address)
            if 'error' in response:
                raise BlockchainError(f"Failed to get balance: {response['error']}")
            
            lamports = response['result']['value']
            return float(Decimal(lamports) / Decimal(1e9))  # Convert lamports to SOL
        except Exception as e:
            raise BlockchainError(f"Failed to get balance: {str(e)}")
    
    async def sign_transaction(self, transaction: Dict[str, Any]) -> str:
        self.validate_connection()
        try:
            # Serialize transaction
            serialized_tx = Transaction(**transaction).serialize()
            
            # Sign transaction command
            command = bytes.fromhex("e004000000") + len(serialized_tx).to_bytes(1, 'big') + serialized_tx
            response = self._dongle.exchange(command)
            
            # Extract signature from response
            signature = response[0:64].hex()
            return signature
        except CommException as e:
            raise BlockchainError(f"Failed to sign transaction: {str(e)}")
    
    async def transfer(self, to_address: str, amount: float, token: str = "SOL") -> str:
        self.validate_connection()
        self.validate_amount(amount)
        
        try:
            if not validate_address(to_address, 'solana'):
                raise ValueError("Invalid recipient address")
            
            from_address = await self.get_address()
            
            # Convert SOL to lamports
            lamports = int(Decimal(amount) * Decimal(1e9))
            
            # Create transfer instruction
            transfer_params = TransferParams(
                from_pubkey=from_address,
                to_pubkey=to_address,
                lamports=lamports
            )
            transfer_ix = transfer(transfer_params)
            
            # Build transaction
            transaction = Transaction()
            transaction.add(transfer_ix)
            
            # Sign transaction
            signature = await self.sign_transaction(transaction.to_dict())
            
            # Send transaction
            result = self.client.send_transaction(
                transaction,
                signature,
                opts={
                    "skip_confirmation": False,
                    "preflight_commitment": "confirmed",
                    "max_retries": 3
                }
            )
            
            if 'error' in result:
                raise BlockchainError(f"Transfer failed: {result['error']}")
            
            return result['result']
            
        except Exception as e:
            raise BlockchainError(f"Transfer failed: {str(e)}")

class EthereumHardwareWallet(HardwareWallet):
    """Ethereum-specific hardware wallet implementation using Trezor."""
    
    def __init__(self, network: str = "mainnet"):
        super().__init__()
        if network not in ETHEREUM_NETWORKS:
            raise ValueError(f"Unsupported network: {network}. Available networks: {', '.join(ETHEREUM_NETWORKS.keys())}")
        
        self.network = network
        self.network_config = ETHEREUM_NETWORKS[network]
        
        # Check for Infura project ID
        if not os.getenv('INFURA_PROJECT_ID'):
            raise BlockchainError("INFURA_PROJECT_ID environment variable not set")
        
        # Initialize Web3 with appropriate middleware
        self.web3 = Web3(Web3.HTTPProvider(self.network_config['endpoint']))
        
        # Add network-specific middleware
        if network in ['optimism', 'polygon', 'base', 'linea', 'scroll', 'arbitrum_nova', 'metis', 'mantle']:
            self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Set gas price strategy for EIP-1559 networks
        if self.network_config['supports_eip1559']:
            self.web3.eth.set_gas_price_strategy(medium_gas_price_strategy)
        
        if not self.web3.is_connected():
            raise BlockchainError(f"Failed to connect to {network} network")
        
        # Initialize contract caches
        self._token_contracts: Dict[str, Contract] = {}
        self._nft_contracts: Dict[str, Contract] = {}
        self._nft_types: Dict[str, TokenType] = {}
        self._bridge_contracts: Dict[str, Dict[str, Contract]] = {
            "native": {},
            "hop": {},
            "across": {},
            "connext": {}
        }
        
        # Transaction nonce management
        self._nonce_lock = asyncio.Lock()
        self._last_nonce: Optional[int] = None
    
    async def _get_next_nonce(self, address: str) -> int:
        """Get next nonce with proper synchronization."""
        async with self._nonce_lock:
            if self._last_nonce is None:
                self._last_nonce = self.web3.eth.get_transaction_count(address)
            else:
                self._last_nonce += 1
            return self._last_nonce
    
    def _get_contract(self, address: str, token_type: TokenType) -> Contract:
        """Get or create contract instance."""
        cache_key = f"{token_type.value}:{address}"
        
        if cache_key not in self._token_contracts:
            if token_type == TokenType.ERC20:
                token = ERC20Token(self.web3, address)
                self._token_contracts[cache_key] = token.contract
            elif token_type == TokenType.ERC721:
                self._token_contracts[cache_key] = self.web3.eth.contract(
                    address=address,
                    abi=ERC721_ABI
                )
            elif token_type == TokenType.ERC1155:
                self._token_contracts[cache_key] = self.web3.eth.contract(
                    address=address,
                    abi=ERC1155_ABI
                )
            elif token_type == TokenType.ERC4907:
                # Combine ERC721 and ERC4907 ABIs
                combined_abi = ERC721_ABI + ERC4907_ABI
                self._token_contracts[cache_key] = self.web3.eth.contract(
                    address=address,
                    abi=combined_abi
                )
        
        return self._token_contracts[cache_key]
    
    async def detect_token_type(self, token_address: str) -> TokenType:
        """Detect token standard of contract."""
        if token_address in self._nft_types:
            return self._nft_types[token_address]
        
        try:
            # Try ERC4907 (must check first since it extends ERC721)
            contract = self.web3.eth.contract(address=token_address, abi=ERC4907_ABI)
            try:
                contract.functions.userOf(0).call()
                self._nft_types[token_address] = TokenType.ERC4907
                return TokenType.ERC4907
            except (ContractLogicError, ValueError):
                pass
            
            # Try ERC721
            contract = self.web3.eth.contract(address=token_address, abi=ERC721_ABI)
            try:
                contract.functions.ownerOf(0).call()
                self._nft_types[token_address] = TokenType.ERC721
                return TokenType.ERC721
            except (ContractLogicError, ValueError):
                pass
                
            # Try ERC1155
            contract = self.web3.eth.contract(address=token_address, abi=ERC1155_ABI)
            try:
                contract.functions.balanceOf(self.web3.eth.default_account, 0).call()
                self._nft_types[token_address] = TokenType.ERC1155
                return TokenType.ERC1155
            except (ContractLogicError, ValueError):
                pass
                
            # Must be ERC20
            return TokenType.ERC20
            
        except Exception as e:
            raise BlockchainError(f"Failed to detect token type: {str(e)}")
    
    async def estimate_gas(
        self,
        to_address: str,
        amount: Union[float, int],
        token_address: Optional[str] = None,
        token_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Estimate gas for transaction."""
        try:
            from_address = await self.get_address()
            
            if token_address:
                # Detect token type
                token_type = await self.detect_token_type(token_address)
                contract = self._get_contract(token_address, token_type)
                
                if token_type == TokenType.ERC20:
                    # ERC20 transfer
                    decimals = contract.functions.decimals().call()
                    amount_raw = int(Decimal(amount) * Decimal(10 ** decimals))
                    gas = contract.functions.transfer(
                        to_address,
                        amount_raw
                    ).estimate_gas({'from': from_address})
                elif token_type == TokenType.ERC721:
                    # ERC721 transfer
                    gas = contract.functions.safeTransferFrom(
                        from_address,
                        to_address,
                        token_id
                    ).estimate_gas({'from': from_address})
                else:  # ERC1155
                    # ERC1155 transfer
                    gas = contract.functions.safeTransferFrom(
                        from_address,
                        to_address,
                        token_id,
                        int(amount),
                        b''
                    ).estimate_gas({'from': from_address})
            else:
                # Native token transfer
                gas = self.web3.eth.estimate_gas({
                    'from': from_address,
                    'to': to_address,
                    'value': self.web3.to_wei(amount, 'ether')
                })
            
            # Get gas price
            if self.network_config['supports_eip1559']:
                fee_data = self.web3.eth.fee_history(4, 'latest', [10, 50, 90])
                base_fee = fee_data['baseFeePerGas'][-1]
                max_priority_fee = fee_data['reward'][1][1]  # 50th percentile
                max_fee = int(base_fee * 1.5) + max_priority_fee
                
                return {
                    'gas_limit': int(gas * 1.2),  # Add 20% buffer
                    'max_fee_per_gas': max_fee,
                    'max_priority_fee_per_gas': max_priority_fee,
                    'type': 2  # EIP-1559
                }
            else:
                gas_price = self.web3.eth.gas_price
                return {
                    'gas_limit': int(gas * 1.2),  # Add 20% buffer
                    'gas_price': int(gas_price * 1.1),  # Add 10% buffer
                    'type': 0  # Legacy
                }
                
        except Exception as e:
            raise BlockchainError(f"Failed to estimate gas: {str(e)}")
    
    async def get_nft_balance(
        self,
        token_address: str,
        token_id: Optional[int] = None
    ) -> Union[int, Dict[int, int]]:
        """Get NFT balance."""
        self.validate_connection()
        try:
            if not Web3.is_address(token_address):
                raise ValueError("Invalid token address")
                
            # Detect token type
            token_type = await self.detect_token_type(token_address)
            if token_type not in [TokenType.ERC721, TokenType.ERC1155]:
                raise ValueError("Not an NFT contract")
                
            contract = self._get_contract(token_address, token_type)
            address = await self.get_address()
            
            if token_type == TokenType.ERC721:
                if token_id is not None:
                    # Check ownership of specific token
                    try:
                        owner = contract.functions.ownerOf(token_id).call()
                        return 1 if owner.lower() == address.lower() else 0
                    except ContractLogicError:
                        return 0
                else:
                    # Get all owned tokens (expensive operation)
                    owned_tokens = {}
                    transfer_filter = contract.events.Transfer.create_filter(
                        fromBlock=0,
                        argument_filters={'to': address}
                    )
                    for event in transfer_filter.get_all_entries():
                        token_id = event['args']['tokenId']
                        try:
                            owner = contract.functions.ownerOf(token_id).call()
                            if owner.lower() == address.lower():
                                owned_tokens[token_id] = 1
                        except ContractLogicError:
                            continue
                    return owned_tokens
            else:  # ERC1155
                if token_id is not None:
                    # Get balance of specific token
                    balance = contract.functions.balanceOf(address, token_id).call()
                    return balance
                else:
                    # Get all token balances (from transfer events)
                    balances = {}
                    transfer_filter = contract.events.TransferSingle.create_filter(
                        fromBlock=0,
                        argument_filters={'to': address}
                    )
                    for event in transfer_filter.get_all_entries():
                        token_id = event['args']['id']
                        balance = contract.functions.balanceOf(address, token_id).call()
                        if balance > 0:
                            balances[token_id] = balance
                    return balances
                    
        except Exception as e:
            raise BlockchainError(f"Failed to get NFT balance: {str(e)}")
    
    async def transfer_nft(
        self,
        to_address: str,
        token_address: str,
        token_id: int,
        amount: int = 1
    ) -> str:
        """Transfer NFT."""
        self.validate_connection()
        
        try:
            if not validate_address(to_address, 'ethereum'):
                raise ValueError("Invalid recipient address")
                
            # Detect token type
            token_type = await self.detect_token_type(token_address)
            if token_type not in [TokenType.ERC721, TokenType.ERC1155]:
                raise ValueError("Not an NFT contract")
                
            from_address = await self.get_address()
            contract = self._get_contract(token_address, token_type)
            
            # Estimate gas
            gas_params = await self.estimate_gas(
                to_address,
                amount,
                token_address,
                token_id
            )
            
            if token_type == TokenType.ERC721:
                # Build ERC721 transfer
                tx = contract.functions.safeTransferFrom(
                    from_address,
                    to_address,
                    token_id
                ).build_transaction({
                    'from': from_address,
                    'nonce': await self._get_next_nonce(from_address),
                    **gas_params
                })
            else:  # ERC1155
                # Build ERC1155 transfer
                tx = contract.functions.safeTransferFrom(
                    from_address,
                    to_address,
                    token_id,
                    amount,
                    b''
                ).build_transaction({
                    'from': from_address,
                    'nonce': await self._get_next_nonce(from_address),
                    **gas_params
                })
            
            # Sign and send transaction
            signed_tx = await self.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(bytes.fromhex(signed_tx[2:]))
            
            # Wait for receipt
            receipt = self.web3.eth.wait_for_transaction_receipt(
                tx_hash,
                timeout=120,
                poll_latency=0.1
            )
            
            if receipt['status'] == 0:
                raise BlockchainError("Transaction failed")
            
            return tx_hash.hex()
            
        except Exception as e:
            raise BlockchainError(f"Failed to transfer NFT: {str(e)}")
    
    def get_transaction_url(self, tx_hash: str) -> str:
        """Get transaction URL for block explorer."""
        return f"{self.network_config['explorer']}/tx/{tx_hash}"
    
    async def get_rental_info(
        self,
        token_address: str,
        token_id: int
    ) -> Dict[str, Any]:
        """Get rental information for an ERC4907 NFT."""
        self.validate_connection()
        try:
            token_type = await self.detect_token_type(token_address)
            if token_type != TokenType.ERC4907:
                raise ValueError("Not an ERC4907 token")
            
            contract = self._get_contract(token_address, TokenType.ERC4907)
            user = contract.functions.userOf(token_id).call()
            expires = contract.functions.userExpires(token_id).call()
            
            return {
                "user": user,
                "expires": expires,
                "is_rented": user != "0x0000000000000000000000000000000000000000" and expires > int(time.time())
            }
        except Exception as e:
            raise BlockchainError(f"Failed to get rental info: {str(e)}")
    
    async def rent_nft(
        self,
        token_address: str,
        token_id: int,
        user_address: str,
        duration: int  # Duration in seconds
    ) -> str:
        """Rent out an ERC4907 NFT."""
        self.validate_connection()
        
        try:
            if not validate_address(user_address, 'ethereum'):
                raise ValueError("Invalid user address")
            
            token_type = await self.detect_token_type(token_address)
            if token_type != TokenType.ERC4907:
                raise ValueError("Not an ERC4907 token")
            
            from_address = await self.get_address()
            contract = self._get_contract(token_address, TokenType.ERC4907)
            
            # Calculate expiration timestamp
            expires = int(time.time()) + duration
            
            # Estimate gas
            gas = contract.functions.setUser(
                user_address,
                token_id,
                expires
            ).estimate_gas({'from': from_address})
            
            # Get gas parameters
            gas_params = await self.estimate_gas(
                user_address,
                0,  # No value transfer
                token_address
            )
            
            # Build transaction
            tx = contract.functions.setUser(
                user_address,
                token_id,
                expires
            ).build_transaction({
                'from': from_address,
                'nonce': await self._get_next_nonce(from_address),
                **gas_params
            })
            
            # Sign and send transaction
            signed_tx = await self.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(bytes.fromhex(signed_tx[2:]))
            
            # Wait for receipt
            receipt = self.web3.eth.wait_for_transaction_receipt(
                tx_hash,
                timeout=120,
                poll_latency=0.1
            )
            
            if receipt['status'] == 0:
                raise BlockchainError("Transaction failed")
            
            return tx_hash.hex()
            
        except Exception as e:
            raise BlockchainError(f"Failed to rent NFT: {str(e)}")
    
    async def batch_transfer_nft(
        self,
        transfers: List[Dict[str, Any]]
    ) -> List[str]:
        """Batch transfer multiple NFTs.
        
        Args:
            transfers: List of transfer details, each containing:
                - to_address: Recipient address
                - token_address: NFT contract address
                - token_id: Token ID
                - amount: Amount (for ERC1155)
        """
        self.validate_connection()
        
        try:
            from_address = await self.get_address()
            tx_hashes = []
            
            # Group transfers by token contract and type
            grouped_transfers: Dict[str, List[Dict[str, Any]]] = {}
            for transfer in transfers:
                token_type = await self.detect_token_type(transfer['token_address'])
                key = f"{token_type.value}:{transfer['token_address']}"
                if key not in grouped_transfers:
                    grouped_transfers[key] = []
                grouped_transfers[key].append(transfer)
            
            # Process each group
            for key, group in grouped_transfers.items():
                token_type = TokenType(key.split(':')[0])
                token_address = key.split(':')[1]
                contract = self._get_contract(token_address, token_type)
                
                if token_type == TokenType.ERC1155 and len(group) > 1:
                    # Use batch transfer for multiple ERC1155 tokens
                    to_addresses = [t['to_address'] for t in group]
                    token_ids = [t['token_id'] for t in group]
                    amounts = [t.get('amount', 1) for t in group]
                    
                    # Estimate gas
                    gas = contract.functions.safeBatchTransferFrom(
                        from_address,
                        to_addresses[0],  # Must be same recipient
                        token_ids,
                        amounts,
                        b''
                    ).estimate_gas({'from': from_address})
                    
                    # Get gas parameters
                    gas_params = await self.estimate_gas(
                        to_addresses[0],
                        sum(amounts),
                        token_address
                    )
                    
                    # Build transaction
                    tx = contract.functions.safeBatchTransferFrom(
                        from_address,
                        to_addresses[0],
                        token_ids,
                        amounts,
                        b''
                    ).build_transaction({
                        'from': from_address,
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
                    
                    # Sign and send
                    signed_tx = await self.sign_transaction(tx)
                    tx_hash = self.web3.eth.send_raw_transaction(bytes.fromhex(signed_tx[2:]))
                    tx_hashes.append(tx_hash.hex())
                    
                else:
                    # Process individual transfers
                    for transfer in group:
                        tx_hash = await self.transfer_nft(
                            transfer['to_address'],
                            transfer['token_address'],
                            transfer['token_id'],
                            transfer.get('amount', 1)
                        )
                        tx_hashes.append(tx_hash)
            
            return tx_hashes
            
        except Exception as e:
            raise BlockchainError(f"Failed to batch transfer NFTs: {str(e)}")
    
    async def wait_for_transactions(
        self,
        tx_hashes: List[str],
        timeout: int = 300
    ) -> List[Dict[str, Any]]:
        """Wait for multiple transactions to complete."""
        try:
            async def wait_for_tx(tx_hash: str) -> Dict[str, Any]:
                receipt = self.web3.eth.wait_for_transaction_receipt(
                    tx_hash,
                    timeout=timeout,
                    poll_latency=0.1
                )
                return {
                    'tx_hash': tx_hash,
                    'status': receipt['status'],
                    'block_number': receipt['blockNumber'],
                    'gas_used': receipt['gasUsed'],
                    'url': self.get_transaction_url(tx_hash)
                }
            
            # Wait for all transactions concurrently
            tasks = [wait_for_tx(tx_hash) for tx_hash in tx_hashes]
            results = await asyncio.gather(*tasks)
            return results
            
        except Exception as e:
            raise BlockchainError(f"Failed to wait for transactions: {str(e)}")
    
    async def wait_for_l2_transaction(
        self,
        tx_hash: str,
        target_network: str,
        timeout: int = 300
    ) -> Dict[str, Any]:
        """Wait for a transaction to be confirmed on an L2 network.

        Args:
            tx_hash (str): The transaction hash to monitor
            target_network (str): The L2 network to check (e.g. "zksync_era", "starknet")
            timeout (int, optional): Maximum time to wait in seconds. Defaults to 300.

        Returns:
            Dict[str, Any]: Transaction status including confirmation and block number
        """
        if target_network not in ETHEREUM_NETWORKS:
            raise NetworkError(f"Unsupported L2 network: {target_network}")

        # Get the appropriate Web3 instance for the L2 network
        w3 = Web3(Web3.HTTPProvider(ETHEREUM_NETWORKS[target_network]["endpoint"]))
        if ETHEREUM_NETWORKS[target_network].get("supports_eip1559", False):
            w3.eth.set_gas_price_strategy(medium_gas_price_strategy)

        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # Get transaction receipt
                receipt = await w3.eth.get_transaction_receipt(tx_hash)
                if receipt and receipt["status"] == 1:
                    return {
                        "confirmed": True,
                        "block_number": receipt["blockNumber"],
                        "gas_used": receipt["gasUsed"],
                        "effective_gas_price": receipt["effectiveGasPrice"],
                        "l2_network": target_network,
                        "explorer_url": f"{ETHEREUM_NETWORKS[target_network]['explorer']}/tx/{tx_hash}"
                    }
            except Exception as e:
                # Some L2s might have different RPC methods or temporary issues
                # We'll continue waiting unless timeout is reached
                await asyncio.sleep(2)
                continue

            await asyncio.sleep(2)

        raise TimeoutError(f"Transaction {tx_hash} not confirmed on {target_network} after {timeout} seconds")
    
    async def check_l2_network_status(
        self,
        target_network: str
    ) -> bool:
        """Check if the L2 network is available."""
        if target_network not in ETHEREUM_NETWORKS:
            raise NetworkError(f"Unsupported L2 network: {target_network}")

        try:
            # Attempt to get the current block number
            block_number = self.web3.eth.get_block('latest')['number']
            return True
        except Exception as e:
            raise NetworkError(f"Failed to check L2 network status: {str(e)}")
    
    async def get_royalty_info(
        self,
        token_address: str,
        token_id: int,
        sale_price: int
    ) -> Dict[str, Any]:
        """Get royalty information for an NFT implementing ERC2981."""
        self.validate_connection()
        try:
            contract = self.web3.eth.contract(address=token_address, abi=ERC2981_ABI)
            
            # Check if contract supports ERC2981
            try:
                supports_2981 = contract.functions.supportsInterface(
                    # ERC2981 interface ID
                    "0x2a55205a"
                ).call()
                if not supports_2981:
                    return {"supports_royalties": False}
            except (ContractLogicError, ValueError):
                return {"supports_royalties": False}
            
            # Get royalty info
            receiver, amount = contract.functions.royaltyInfo(
                token_id,
                sale_price
            ).call()
            
            return {
                "supports_royalties": True,
                "receiver": receiver,
                "amount": amount,
                "percentage": (amount * 100) / sale_price
            }
        except Exception as e:
            raise BlockchainError(f"Failed to get royalty info: {str(e)}")
    
    def _get_bridge_contract(
        self,
        bridge_protocol: BridgeProtocol,
        network: str
    ) -> Contract:
        """Get bridge contract instance."""
        protocol_key = bridge_protocol.name.lower()
        cache_key = f"{protocol_key}:{network}"
        
        if cache_key not in self._bridge_contracts[protocol_key]:
            if bridge_protocol == BridgeProtocol.HOP:
                address = BRIDGE_CONFIGS["hop"][network]
                abi = HOP_BRIDGE_ABI
            elif bridge_protocol == BridgeProtocol.ACROSS:
                address = BRIDGE_CONFIGS["across"]["hub" if network == "mainnet" else "spoke"]
                abi = ACROSS_BRIDGE_ABI
            elif bridge_protocol == BridgeProtocol.CONNEXT:
                address = BRIDGE_CONFIGS["connext"]["diamond"]
                abi = CONNEXT_BRIDGE_ABI
            else:  # Native bridge
                address = BRIDGE_CONFIGS[network]["bridge"]
                with open(f"src/dojopool/core/blockchain/abi/{network}_bridge.json") as f:
                    abi = json.load(f)
            
            self._bridge_contracts[protocol_key][network] = self.web3.eth.contract(
                address=address,
                abi=abi
            )
        
        return self._bridge_contracts[protocol_key][network]
    
    async def get_bridge_quote(
        self,
        from_token: str,
        to_token: str,
        amount: Union[int, float],
        bridge_protocol: BridgeProtocol,
        to_network: str
    ) -> Dict[str, Any]:
        """Get quote for bridging assets."""
        try:
            bridge_contract = self._get_bridge_contract(bridge_protocol, self.network)
            from_address = await self.get_address()
            
            if bridge_protocol == BridgeProtocol.HOP:
                quote = await bridge_contract.functions.getQuote(
                    from_token,
                    to_token,
                    self.web3.to_wei(amount, 'ether'),
                    to_network
                ).call()
                
                return {
                    "amount_out": self.web3.from_wei(quote["amountOut"], 'ether'),
                    "fee": self.web3.from_wei(quote["fee"], 'ether'),
                    "estimated_time": quote["estimatedTime"],
                    "slippage": quote["slippage"] / 10000  # Convert basis points to percentage
                }
            
            elif bridge_protocol == BridgeProtocol.ACROSS:
                quote = await bridge_contract.functions.quoteRelayerFee(
                    from_token,
                    to_token,
                    self.web3.to_wei(amount, 'ether'),
                    ETHEREUM_NETWORKS[to_network]["chain_id"]
                ).call()
                
                return {
                    "amount_out": self.web3.from_wei(quote["amountOut"], 'ether'),
                    "relayer_fee": self.web3.from_wei(quote["relayerFee"], 'ether'),
                    "estimated_time": quote["estimatedTime"]
                }
            
            elif bridge_protocol == BridgeProtocol.CONNEXT:
                quote = await bridge_contract.functions.calculateSwap(
                    from_token,
                    to_token,
                    self.web3.to_wei(amount, 'ether')
                ).call()
                
                return {
                    "amount_out": self.web3.from_wei(quote, 'ether'),
                    "estimated_time": 1800  # 30 minutes default
                }
            
            else:  # Native bridge
                # Native bridges typically don't have quote functions
                return {
                    "amount_out": amount,
                    "estimated_time": 900  # 15 minutes default
                }
                
        except Exception as e:
            raise BlockchainError(f"Failed to get bridge quote: {str(e)}")
    
    async def bridge_nft(
        self,
        to_network: str,
        token_address: str,
        token_id: int,
        bridge_protocol: Optional[BridgeProtocol] = None,
        wait_for_inclusion: bool = True
    ) -> Dict[str, Any]:
        """Bridge NFT between networks."""
        self.validate_connection()
        
        try:
            # Detect token type
            token_type = await self.detect_token_type(token_address)
            if token_type not in [TokenType.ERC721, TokenType.ERC1155]:
                raise ValueError("Not an NFT contract")
            
            # Default to native bridge if protocol not specified
            if bridge_protocol is None:
                bridge_protocol = BridgeProtocol.NATIVE
            
            from_address = await self.get_address()
            bridge_contract = self._get_bridge_contract(bridge_protocol, self.network)
            
            # Get gas parameters
            gas_params = await self.estimate_bridge_gas(
                self.network,
                to_network,
                0,  # No ETH value for NFT transfer
                token_address
            )
            
            # Approve NFT transfer if needed
            if token_type == TokenType.ERC721:
                nft_contract = self._get_contract(token_address, TokenType.ERC721)
                approved = nft_contract.functions.getApproved(token_id).call() == bridge_contract.address
                
                if not approved:
                    approve_tx = nft_contract.functions.approve(
                        bridge_contract.address,
                        token_id
                    ).build_transaction({
                        'from': from_address,
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
                    
                    # Sign and send approval
                    signed_approve = await self.sign_transaction(approve_tx)
                    approve_hash = self.web3.eth.send_raw_transaction(
                        bytes.fromhex(signed_approve[2:])
                    )
                    
                    # Wait for approval
                    if wait_for_inclusion:
                        self.web3.eth.wait_for_transaction_receipt(
                            approve_hash,
                            timeout=120
                        )
            
            # Build bridge transaction based on protocol
            if bridge_protocol == BridgeProtocol.NATIVE:
                if to_network == "arbitrum":
                    tx = bridge_contract.functions.bridgeERC721(
                        token_address,
                        token_id,
                        0,  # Default gas
                        '0x'  # No additional data
                    ).build_transaction({
                        'from': from_address,
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
                elif to_network == "optimism":
                    tx = bridge_contract.functions.bridgeNFT(
                        token_address,
                        token_id,
                        from_address,
                        '0x'  # No additional data
                    ).build_transaction({
                        'from': from_address,
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
                else:
                    raise ValueError(f"NFT bridging not supported for network: {to_network}")
            
            elif bridge_protocol == BridgeProtocol.HOP:
                tx = bridge_contract.functions.sendNFT(
                    token_address,
                    token_id,
                    to_network,
                    from_address,
                    '0x'  # No additional data
                ).build_transaction({
                    'from': from_address,
                    'nonce': await self._get_next_nonce(from_address),
                    **gas_params
                })
            
            else:
                raise ValueError(f"NFT bridging not supported for protocol: {bridge_protocol}")
            
            # Sign and send transaction
            signed_tx = await self.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(bytes.fromhex(signed_tx[2:]))
            
            result = {
                'tx_hash': tx_hash.hex(),
                'from_network': self.network,
                'to_network': to_network,
                'token_address': token_address,
                'token_id': token_id,
                'bridge_protocol': bridge_protocol.name,
                'explorer_url': self.get_transaction_url(tx_hash.hex())
            }
            
            # Wait for transaction inclusion if requested
            if wait_for_inclusion:
                receipt = self.web3.eth.wait_for_transaction_receipt(
                    tx_hash,
                    timeout=300,  # Longer timeout for bridge transactions
                    poll_latency=0.1
                )
                result['status'] = 'success' if receipt['status'] == 1 else 'failed'
                result['block_number'] = receipt['blockNumber']
                result['gas_used'] = receipt['gasUsed']
            
            return result
            
        except Exception as e:
            raise BlockchainError(f"Failed to bridge NFT: {str(e)}")
    
    async def bridge_assets(
        self,
        to_network: str,
        amount: Union[int, float],
        token_address: Optional[str] = None,
        bridge_protocol: Optional[BridgeProtocol] = None,
        wait_for_inclusion: bool = True
    ) -> Dict[str, Any]:
        """Bridge assets between networks using specified protocol."""
        self.validate_connection()
        
        try:
            # Default to native bridge if protocol not specified
            if bridge_protocol is None:
                bridge_protocol = BridgeProtocol.NATIVE
            
            # Get quote first
            if token_address:
                quote = await self.get_bridge_quote(
                    token_address,
                    token_address,  # Same token on destination
                    amount,
                    bridge_protocol,
                    to_network
                )
            else:
                quote = await self.get_bridge_quote(
                    "0x0000000000000000000000000000000000000000",  # ETH
                    "0x0000000000000000000000000000000000000000",
                    amount,
                    bridge_protocol,
                    to_network
                )
            
            # Get bridge contract and build transaction
            bridge_contract = self._get_bridge_contract(bridge_protocol, self.network)
            from_address = await self.get_address()
            
            # Get gas parameters
            gas_params = await self.estimate_bridge_gas(
                self.network,
                to_network,
                amount,
                token_address
            )
            
            # Build transaction based on protocol
            if bridge_protocol == BridgeProtocol.HOP:
                if token_address:
                    # Approve token first if needed
                    await self._approve_token(
                        token_address,
                        bridge_contract.address,
                        amount,
                        wait_for_inclusion
                    )
                    
                    tx = bridge_contract.functions.swapAndSend(
                        token_address,
                        self.web3.to_wei(amount, 'ether'),
                        to_network,
                        from_address,
                        0  # Min amount out (use quote for production)
                    ).build_transaction({
                        'from': from_address,
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
                else:
                    tx = bridge_contract.functions.sendToL2(
                        to_network,
                        from_address
                    ).build_transaction({
                        'from': from_address,
                        'value': self.web3.to_wei(amount, 'ether'),
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
            
            elif bridge_protocol == BridgeProtocol.ACROSS:
                deadline = int(time.time()) + 3600  # 1 hour
                if token_address:
                    await self._approve_token(
                        token_address,
                        bridge_contract.address,
                        amount,
                        wait_for_inclusion
                    )
                    
                    tx = bridge_contract.functions.deposit(
                        token_address,
                        self.web3.to_wei(amount, 'ether'),
                        ETHEREUM_NETWORKS[to_network]["chain_id"],
                        from_address,
                        quote["relayer_fee"],
                        deadline
                    ).build_transaction({
                        'from': from_address,
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
                else:
                    tx = bridge_contract.functions.deposit(
                        "0x0000000000000000000000000000000000000000",
                        self.web3.to_wei(amount, 'ether'),
                        ETHEREUM_NETWORKS[to_network]["chain_id"],
                        from_address,
                        quote["relayer_fee"],
                        deadline
                    ).build_transaction({
                        'from': from_address,
                        'value': self.web3.to_wei(amount, 'ether'),
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
            
            elif bridge_protocol == BridgeProtocol.CONNEXT:
                if token_address:
                    await self._approve_token(
                        token_address,
                        bridge_contract.address,
                        amount,
                        wait_for_inclusion
                    )
                    
                    tx = bridge_contract.functions.xcall(
                        ETHEREUM_NETWORKS[to_network]["chain_id"],
                        from_address,
                        token_address,
                        from_address,
                        self.web3.to_wei(amount, 'ether'),
                        30,  # Default slippage
                        '0x'  # No additional calldata
                    ).build_transaction({
                        'from': from_address,
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
                else:
                    tx = bridge_contract.functions.xcall(
                        ETHEREUM_NETWORKS[to_network]["chain_id"],
                        from_address,
                        "0x0000000000000000000000000000000000000000",
                        from_address,
                        self.web3.to_wei(amount, 'ether'),
                        30,  # Default slippage
                        '0x'  # No additional calldata
                    ).build_transaction({
                        'from': from_address,
                        'value': self.web3.to_wei(amount, 'ether'),
                        'nonce': await self._get_next_nonce(from_address),
                        **gas_params
                    })
            
            else:
                # Use existing native bridge implementation
                return await super().bridge_assets(
                    to_network,
                    amount,
                    token_address,
                    wait_for_inclusion
                )
            
            # Sign and send transaction
            signed_tx = await self.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(bytes.fromhex(signed_tx[2:]))
            
            result = {
                'tx_hash': tx_hash.hex(),
                'from_network': self.network,
                'to_network': to_network,
                'amount': amount,
                'amount_out': quote["amount_out"],
                'bridge_protocol': bridge_protocol.name,
                'explorer_url': self.get_transaction_url(tx_hash.hex()),
                'estimated_time': quote["estimated_time"]
            }
            
            # Wait for transaction inclusion if requested
            if wait_for_inclusion:
                receipt = self.web3.eth.wait_for_transaction_receipt(
                    tx_hash,
                    timeout=300,
                    poll_latency=0.1
                )
                result['status'] = 'success' if receipt['status'] == 1 else 'failed'
                result['block_number'] = receipt['blockNumber']
                result['gas_used'] = receipt['gasUsed']
            
            return result
            
        except Exception as e:
            raise BlockchainError(f"Failed to bridge assets: {str(e)}")

    async def _approve_token(self, token_address: str, spender: str, amount: int, wait_for_inclusion: bool = True) -> str:
        """Approve tokens for bridging."""
        if not self.address:
            raise ValueError("Wallet not connected")

        token_contract = self.web3.eth.contract(address=token_address, abi=ERC20_ABI)
        
        tx_params = {
            "from": self.address,
            "nonce": await self._get_next_nonce()
        }

        tx = await token_contract.functions.approve(spender, amount).build_transaction(tx_params)
        signed_tx = await self.sign_transaction(tx)
        tx_hash = await self.web3.eth.send_raw_transaction(signed_tx)
        
        if wait_for_inclusion:
            receipt = await self.web3.eth.wait_for_transaction_receipt(tx_hash)
            if receipt["status"] != 1:
                raise ValueError("Token approval failed")

        return tx_hash.hex()

    async def estimate_bridge_gas(self, to_network: str, amount: float, token_address: Optional[str] = None) -> Dict[str, Any]:
        """Estimate gas for bridging assets."""
        if not self.address:
            raise ValueError("Wallet not connected")

        if to_network not in ETHEREUM_NETWORKS:
            raise ValueError(f"Unsupported target network: {to_network}")

        # Determine bridge protocol based on target network
        bridge_protocol = None
        for protocol in BridgeProtocol:
            if protocol.name.lower() in to_network.lower():
                bridge_protocol = protocol
                break

        if not bridge_protocol or bridge_protocol not in BRIDGE_CONFIGS:
            raise ValueError(f"No bridge configuration found for network: {to_network}")

        bridge_config = BRIDGE_CONFIGS[bridge_protocol]
        
        # Prepare transaction parameters
        tx_params = {
            "from": self.address,
            "to": bridge_config["gateway"],
            "value": self.web3.to_wei(amount, "ether") if not token_address else 0,
            "nonce": await self._get_next_nonce()
        }

        try:
            # Estimate gas
            gas_estimate = await self.web3.eth.estimate_gas(tx_params)
            gas_price = await self.web3.eth.gas_price

            return {
                "estimated_gas": gas_estimate,
                "gas_price": gas_price,
                "total_cost_wei": gas_estimate * gas_price
            }
        except Exception as e:
            raise ValueError(f"Failed to estimate bridge gas: {str(e)}") 