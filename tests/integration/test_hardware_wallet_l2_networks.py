import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from decimal import Decimal
from dojopool.core.blockchain.hardware_wallet import (
    EthereumHardwareWallet,
    TokenType,
    BridgeProtocol,
    BRIDGE_CONFIGS
)
from dojopool.core.exceptions import WalletError, BlockchainError, BridgeError, NetworkError
from typing import Dict, Any

# Configure pytest-asyncio
pytest.register_assert_rewrite('pytest_asyncio')

# Mock responses for consistent testing
MOCK_BRIDGE_QUOTE = {
    "estimated_gas": 150000,
    "gas_price": 50000000000,  # 50 gwei
    "total_cost_wei": 7500000000000,  # 0.0075 ETH
    "bridge_fee": Decimal("0.001"),
    "estimated_time": 600,  # 10 minutes
}

MOCK_TX_HASH = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

MOCK_TX_RECEIPT = {
    "status": 1,
    "transactionHash": MOCK_TX_HASH,
    "blockNumber": 12345678,
    "gasUsed": 150000
}

MOCK_L2_STATUS = {
    "status": "confirmed",
    "block_number": 5000,
    "confirmations": 32
}

@pytest.fixture
async def ethereum_wallet():
    """Fixture to create a mocked Ethereum hardware wallet."""
    with patch("web3.Web3") as mock_web3:
        wallet = EthereumHardwareWallet(network="mainnet")
        wallet.web3 = MagicMock()
        wallet.address = "0x1234567890123456789012345678901234567890"
        wallet.sign_transaction = AsyncMock(return_value="0xsigned_transaction")
        wallet.get_bridge_quote = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
        wallet.get_balance = AsyncMock(return_value=1.0)
        yield wallet

async def test_bridge_to_zksync_era(ethereum_wallet):
    """Test bridging assets to zkSync Era."""
    # Mock gas estimation
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(return_value=MOCK_TX_RECEIPT)

    # Test bridging ETH
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="zksync_era",
        amount=0.1,
        wait_for_inclusion=True
    )

    assert isinstance(tx_hash, str)
    assert len(tx_hash) == 66  # Standard Ethereum tx hash length
    assert tx_hash.startswith("0x")

async def test_bridge_to_starknet(ethereum_wallet):
    """Test bridging assets to StarkNet."""
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(return_value=MOCK_TX_RECEIPT)

    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="starknet",
        amount=0.1,
        wait_for_inclusion=True
    )

    assert isinstance(tx_hash, str)
    assert len(tx_hash) == 66
    assert tx_hash.startswith("0x")

async def test_bridge_to_linea(ethereum_wallet):
    """Test bridging assets to Linea."""
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(return_value=MOCK_TX_RECEIPT)

    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="linea",
        amount=0.1,
        wait_for_inclusion=True
    )

    assert isinstance(tx_hash, str)
    assert len(tx_hash) == 66
    assert tx_hash.startswith("0x")

async def test_bridge_to_scroll(ethereum_wallet):
    """Test bridging assets to Scroll."""
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(return_value=MOCK_TX_RECEIPT)

    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="scroll",
        amount=0.1,
        wait_for_inclusion=True
    )

    assert isinstance(tx_hash, str)
    assert len(tx_hash) == 66
    assert tx_hash.startswith("0x")

async def test_bridge_token(ethereum_wallet):
    """Test bridging ERC20 tokens."""
    token_address = "0x1234567890123456789012345678901234567890"
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet._approve_token = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(return_value=MOCK_TX_RECEIPT)

    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="optimism",
        amount=100.0,
        token_address=token_address,
        wait_for_inclusion=True
    )

    assert isinstance(tx_hash, str)
    assert len(tx_hash) == 66
    assert tx_hash.startswith("0x")
    ethereum_wallet._approve_token.assert_called_once()

async def test_bridge_gas_estimation(ethereum_wallet):
    """Test bridge gas estimation."""
    ethereum_wallet.web3.eth.estimate_gas = AsyncMock(return_value=150000)
    ethereum_wallet.web3.eth.gas_price = AsyncMock(return_value=50000000000)

    estimate = await ethereum_wallet.estimate_bridge_gas(
        to_network="optimism",
        amount=1.0
    )

    assert isinstance(estimate, dict)
    assert "estimated_gas" in estimate
    assert "gas_price" in estimate
    assert "total_cost_wei" in estimate
    assert estimate["estimated_gas"] == 150000
    assert estimate["gas_price"] == 50000000000

