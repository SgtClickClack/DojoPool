import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from decimal import Decimal
from dojopool.core.blockchain.hardware_wallet import EthereumHardwareWallet, TokenType, BridgeProtocol
from dojopool.core.exceptions import WalletError, BlockchainError, BridgeError, NetworkError

@pytest.fixture
async def ethereum_wallet():
    wallet = EthereumHardwareWallet(network="mainnet")
    await wallet.connect()
    yield wallet
    if wallet.is_connected:
        await wallet.disconnect()

@pytest.mark.asyncio
async def test_nft_bridge_fee_estimation():
    """Test NFT bridge fee estimation across different networks."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    networks = ["zksync_era", "starknet", "linea", "scroll"]
    estimates = {}
    
    for network in networks:
        quote = await wallet.get_nft_bridge_quote(
            to_network=network,
            token_address=token_address,
            token_id=token_id
        )
        estimates[network] = quote
        
        assert isinstance(quote.estimated_gas, int)
        assert isinstance(quote.bridge_fee, Decimal)
        assert isinstance(quote.estimated_time, int)
        assert quote.bridge_fee > 0

@pytest.mark.asyncio
async def test_nft_bridge_fee_comparison():
    """Test comparing NFT bridge fees across different protocols."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    to_network = "arbitrum"
    
    protocols = [BridgeProtocol.HOP, BridgeProtocol.ACROSS, BridgeProtocol.CONNEXT]
    quotes = {}
    
    for protocol in protocols:
        quote = await wallet.get_nft_bridge_quote(
            to_network=to_network,
            token_address=token_address,
            token_id=token_id,
            protocol=protocol
        )
        quotes[protocol] = quote
        
        assert isinstance(quote.estimated_gas, int)
        assert isinstance(quote.bridge_fee, Decimal)
        assert isinstance(quote.estimated_time, int)
        assert quote.protocol == protocol

    # Verify each protocol has different fees/times
    fees = [quote.bridge_fee for quote in quotes.values()]
    times = [quote.estimated_time for quote in quotes.values()]
    assert len(set(fees)) == len(protocols)
    assert len(set(times)) == len(protocols)

@pytest.mark.asyncio
async def test_nft_bridge_gas_price_impact():
    """Test NFT bridge fee estimation during gas price fluctuations."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Mock gas price spike scenario
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._get_gas_price",
              side_effect=[100000000000, 50000000000]):  # 100 gwei, then 50 gwei
        
        # Get quote during high gas
        high_gas_quote = await wallet.get_nft_bridge_quote(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id
        )
        
        # Get quote during lower gas
        low_gas_quote = await wallet.get_nft_bridge_quote(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id
        )
        
        assert high_gas_quote.bridge_fee > low_gas_quote.bridge_fee
        assert high_gas_quote.estimated_gas == low_gas_quote.estimated_gas  # Gas limit should be same

@pytest.mark.asyncio
async def test_nft_bridge_batch_fee_estimation():
    """Test fee estimation for batch NFT bridging."""
    wallet = EthereumHardwareWallet(network="mainnet")
    nfts = [
        {"token_address": "0x123...", "token_id": 1},
        {"token_address": "0x123...", "token_id": 2},
        {"token_address": "0x123...", "token_id": 3}
    ]
    
    # Get individual quotes
    individual_quotes = []
    for nft in nfts:
        quote = await wallet.get_nft_bridge_quote(
            to_network="zksync_era",
            token_address=nft["token_address"],
            token_id=nft["token_id"]
        )
        individual_quotes.append(quote)
    
    # Get batch quote
    batch_quote = await wallet.get_nft_bridge_batch_quote(
        to_network="zksync_era",
        nfts=nfts
    )
    
    # Batch should be more gas efficient
    assert batch_quote.bridge_fee < sum(q.bridge_fee for q in individual_quotes)
    assert batch_quote.estimated_gas < sum(q.estimated_gas for q in individual_quotes)

@pytest.mark.asyncio
async def test_nft_bridge_quote_caching():
    """Test NFT bridge quote caching and invalidation."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Get initial quote
    initial_quote = await wallet.get_nft_bridge_quote(
        to_network="zksync_era",
        token_address=token_address,
        token_id=token_id
    )
    
    # Get cached quote (should be same object)
    cached_quote = await wallet.get_nft_bridge_quote(
        to_network="zksync_era",
        token_address=token_address,
        token_id=token_id
    )
    
    assert initial_quote is cached_quote  # Should be same object (cached)
    
    # Wait for cache invalidation
    await asyncio.sleep(60)  # Cache TTL
    
    # Get new quote (should be different object)
    new_quote = await wallet.get_nft_bridge_quote(
        to_network="zksync_era",
        token_address=token_address,
        token_id=token_id
    )
    
    assert new_quote is not initial_quote  # Should be different object (cache invalid)

@pytest.mark.asyncio
async def test_nft_bridge_quote_with_royalties():
    """Test NFT bridge fee estimation including royalty calculations."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Mock royalty info
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._check_nft_royalties",
              return_value={"percentage": 2.5, "recipient": "0x789..."}):
        
        # Get quote with royalties
        quote_with_royalties = await wallet.get_nft_bridge_quote(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id,
            include_royalties=True
        )
        
        # Get quote without royalties
        quote_without_royalties = await wallet.get_nft_bridge_quote(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id,
            include_royalties=False
        )
        
        assert quote_with_royalties.bridge_fee > quote_without_royalties.bridge_fee
        assert quote_with_royalties.royalty_fee > 0
        assert quote_without_royalties.royalty_fee == 0

@pytest.mark.asyncio
async def test_nft_bridge_quote_with_protocol_fallback():
    """Test NFT bridge quote with protocol fallback options."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Mock primary protocol failure
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._get_protocol_quote",
              side_effect=[BridgeError("Protocol unavailable"), {"estimated_gas": 100000, "bridge_fee": Decimal("0.01")}]):
        
        quote = await wallet.get_nft_bridge_quote(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id,
            protocol=BridgeProtocol.HOP,
            fallback_protocol=BridgeProtocol.ACROSS
        )
        
        assert quote.protocol == BridgeProtocol.ACROSS  # Should fall back to ACROSS
        assert isinstance(quote.estimated_gas, int)
        assert isinstance(quote.bridge_fee, Decimal)

@pytest.mark.asyncio
async def test_nft_bridge_quote_with_l2_data():
    """Test NFT bridge quote including L2 specific data."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    quote = await wallet.get_nft_bridge_quote(
        to_network="zksync_era",
        token_address=token_address,
        token_id=token_id,
        include_l2_data=True
    )
    
    # Verify L2 specific data
    assert "l2_gas_price" in quote.l2_data
    assert "l2_gas_per_pubdata_byte" in quote.l2_data
    assert isinstance(quote.l2_data["l2_gas_price"], int)
    assert isinstance(quote.l2_data["estimated_l2_gas"], int) 