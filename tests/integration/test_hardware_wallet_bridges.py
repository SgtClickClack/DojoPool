import pytest
import asyncio
from decimal import Decimal
from unittest.mock import Mock, patch
from web3 import Web3

from dojopool.core.blockchain.hardware_wallet import (
    EthereumHardwareWallet,
    TokenType,
    BridgeProtocol,
    BridgeType,
    BlockchainError,
    NetworkError
)

# Test constants
TEST_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
TEST_TOKEN = "0x1234567890123456789012345678901234567890"
TEST_NFT = "0x9876543210987654321098765432109876543210"
TEST_TOKEN_ID = 123
TEST_AMOUNT = Decimal("1.0")

@pytest.fixture
async def ethereum_wallet():
    """Create a test Ethereum wallet instance."""
    wallet = EthereumHardwareWallet(network="goerli")
    # Mock connection and address
    wallet._connected = True
    wallet._device_info = {"type": "Trezor", "network": "goerli"}
    with patch.object(wallet, "get_address", return_value=TEST_ADDRESS):
        yield wallet

@pytest.mark.asyncio
async def test_bridge_quote_hop_protocol(ethereum_wallet):
    """Test getting bridge quote using Hop protocol."""
    with patch.object(ethereum_wallet, "_get_bridge_contract") as mock_contract:
        mock_contract.return_value.functions.getQuote.return_value.call.return_value = {
            "amountOut": Web3.to_wei(0.98, "ether"),
            "fee": Web3.to_wei(0.02, "ether"),
            "estimatedTime": 600,
            "slippage": 30  # 0.3%
        }
        
        quote = await ethereum_wallet.get_bridge_quote(
            from_token="0x0000000000000000000000000000000000000000",  # ETH
            to_token="0x0000000000000000000000000000000000000000",
            amount=1.0,
            bridge_protocol=BridgeProtocol.HOP,
            to_network="optimism"
        )
        
        assert isinstance(quote, dict)
        assert "amount_out" in quote
        assert "fee" in quote
        assert "estimated_time" in quote
        assert "slippage" in quote
        assert float(quote["amount_out"]) == 0.98
        assert float(quote["fee"]) == 0.02
        assert quote["estimated_time"] == 600
        assert quote["slippage"] == 0.003  # 0.3%

@pytest.mark.asyncio
async def test_bridge_assets_to_l2(ethereum_wallet):
    """Test bridging assets to L2 network."""
    with patch.object(ethereum_wallet, "get_bridge_quote") as mock_quote, \
         patch.object(ethereum_wallet, "_get_bridge_contract") as mock_contract, \
         patch.object(ethereum_wallet, "sign_transaction") as mock_sign, \
         patch.object(ethereum_wallet.web3.eth, "send_raw_transaction") as mock_send, \
         patch.object(ethereum_wallet.web3.eth, "wait_for_transaction_receipt") as mock_wait:
        # Mock quote response
        mock_quote.return_value = {
            "amount_out": 0.98,
            "fee": 0.02,
            "estimated_time": 600
        }
        
        # Mock transaction hash and receipt
        tx_hash = "0x1234"
        mock_send.return_value = Web3.to_bytes(hexstr=tx_hash)
        mock_wait.return_value = {"status": 1, "blockNumber": 1000}
        
        result = await ethereum_wallet.bridge_assets(
            to_network="optimism",
            amount=1.0,
            wait_for_inclusion=True
        )
        
        assert isinstance(result, dict)
        assert result["tx_hash"] == tx_hash
        assert result["from_network"] == "goerli"
        assert result["to_network"] == "optimism"
        assert result["status"] == "success"
        assert "explorer_url" in result

