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
async def test_bridge_network_failure_recovery():
    """Test recovery from network failures during bridging."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Mock network failure during bridge quote
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote",
              side_effect=[NetworkError("Network timeout"), AsyncMock(return_value={"estimated_gas": 100000, "bridge_fee": Decimal("0.001")})]):
        
        # First attempt should fail
        with pytest.raises(NetworkError):
            await wallet.get_bridge_quote(
                to_network="zksync_era",
                amount=amount
            )
        
        # Retry should succeed
        quote = await wallet.get_bridge_quote(
            to_network="zksync_era",
            amount=amount
        )
        assert isinstance(quote.estimated_gas, int)
        assert isinstance(quote.bridge_fee, Decimal)

@pytest.mark.asyncio
async def test_bridge_transaction_failure_recovery():
    """Test recovery from transaction failures during bridging."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Mock transaction failure
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets",
              side_effect=[BlockchainError("Transaction reverted"), AsyncMock(return_value="0x123...")]):
        
        # First attempt should fail
        with pytest.raises(BlockchainError):
            await wallet.bridge_assets(
                to_network="zksync_era",
                amount=amount,
                wait_for_inclusion=True
            )
        
        # Retry should succeed
        tx_hash = await wallet.bridge_assets(
            to_network="zksync_era",
            amount=amount,
            wait_for_inclusion=True
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_bridge_insufficient_balance_recovery():
    """Test recovery from insufficient balance errors."""
    wallet = EthereumHardwareWallet(network="mainnet")
    large_amount = 1000.0  # Amount larger than balance
    
    # Mock balance check and bridge operation
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_balance",
              return_value=Decimal("0.5")):
        
        # Should fail due to insufficient balance
        with pytest.raises(WalletError) as exc_info:
            await wallet.bridge_assets(
                to_network="zksync_era",
                amount=large_amount,
                wait_for_inclusion=True
            )
        assert "Insufficient balance" in str(exc_info.value)
        
        # Retry with appropriate amount should succeed
        tx_hash = await wallet.bridge_assets(
            to_network="zksync_era",
            amount=0.1,
            wait_for_inclusion=True
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_bridge_nonce_mismatch_recovery():
    """Test recovery from nonce mismatch errors."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Mock nonce mismatch error
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets",
              side_effect=[BlockchainError("Nonce too low"), AsyncMock(return_value="0x123...")]):
        
        # First attempt should fail
        with pytest.raises(BlockchainError) as exc_info:
            await wallet.bridge_assets(
                to_network="zksync_era",
                amount=amount,
                wait_for_inclusion=True
            )
        assert "Nonce too low" in str(exc_info.value)
        
        # Retry with updated nonce should succeed
        tx_hash = await wallet.bridge_assets(
            to_network="zksync_era",
            amount=amount,
            wait_for_inclusion=True
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_bridge_gas_price_spike_recovery():
    """Test recovery from gas price spike errors."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Mock gas price spike scenario
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote") as mock_quote:
        mock_quote.side_effect = [
            {"estimated_gas": 100000, "bridge_fee": Decimal("1.0")},  # High gas price
            {"estimated_gas": 100000, "bridge_fee": Decimal("0.001")}  # Normal gas price
        ]
        
        # First attempt should be rejected due to high gas
        quote = await wallet.get_bridge_quote(
            to_network="zksync_era",
            amount=amount
        )
        assert quote.bridge_fee > Decimal("0.5")  # Too expensive
        
        # Retry later when gas price is lower
        quote = await wallet.get_bridge_quote(
            to_network="zksync_era",
            amount=amount
        )
        assert quote.bridge_fee < Decimal("0.01")  # Acceptable
        
        # Bridge operation should succeed
        tx_hash = await wallet.bridge_assets(
            to_network="zksync_era",
            amount=amount,
            wait_for_inclusion=True
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_bridge_timeout_recovery():
    """Test recovery from timeout errors during bridging."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Mock timeout during bridge operation
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets",
              side_effect=[asyncio.TimeoutError, AsyncMock(return_value="0x123...")]):
        
        # First attempt should timeout
        with pytest.raises(asyncio.TimeoutError):
            await wallet.bridge_assets(
                to_network="zksync_era",
                amount=amount,
                wait_for_inclusion=True,
                timeout=1  # Short timeout for testing
            )
        
        # Retry with longer timeout should succeed
        tx_hash = await wallet.bridge_assets(
            to_network="zksync_era",
            amount=amount,
            wait_for_inclusion=True,
            timeout=30  # Longer timeout
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_bridge_l2_confirmation_recovery():
    """Test recovery from L2 confirmation failures."""
    wallet = EthereumHardwareWallet(network="mainnet")
    amount = 0.1
    
    # Successfully bridge assets
    tx_hash = await wallet.bridge_assets(
        to_network="zksync_era",
        amount=amount,
        wait_for_inclusion=True
    )
    
    # Mock L2 confirmation failures
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.wait_for_l2_confirmation",
              side_effect=[NetworkError("L2 node error"), {"status": 1}]):
        
        # First attempt to confirm should fail
        with pytest.raises(NetworkError):
            await wallet.wait_for_l2_confirmation(
                tx_hash,
                network="zksync_era"
            )
        
        # Retry should succeed
        l2_receipt = await wallet.wait_for_l2_confirmation(
            tx_hash,
            network="zksync_era"
        )
        assert l2_receipt["status"] == 1 