async def test_bridge_errors(ethereum_wallet):
    """Test error handling in bridging operations."""
    # Test invalid network
    with pytest.raises(ValueError, match="Unsupported target network"):
        await ethereum_wallet.bridge_assets(
            to_network="invalid_network",
            amount=0.1
        )

    # Test failed transaction
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(
        return_value={"status": 0, "transactionHash": MOCK_TX_HASH}
    )

    with pytest.raises(ValueError, match="Bridge transaction failed"):
        await ethereum_wallet.bridge_assets(
            to_network="optimism",
            amount=0.1,
            wait_for_inclusion=True
        )

async def test_l2_status(ethereum_wallet):
    """Test checking L2 network status."""
    # Mock L2 status check
    ethereum_wallet.web3.eth.get_block = AsyncMock(return_value={
        "number": MOCK_L2_STATUS["block_number"],
        "confirmations": MOCK_L2_STATUS["confirmations"]
    })

    status = await ethereum_wallet.get_l2_status("optimism")
    assert isinstance(status, dict)
    assert status["block_number"] == MOCK_L2_STATUS["block_number"]
    assert status["confirmations"] == MOCK_L2_STATUS["confirmations"]

async def test_withdraw_from_l2(ethereum_wallet):
    """Test withdrawing assets from L2 back to L1."""
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(return_value=MOCK_TX_RECEIPT)

    tx_hash = await ethereum_wallet.withdraw_from_l2(
        from_network="optimism",
        amount=0.5,
        wait_for_inclusion=True
    )

    assert isinstance(tx_hash, str)
    assert len(tx_hash) == 66
    assert tx_hash.startswith("0x")

async def test_check_all_l2_networks(ethereum_wallet):
    """Test checking the status of all L2 networks."""
    # Mock network status checks
    ethereum_wallet.check_network_status = AsyncMock(return_value=True)
    
    # Test checking all networks
    network_statuses = await ethereum_wallet.check_all_l2_networks()
    assert isinstance(network_statuses, dict)
    assert all(isinstance(status, bool) for status in network_statuses.values())
    assert all(network in BRIDGE_CONFIGS for network in network_statuses.keys())

async def test_bridge_erc20_token(ethereum_wallet):
    """Test bridging ERC20 tokens to L2."""
    token_address = "0x1234567890123456789012345678901234567890"
    
    # Mock token approval and transfer
    ethereum_wallet.approve_token = AsyncMock(return_value="0xapproval_tx")
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(return_value=MOCK_TX_RECEIPT)
    
    # Test bridging ERC20
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="optimism",
        amount=100.0,
        token_address=token_address,
        wait_for_inclusion=True
    )
    
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")

async def test_withdraw_from_l2_to_l1(ethereum_wallet):
    """Test withdrawing assets from L2 back to L1."""
    # Mock withdrawal transaction
    ethereum_wallet.estimate_bridge_gas = AsyncMock(return_value=MOCK_BRIDGE_QUOTE)
    ethereum_wallet.web3.eth.send_raw_transaction = AsyncMock(return_value=MOCK_TX_HASH)
    ethereum_wallet.web3.eth.wait_for_transaction_receipt = AsyncMock(return_value=MOCK_TX_RECEIPT)
    
    # Test withdrawal
    tx_hash = await ethereum_wallet.withdraw_from_l2(
        from_network="arbitrum",
        amount=0.1,
        wait_for_inclusion=True
    )
    
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")

