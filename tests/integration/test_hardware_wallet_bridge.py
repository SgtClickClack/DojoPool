import pytest
from unittest.mock import Mock, patch, AsyncMock
from decimal import Decimal
from dojopool.core.blockchain.hardware_wallet import EthereumHardwareWallet, TokenType
from dojopool.core.exceptions import WalletError, BlockchainError, BridgeError

@pytest.fixture
async def ethereum_wallet():
    wallet = EthereumHardwareWallet(network="mainnet")
    await wallet.connect()
    yield wallet
    if wallet.is_connected:
        await wallet.disconnect()

@pytest.fixture
async def l2_wallet():
    wallet = EthereumHardwareWallet(network="arbitrum")
    await wallet.connect()
    yield wallet
    if wallet.is_connected:
        await wallet.disconnect()

@pytest.mark.asyncio
async def test_bridge_quote_estimation():
    """Test bridge quote estimation for different token types and networks."""
    wallet = EthereumHardwareWallet(network="mainnet")
    
    # Test ETH bridge quote
    quote = await wallet.get_bridge_quote(
        to_network="arbitrum",
        amount=1.0,
        token_address=None  # ETH
    )
    assert isinstance(quote.estimated_gas, int)
    assert isinstance(quote.bridge_fee, Decimal)
    assert isinstance(quote.estimated_time, int)
    
    # Test ERC20 bridge quote
    usdc_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"  # USDC
    quote = await wallet.get_bridge_quote(
        to_network="optimism",
        amount=100.0,
        token_address=usdc_address
    )
    assert isinstance(quote.estimated_gas, int)
    assert isinstance(quote.bridge_fee, Decimal)
    assert isinstance(quote.estimated_time, int)
    
    # Test NFT bridge quote
    nft_address = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"  # Example NFT
    quote = await wallet.get_bridge_quote(
        to_network="polygon",
        token_address=nft_address,
        token_type=TokenType.ERC721,
        token_id=1234
    )
    assert isinstance(quote.estimated_gas, int)
    assert isinstance(quote.bridge_fee, Decimal)
    assert isinstance(quote.estimated_time, int)

@pytest.mark.asyncio
async def test_bridge_eth_to_l2(ethereum_wallet, l2_wallet):
    """Test bridging ETH from mainnet to L2."""
    amount = 0.1
    
    # Get initial balances
    initial_l1_balance = await ethereum_wallet.get_balance()
    initial_l2_balance = await l2_wallet.get_balance()
    
    # Bridge ETH
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="arbitrum",
        amount=amount,
        wait_for_inclusion=True
    )
    
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")
    
    # Verify balances after bridging
    final_l1_balance = await ethereum_wallet.get_balance()
    final_l2_balance = await l2_wallet.get_balance()
    
    assert final_l1_balance < initial_l1_balance  # Account for bridged amount + gas
    assert final_l2_balance > initial_l2_balance  # Should receive bridged amount

@pytest.mark.asyncio
async def test_bridge_erc20_to_l2(ethereum_wallet, l2_wallet):
    """Test bridging ERC20 tokens from mainnet to L2."""
    usdc_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    amount = 100.0
    
    # Get initial balances
    initial_l1_balance = await ethereum_wallet.get_balance(token_address=usdc_address)
    initial_l2_balance = await l2_wallet.get_balance(token_address=usdc_address)
    
    # Bridge tokens
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="arbitrum",
        amount=amount,
        token_address=usdc_address,
        wait_for_inclusion=True
    )
    
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")
    
    # Verify balances after bridging
    final_l1_balance = await ethereum_wallet.get_balance(token_address=usdc_address)
    final_l2_balance = await l2_wallet.get_balance(token_address=usdc_address)
    
    assert final_l1_balance == initial_l1_balance - amount
    assert final_l2_balance == initial_l2_balance + amount