@pytest.mark.asyncio
async def test_bridge_nft_to_l2(ethereum_wallet):
    """Test bridging NFT to L2 network."""
    with patch.object(ethereum_wallet, "_get_contract") as mock_token_contract, \
         patch.object(ethereum_wallet, "_get_bridge_contract") as mock_bridge_contract, \
         patch.object(ethereum_wallet, "sign_transaction") as mock_sign, \
         patch.object(ethereum_wallet.web3.eth, "send_raw_transaction") as mock_send, \
         patch.object(ethereum_wallet.web3.eth, "wait_for_transaction_receipt") as mock_wait:
        # Mock NFT contract approval
        mock_token_contract.return_value.functions.getApproved.return_value.call.return_value = "0x0"
        
        # Mock transaction hash and receipt
        tx_hash = "0x5678"
        mock_send.return_value = Web3.to_bytes(hexstr=tx_hash)
        mock_wait.return_value = {"status": 1, "blockNumber": 1000}
        
        result = await ethereum_wallet.bridge_nft(
            to_network="arbitrum",
            token_address=TEST_NFT,
            token_id=TEST_TOKEN_ID,
            wait_for_inclusion=True
        )
        
        assert isinstance(result, dict)
        assert result["tx_hash"] == tx_hash
        assert result["from_network"] == "goerli"
        assert result["to_network"] == "arbitrum"
        assert result["token_address"] == TEST_NFT
        assert result["token_id"] == TEST_TOKEN_ID
        assert result["status"] == "success"
        assert "explorer_url" in result

@pytest.mark.asyncio
async def test_wait_for_l2_transaction(ethereum_wallet):
    """Test waiting for L2 transaction confirmation."""
    tx_hash = "0x1234"
    with patch.object(Web3, "HTTPProvider"), patch.object(Web3.eth, "get_transaction_receipt") as mock_receipt:
        mock_receipt.return_value = {
            "status": 1,
            "blockNumber": 1000,
            "gasUsed": 100000,
            "effectiveGasPrice": Web3.to_wei(1, "gwei")
        }
        
        result = await ethereum_wallet.wait_for_l2_transaction(
            tx_hash=tx_hash,
            target_network="optimism",
            timeout=10
        )
        
        assert isinstance(result, dict)
        assert result["confirmed"] is True
        assert result["block_number"] == 1000
        assert result["gas_used"] == 100000
        assert result["l2_network"] == "optimism"
        assert "explorer_url" in result

@pytest.mark.asyncio
async def test_check_l2_network_status(ethereum_wallet):
    """Test checking L2 network status."""
    with patch.object(ethereum_wallet.web3.eth, "get_block") as mock_block:
        mock_block.return_value = {"number": 1000}
        
        status = await ethereum_wallet.check_l2_network_status("optimism")
        assert status is True
        
        # Test invalid network
        with pytest.raises(NetworkError):
            await ethereum_wallet.check_l2_network_status("invalid_network")

@pytest.mark.asyncio
async def test_bridge_error_handling(ethereum_wallet):
    """Test error handling during bridging."""
    with patch.object(ethereum_wallet, "get_bridge_quote", side_effect=BlockchainError("Bridge error")):
        with pytest.raises(BlockchainError) as exc_info:
            await ethereum_wallet.bridge_assets(
                to_network="optimism",
                amount=1.0
            )
        assert "Bridge error" in str(exc_info.value)

@pytest.mark.asyncio
async def test_concurrent_bridge_operations(ethereum_wallet):
    """Test concurrent bridge operations."""
    async def bridge_operation(amount: float) -> dict:
        return await ethereum_wallet.bridge_assets(
            to_network="optimism",
            amount=amount,
            wait_for_inclusion=True
        )
    
    with patch.object(ethereum_wallet, "get_bridge_quote") as mock_quote, \
         patch.object(ethereum_wallet, "_get_bridge_contract"), \
         patch.object(ethereum_wallet, "sign_transaction"), \
         patch.object(ethereum_wallet.web3.eth, "send_raw_transaction"), \
         patch.object(ethereum_wallet.web3.eth, "wait_for_transaction_receipt"):
        mock_quote.return_value = {
            "amount_out": 0.98,
            "fee": 0.02,
            "estimated_time": 600
        }
        
        # Execute multiple bridge operations concurrently
        tasks = [
            bridge_operation(0.1),
            bridge_operation(0.2),
            bridge_operation(0.3)
        ]
        results = await asyncio.gather(*tasks)
        
        assert len(results) == 3
        assert all(isinstance(result, dict) for result in results)
        assert all(result["to_network"] == "optimism" for result in results) 