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
async def test_nft_bridge_approval_recovery():
    """Test recovery from NFT approval failures."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Mock approval failure
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._approve_nft",
              side_effect=[BlockchainError("Approval failed"), AsyncMock(return_value="0x456...")]):
        
        # First attempt should fail
        with pytest.raises(BlockchainError):
            await wallet.bridge_nft(
                to_network="zksync_era",
                token_address=token_address,
                token_id=token_id,
                wait_for_inclusion=True
            )
        
        # Retry should succeed
        tx_hash = await wallet.bridge_nft(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id,
            wait_for_inclusion=True
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_nft_bridge_ownership_verification_recovery():
    """Test recovery from NFT ownership verification failures."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Mock ownership verification failure then success
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._verify_nft_ownership",
              side_effect=[NetworkError("Failed to verify ownership"), True]):
        
        # First attempt should fail
        with pytest.raises(NetworkError):
            await wallet.bridge_nft(
                to_network="zksync_era",
                token_address=token_address,
                token_id=token_id
            )
        
        # Retry should succeed
        tx_hash = await wallet.bridge_nft(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_nft_bridge_metadata_recovery():
    """Test recovery from NFT metadata retrieval failures."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Mock metadata retrieval failure then success
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._get_nft_metadata",
              side_effect=[NetworkError("IPFS timeout"), {"name": "Test NFT", "image": "ipfs://..."}]):
        
        # First attempt should fail
        with pytest.raises(NetworkError):
            await wallet.bridge_nft(
                to_network="zksync_era",
                token_address=token_address,
                token_id=token_id
            )
        
        # Retry should succeed
        tx_hash = await wallet.bridge_nft(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_nft_bridge_batch_recovery():
    """Test recovery from batch NFT bridging failures."""
    wallet = EthereumHardwareWallet(network="mainnet")
    nfts = [
        {"token_address": "0x123...", "token_id": 1},
        {"token_address": "0x123...", "token_id": 2},
        {"token_address": "0x123...", "token_id": 3}
    ]
    
    # Mock batch bridging with partial failure
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._bridge_nft_batch",
              side_effect=[BlockchainError("Batch failed"), AsyncMock(return_value=["0x789...", "0x790...", "0x791..."])]):
        
        # First attempt should fail
        with pytest.raises(BlockchainError):
            await wallet.bridge_nft_batch(
                to_network="zksync_era",
                nfts=nfts,
                wait_for_inclusion=True
            )
        
        # Retry should succeed
        tx_hashes = await wallet.bridge_nft_batch(
            to_network="zksync_era",
            nfts=nfts,
            wait_for_inclusion=True
        )
        assert len(tx_hashes) == len(nfts)
        assert all(tx.startswith("0x") for tx in tx_hashes)

@pytest.mark.asyncio
async def test_nft_bridge_royalty_check_recovery():
    """Test recovery from NFT royalty check failures."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Mock royalty check failure then success
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._check_nft_royalties",
              side_effect=[NetworkError("Failed to check royalties"), {"percentage": 2.5, "recipient": "0x789..."}]):
        
        # First attempt should fail
        with pytest.raises(NetworkError):
            await wallet.bridge_nft(
                to_network="zksync_era",
                token_address=token_address,
                token_id=token_id,
                check_royalties=True
            )
        
        # Retry should succeed
        tx_hash = await wallet.bridge_nft(
            to_network="zksync_era",
            token_address=token_address,
            token_id=token_id,
            check_royalties=True
        )
        assert isinstance(tx_hash, str)
        assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_nft_bridge_protocol_specific_recovery():
    """Test recovery from protocol-specific NFT bridging failures."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Test recovery for each protocol
    for protocol in [BridgeProtocol.HOP, BridgeProtocol.ACROSS, BridgeProtocol.CONNEXT]:
        # Mock protocol-specific failure then success
        with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet._bridge_nft_with_protocol",
                  side_effect=[BridgeError(f"{protocol} bridge error"), AsyncMock(return_value="0x123...")]):
            
            # First attempt should fail
            with pytest.raises(BridgeError):
                await wallet.bridge_nft(
                    to_network="zksync_era",
                    token_address=token_address,
                    token_id=token_id,
                    protocol=protocol
                )
            
            # Retry should succeed
            tx_hash = await wallet.bridge_nft(
                to_network="zksync_era",
                token_address=token_address,
                token_id=token_id,
                protocol=protocol
            )
            assert isinstance(tx_hash, str)
            assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_nft_bridge_l2_confirmation_recovery():
    """Test recovery from L2 NFT confirmation failures."""
    wallet = EthereumHardwareWallet(network="mainnet")
    token_address = "0x123..."
    token_id = 1
    
    # Bridge NFT successfully
    tx_hash = await wallet.bridge_nft(
        to_network="zksync_era",
        token_address=token_address,
        token_id=token_id,
        wait_for_inclusion=True
    )
    
    # Mock L2 confirmation failures
    with patch("dojopool.core.blockchain.hardware_wallet.EthereumHardwareWallet.wait_for_l2_nft_confirmation",
              side_effect=[NetworkError("L2 node error"), {"status": 1, "token_id": token_id}]):
        
        # First attempt to confirm should fail
        with pytest.raises(NetworkError):
            await wallet.wait_for_l2_nft_confirmation(
                tx_hash,
                network="zksync_era",
                token_address=token_address,
                token_id=token_id
            )
        
        # Retry should succeed
        l2_receipt = await wallet.wait_for_l2_nft_confirmation(
            tx_hash,
            network="zksync_era",
            token_address=token_address,
            token_id=token_id
        )
        assert l2_receipt["status"] == 1
        assert l2_receipt["token_id"] == token_id 