@pytest.mark.asyncio
async def test_bridge_nft_to_l2(ethereum_wallet, l2_wallet):
    """Test bridging NFTs from mainnet to L2."""
    nft_address = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
    token_id = 1234
    
    # Verify NFT ownership before bridging
    initial_l1_owner = await ethereum_wallet.get_nft_owner(nft_address, token_id)
    assert initial_l1_owner == ethereum_wallet.address
    
    # Bridge NFT
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="polygon",
        token_address=nft_address,
        token_type=TokenType.ERC721,
        token_id=token_id,
        wait_for_inclusion=True
    )
    
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")
    
    # Verify ownership after bridging
    final_l2_owner = await l2_wallet.get_nft_owner(nft_address, token_id)
    assert final_l2_owner == l2_wallet.address

@pytest.mark.asyncio
async def test_bridge_batch_nfts_to_l2(ethereum_wallet, l2_wallet):
    """Test bridging multiple NFTs in a batch from mainnet to L2."""
    nft_address = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
    token_ids = [1234, 5678, 9012]
    
    # Bridge multiple NFTs
    tx_hashes = await ethereum_wallet.batch_bridge_nfts(
        to_network="polygon",
        token_address=nft_address,
        token_type=TokenType.ERC721,
        token_ids=token_ids,
        wait_for_inclusion=True
    )
    
    assert isinstance(tx_hashes, list)
    assert all(tx.startswith("0x") for tx in tx_hashes)
    
    # Verify ownership of all NFTs after bridging
    for token_id in token_ids:
        owner = await l2_wallet.get_nft_owner(nft_address, token_id)
        assert owner == l2_wallet.address

@pytest.mark.asyncio
async def test_bridge_error_handling():
    """Test error handling for various bridge scenarios."""
    wallet = EthereumHardwareWallet(network="mainnet")
    
    # Test invalid network
    with pytest.raises(BridgeError) as exc:
        await wallet.bridge_assets(
            to_network="invalid_network",
            amount=1.0
        )
    assert "Invalid network" in str(exc.value)
    
    # Test insufficient balance
    with pytest.raises(BridgeError) as exc:
        await wallet.bridge_assets(
            to_network="arbitrum",
            amount=999999.0  # Very large amount
        )
    assert "Insufficient balance" in str(exc.value)
    
    # Test invalid token address
    with pytest.raises(BridgeError) as exc:
        await wallet.bridge_assets(
            to_network="optimism",
            amount=100.0,
            token_address="0xinvalid"
        )
    assert "Invalid token address" in str(exc.value)

@pytest.mark.asyncio
async def test_bridge_transaction_monitoring():
    """Test transaction monitoring and status updates during bridging."""
    wallet = EthereumHardwareWallet(network="mainnet")
    
    # Mock transaction monitoring
    with patch.object(wallet, '_monitor_transaction', new_callable=AsyncMock) as mock_monitor:
        mock_monitor.return_value = {
            "status": "confirmed",
            "block_number": 12345678,
            "gas_used": 150000,
            "effective_gas_price": 20000000000
        }
        
        tx_hash = await wallet.bridge_assets(
            to_network="arbitrum",
            amount=0.1,
            wait_for_inclusion=True
        )
        
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")
        mock_monitor.assert_called_once_with(tx_hash)

@pytest.mark.asyncio
async def test_bridge_gas_estimation():
    """Test gas estimation for different bridge operations."""
    wallet = EthereumHardwareWallet(network="mainnet")
    
    # Test ETH bridge gas estimation
    gas = await wallet.estimate_bridge_gas(
        to_network="arbitrum",
        amount=1.0
    )
    assert isinstance(gas, int)
    assert gas > 0
    
    # Test ERC20 bridge gas estimation
    usdc_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    gas = await wallet.estimate_bridge_gas(
        to_network="optimism",
        amount=100.0,
        token_address=usdc_address
    )
    assert isinstance(gas, int)
    assert gas > 0
    
    # Test NFT bridge gas estimation
    nft_address = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
    gas = await wallet.estimate_bridge_gas(
        to_network="polygon",
        token_address=nft_address,
        token_type=TokenType.ERC721,
        token_id=1234
    )
    assert isinstance(gas, int)
    assert gas > 0 