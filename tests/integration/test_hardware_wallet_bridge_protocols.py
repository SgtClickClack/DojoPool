import pytest
from unittest.mock import Mock, patch, AsyncMock
from decimal import Decimal
from dojopool.core.blockchain.hardware_wallet import EthereumHardwareWallet, TokenType, BridgeProtocol
from dojopool.core.exceptions import WalletError, BlockchainError, BridgeError

@pytest.fixture
async def ethereum_wallet():
    wallet = EthereumHardwareWallet(network="mainnet")
    await wallet.connect()
    yield wallet
    if wallet.is_connected:
        await wallet.disconnect()

@pytest.mark.asyncio
async def test_hop_protocol_eth_bridge():
    """Test ETH bridging using Hop protocol."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Get bridge quote
    quote = await wallet.get_bridge_quote(
        to_network="arbitrum",
        amount=amount,
        protocol=BridgeProtocol.HOP
    )
    assert isinstance(quote.estimated_gas, int)
    assert isinstance(quote.bridge_fee, Decimal)
    assert quote.protocol == BridgeProtocol.HOP
    
    # Bridge ETH
    tx_hash = await wallet.bridge_assets(
        to_network="arbitrum",
        amount=amount,
        protocol=BridgeProtocol.HOP,
        wait_for_inclusion=True
    )
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_across_protocol_token_bridge():
    """Test token bridging using Across protocol."""
    wallet = EthereumHardwareWallet(network="mainnet")
    usdc_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    amount = 100.0
    
    # Get bridge quote
    quote = await wallet.get_bridge_quote(
        to_network="optimism",
        amount=amount,
        token_address=usdc_address,
        protocol=BridgeProtocol.ACROSS
    )
    assert isinstance(quote.estimated_gas, int)
    assert isinstance(quote.bridge_fee, Decimal)
    assert quote.protocol == BridgeProtocol.ACROSS
    
    # Bridge tokens
    tx_hash = await wallet.bridge_assets(
        to_network="optimism",
        amount=amount,
        token_address=usdc_address,
        protocol=BridgeProtocol.ACROSS,
        wait_for_inclusion=True
    )
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_connext_protocol_bridge():
    """Test bridging using Connext protocol."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Get bridge quote
    quote = await wallet.get_bridge_quote(
        to_network="polygon",
        amount=amount,
        protocol=BridgeProtocol.CONNEXT
    )
    assert isinstance(quote.estimated_gas, int)
    assert isinstance(quote.bridge_fee, Decimal)
    assert quote.protocol == BridgeProtocol.CONNEXT
    
    # Bridge ETH
    tx_hash = await wallet.bridge_assets(
        to_network="polygon",
        amount=amount,
        protocol=BridgeProtocol.CONNEXT,
        wait_for_inclusion=True
    )
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_protocol_comparison():
    """Test comparing different bridge protocols for the same operation."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    to_network = "arbitrum"
    
    protocols = [BridgeProtocol.HOP, BridgeProtocol.ACROSS, BridgeProtocol.CONNEXT]
    quotes = {}
    
    # Get quotes from all protocols
    for protocol in protocols:
        quote = await wallet.get_bridge_quote(
            to_network=to_network,
            amount=amount,
            protocol=protocol
        )
        quotes[protocol] = quote
    
    # Verify each protocol returned different fees/times
    fees = [quote.bridge_fee for quote in quotes.values()]
    times = [quote.estimated_time for quote in quotes.values()]
    assert len(set(fees)) == len(protocols)  # Each protocol should have unique fees
    assert len(set(times)) == len(protocols)  # Each protocol should have unique times

@pytest.mark.asyncio
async def test_protocol_specific_errors():
    """Test error handling for protocol-specific issues."""
    wallet = EthereumHardwareWallet(network="mainnet")
    
    # Test protocol not supported for network
    with pytest.raises(BridgeError) as exc:
        await wallet.bridge_assets(
            to_network="starknet",  # Hop doesn't support StarkNet
            amount=0.1,
            protocol=BridgeProtocol.HOP
        )
    assert "Protocol not supported" in str(exc.value)
    
    # Test protocol not supported for token
    with pytest.raises(BridgeError) as exc:
        await wallet.bridge_assets(
            to_network="arbitrum",
            amount=100.0,
            token_address="0xinvalid",
            protocol=BridgeProtocol.ACROSS
        )
    assert "Token not supported" in str(exc.value)
    
    # Test protocol liquidity issues
    with pytest.raises(BridgeError) as exc:
        await wallet.bridge_assets(
            to_network="optimism",
            amount=999999.0,  # Very large amount
            protocol=BridgeProtocol.CONNEXT
        )
    assert "Insufficient liquidity" in str(exc.value)

@pytest.mark.asyncio
async def test_protocol_fallback():
    """Test protocol fallback mechanism when primary protocol fails."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Mock primary protocol failure
    with patch.object(wallet, '_bridge_with_protocol', side_effect=[BridgeError("Protocol unavailable"), "0xsuccess"]):
        tx_hash = await wallet.bridge_assets(
            to_network="arbitrum",
            amount=amount,
            protocol=BridgeProtocol.HOP,
            fallback_protocol=BridgeProtocol.ACROSS,
            wait_for_inclusion=True
        )
        assert tx_hash == "0xsuccess"

@pytest.mark.asyncio
async def test_protocol_status_check():
    """Test protocol status checking before bridging."""
    wallet = EthereumHardwareWallet(network="mainnet")
    
    # Check Hop protocol status
    hop_status = await wallet.check_protocol_status(BridgeProtocol.HOP)
    assert isinstance(hop_status.is_active, bool)
    assert isinstance(hop_status.current_liquidity, dict)
    
    # Check Across protocol status
    across_status = await wallet.check_protocol_status(BridgeProtocol.ACROSS)
    assert isinstance(across_status.is_active, bool)
    assert isinstance(across_status.current_liquidity, dict)
    
    # Check Connext protocol status
    connext_status = await wallet.check_protocol_status(BridgeProtocol.CONNEXT)
    assert isinstance(connext_status.is_active, bool)
    assert isinstance(connext_status.current_liquidity, dict) 