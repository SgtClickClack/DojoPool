import pytest
from unittest.mock import Mock, patch
from dojopool.core.blockchain.hardware_wallet import SolanaHardwareWallet, EthereumHardwareWallet
from dojopool.core.exceptions import WalletError, BlockchainError

@pytest.fixture
async def solana_wallet():
    wallet = SolanaHardwareWallet()
    await wallet.connect()
    yield wallet
    if wallet.is_connected:
        await wallet.disconnect()

@pytest.fixture
async def ethereum_wallet():
    wallet = EthereumHardwareWallet()
    await wallet.connect()
    yield wallet
    if wallet.is_connected:
        await wallet.disconnect()

@pytest.mark.asyncio
async def test_solana_wallet_connection():
    wallet = SolanaHardwareWallet()
    assert not wallet.is_connected
    assert wallet.device_info is None
    
    connected = await wallet.connect()
    assert connected
    assert wallet.is_connected
    assert wallet.device_info["type"] == "Solana"
    assert wallet.device_info["protocol"] == "USB HID"

@pytest.mark.asyncio
async def test_ethereum_wallet_connection():
    wallet = EthereumHardwareWallet()
    assert not wallet.is_connected
    assert wallet.device_info is None
    
    connected = await wallet.connect()
    assert connected
    assert wallet.is_connected
    assert wallet.device_info["type"] == "Ethereum"
    assert wallet.device_info["protocol"] == "USB HID"

@pytest.mark.asyncio
async def test_wallet_connection_failure():
    with patch.object(SolanaHardwareWallet, 'connect', side_effect=BlockchainError("Connection failed")):
        wallet = SolanaHardwareWallet()
        with pytest.raises(BlockchainError) as exc:
            await wallet.connect()
        assert "Connection failed" in str(exc.value)
        assert not wallet.is_connected

@pytest.mark.asyncio
async def test_solana_wallet_operations(solana_wallet):
    # Test get_address
    address = await solana_wallet.get_address()
    assert isinstance(address, str)
    assert address == "EXAMPLE_SOLANA_ADDRESS"
    
    # Test get_balance
    balance = await solana_wallet.get_balance()
    assert isinstance(balance, float)
    
    # Test sign_transaction
    tx = {"type": "transfer", "amount": 1.0}
    signature = await solana_wallet.sign_transaction(tx)
    assert isinstance(signature, str)
    
    # Test transfer
    tx_hash = await solana_wallet.transfer("DEST_ADDRESS", 1.0)
    assert isinstance(tx_hash, str)

@pytest.mark.asyncio
async def test_ethereum_wallet_operations(ethereum_wallet):
    # Test get_address
    address = await ethereum_wallet.get_address()
    assert isinstance(address, str)
    assert address.startswith("0x")
    
    # Test get_balance
    balance = await ethereum_wallet.get_balance(token="ETH")
    assert isinstance(balance, float)
    
    # Test sign_transaction
    tx = {"type": "transfer", "amount": 1.0}
    signature = await ethereum_wallet.sign_transaction(tx)
    assert isinstance(signature, str)
    assert signature.startswith("0x")
    
    # Test transfer
    tx_hash = await ethereum_wallet.transfer("0xDEST_ADDRESS", 1.0, token="ETH")
    assert isinstance(tx_hash, str)
    assert tx_hash.startswith("0x")

@pytest.mark.asyncio
async def test_wallet_validation_errors(solana_wallet):
    # Test operations without connection
    wallet = SolanaHardwareWallet()
    with pytest.raises(WalletError) as exc:
        await wallet.get_address()
    assert "not connected" in str(exc.value)
    
    # Test invalid amount
    with pytest.raises(WalletError) as exc:
        await solana_wallet.transfer("DEST_ADDRESS", -1.0)
    assert "must be positive" in str(exc.value)

@pytest.mark.asyncio
async def test_wallet_disconnect():
    wallet = SolanaHardwareWallet()
    await wallet.connect()
    assert wallet.is_connected
    
    success = await wallet.disconnect()
    assert success
    assert not wallet.is_connected
    assert wallet.device_info is None

@pytest.mark.asyncio
async def test_wallet_disconnect_failure():
    with patch.object(SolanaHardwareWallet, 'disconnect', side_effect=BlockchainError("Disconnect failed")):
        wallet = SolanaHardwareWallet()
        await wallet.connect()
        with pytest.raises(BlockchainError) as exc:
            await wallet.disconnect()
        assert "Disconnect failed" in str(exc.value) 