async def test_bridge_errors(ethereum_wallet):
    """Test error handling in bridging operations."""
    # Test invalid network
    with pytest.raises(NetworkError):
        await ethereum_wallet.bridge_assets(
            to_network="invalid_network",
            amount=0.1
        )
    
    # Test insufficient funds
    ethereum_wallet.get_balance = AsyncMock(return_value=0)
    with pytest.raises(WalletError):
        await ethereum_wallet.bridge_assets(
            to_network="optimism",
            amount=1.0
        )
    
    # Test bridge failure
    ethereum_wallet.estimate_bridge_gas = AsyncMock(side_effect=BridgeError("Bridge failure"))
    with pytest.raises(BridgeError):
        await ethereum_wallet.bridge_assets(
            to_network="arbitrum",
            amount=0.1
        )

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.check_l2_network_status")
async def test_check_all_l2_networks(mock_status, ethereum_wallet):
    """Test checking L2 network status with mocked responses."""
    mock_status.return_value = MOCK_L2_STATUS
    
    networks = ["zksync_era", "starknet", "linea", "scroll"]
    for network in networks:
        status = await ethereum_wallet.check_l2_network_status(network)
        assert isinstance(status, Dict)
        assert "is_healthy" in status
        assert "block_height" in status
        assert "sync_status" in status
        mock_status.assert_called_with(network)

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.withdraw_from_l2")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.wait_for_withdrawal")
async def test_withdraw_from_l2_to_l1(mock_wait, mock_withdraw, ethereum_wallet):
    """Test withdrawing assets from L2 back to L1 with mocked responses."""
    mock_withdraw.return_value = "0x" + "3" * 64
    mock_wait.return_value = {
        "processed": True,
        "ready_for_proof": True,
        "block_number": 12347
    }
    
    # Withdraw ETH from zkSync Era
    tx_hash = await ethereum_wallet.withdraw_from_l2(
        from_network="zksync_era",
        amount=0.05,
        wait_for_inclusion=True
    )
    assert isinstance(tx_hash, str)
    assert len(tx_hash) == 66
    
    # Wait for withdrawal to be processed
    status = await ethereum_wallet.wait_for_withdrawal(
        tx_hash=tx_hash,
        from_network="zksync_era",
        timeout=600
    )
    assert status["processed"]
    assert status["ready_for_proof"]

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets")
async def test_bridge_error_handling(mock_bridge, mock_quote, ethereum_wallet):
    """Test error handling for bridging operations."""
    with pytest.raises(BridgeError):
        await ethereum_wallet.bridge_assets(
            to_network="invalid_network",
            amount=0.1
        )
    
    with pytest.raises(BridgeError):
        await ethereum_wallet.bridge_assets(
            to_network="zksync_era",
            amount=-0.1
        )
    
    with pytest.raises(NetworkError):
        await ethereum_wallet.check_l2_network_status("invalid_network")

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets")
async def test_bridge_erc20_token(mock_bridge, mock_quote, ethereum_wallet):
    """Test bridging ERC20 tokens with mocked responses."""
    test_token_address = "0x6B175474E89094C44Da98b954EedeAC495271d0F"  # DAI
    
    mock_quote.return_value = {
        **MOCK_BRIDGE_QUOTE,
        "token_approval_needed": True
    }
    mock_bridge.return_value = "0x" + "4" * 64
    
    # Get bridge quote for ERC20
    quote = await ethereum_wallet.get_bridge_quote(
        to_network="zksync_era",
        amount=100.0,
        token_address=test_token_address
    )
    assert isinstance(quote["estimated_gas"], int)
    assert isinstance(quote["bridge_fee"], Decimal)
    assert quote["token_approval_needed"]
    
    # Bridge ERC20
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="zksync_era",
        amount=100.0,
        token_address=test_token_address,
        wait_for_inclusion=True
    )
    assert isinstance(tx_hash, str)
    assert len(tx_hash) == 66

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets")
async def test_bridge_to_arbitrum_nova(mock_bridge, mock_quote, ethereum_wallet):
    """Test bridging ETH to Arbitrum Nova."""
    # Get bridge quote
    quote = await ethereum_wallet.get_bridge_quote(
        to_network="arbitrum_nova",
        amount=Decimal("0.1"),
        token_address=None  # None for native ETH
    )
    assert isinstance(quote.estimated_gas, int)
    assert isinstance(quote.bridge_fee, Decimal)
    
    # Bridge ETH
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="arbitrum_nova",
        amount=Decimal("0.1"),
        wait_for_inclusion=True
    )
    assert isinstance(tx_hash, str) and len(tx_hash) == 66  # "0x" + 64 hex chars
    
    # Check L2 status
    status = await ethereum_wallet.get_l2_transaction_status(
        tx_hash=tx_hash,
        target_network="arbitrum_nova"
    )
    assert status in ["confirmed", "pending", "failed"]

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets")
async def test_bridge_to_zksync_lite(mock_bridge, mock_quote, ethereum_wallet):
    """Test bridging ETH to zkSync Lite."""
    # Get bridge quote
    quote = await ethereum_wallet.get_bridge_quote(
        to_network="zksync_lite",
        amount=Decimal("0.1")
    )
    assert quote.estimated_gas > 0
    assert quote.bridge_fee >= 0
    
    # Bridge ETH
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="zksync_lite",
        amount=Decimal("0.1"),
        wait_for_inclusion=True
    )
    assert tx_hash.startswith("0x")
    
    # Check L2 status
    status = await ethereum_wallet.get_l2_transaction_status(tx_hash, "zksync_lite")
    assert status in ["confirmed", "pending", "failed"]

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets")
async def test_bridge_to_metis(mock_bridge, mock_quote, ethereum_wallet):
    """Test bridging ETH to Metis Andromeda."""
    # Get bridge quote
    quote = await ethereum_wallet.get_bridge_quote(
        to_network="metis",
        amount=Decimal("0.1")
    )
    assert quote.estimated_gas > 0
    assert quote.bridge_fee >= 0
    
    # Bridge ETH
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="metis",
        amount=Decimal("0.1"),
        wait_for_inclusion=True
    )
    assert tx_hash.startswith("0x")
    
    # Check L2 status
    status = await ethereum_wallet.get_l2_transaction_status(tx_hash, "metis")
    assert status in ["confirmed", "pending", "failed"]

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets")
async def test_bridge_erc20_to_mantle(mock_bridge, mock_quote, ethereum_wallet):
    """Test bridging ERC20 tokens to Mantle."""
    test_token_address = "0x6B175474E89094C44Da98b954EedeAC495271d0F"  # DAI
    
    # Get bridge quote for ERC20
    quote = await ethereum_wallet.get_bridge_quote(
        to_network="mantle",
        amount=Decimal("100"),
        token_address=test_token_address
    )
    assert quote.estimated_gas > 0
    assert quote.bridge_fee >= 0
    
    # Bridge ERC20
    tx_hash = await ethereum_wallet.bridge_assets(
        to_network="mantle",
        amount=Decimal("100"),
        token_address=test_token_address,
        wait_for_inclusion=True
    )
    assert tx_hash.startswith("0x")
    
    # Check L2 status
    status = await ethereum_wallet.get_l2_transaction_status(tx_hash, "mantle")
    assert status in ["confirmed", "pending", "failed"]

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets")
async def test_l2_network_status(mock_bridge, mock_quote, ethereum_wallet):
    """Test checking L2 network status."""
    networks = ["arbitrum_nova", "zksync_lite", "metis", "mantle"]
    
    for network in networks:
        status = await ethereum_wallet.get_l2_network_status(network)
        assert isinstance(status, dict)
        assert "is_active" in status
        assert "block_height" in status
        assert "gas_price" in status

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.withdraw_from_l2")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.wait_for_withdrawal")
async def test_withdraw_from_l2(mock_wait, mock_withdraw, ethereum_wallet):
    """Test withdrawing assets from L2 back to L1."""
    # Test withdrawal from Arbitrum Nova
    tx_hash = await ethereum_wallet.withdraw_from_l2(
        from_network="arbitrum_nova",
        amount=Decimal("0.05"),
        wait_for_inclusion=True
    )
    assert tx_hash.startswith("0x")
    
    # Get withdrawal status
    status = await ethereum_wallet.get_withdrawal_status(
        tx_hash=tx_hash,
        from_network="arbitrum_nova"
    )
    assert status in ["initiated", "in_challenge_period", "ready_to_prove", "ready_to_finalize", "completed", "failed"]

@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.get_bridge_quote")
@patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.bridge_assets")
async def test_bridge_errors(mock_bridge, mock_quote, ethereum_wallet):
    """Test error handling for bridging operations."""
    # Test invalid network
    with pytest.raises(NetworkError):
        await ethereum_wallet.bridge_assets(
            to_network="invalid_network",
            amount=Decimal("0.1")
        )
    
    # Test insufficient balance
    with pytest.raises(BridgeError):
        await ethereum_wallet.bridge_assets(
            to_network="arbitrum_nova",
            amount=Decimal("1000000")  # Very large amount
        )
    
    # Test invalid token address
    with pytest.raises(BridgeError):
        await ethereum_wallet.bridge_assets(
            to_network="mantle",
            amount=Decimal("100"),
            token_address="0xinvalid"
        ) 