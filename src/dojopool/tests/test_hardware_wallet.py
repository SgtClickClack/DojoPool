import pytest
from unittest.mock import Mock, patch
from dojopool.core.blockchain.hardware import (
    HardwareWalletManager,
    LedgerWallet,
    TrezorWallet,
    BlockchainError
)

@pytest.fixture
def mock_ledger_dongle():
    with patch('ledgerblue.comm.getDongle') as mock_get_dongle:
        mock_dongle = Mock()
        mock_get_dongle.return_value = mock_dongle
        yield mock_dongle

@pytest.fixture
def mock_trezor_client():
    with patch('trezorlib.transport.get_transport') as mock_transport:
        mock_client = Mock()
        with patch('trezorlib.client.TrezorClient') as mock_trezor_client:
            mock_trezor_client.return_value = mock_client
            yield mock_client

class TestLedgerWallet:
    def test_init_success(self, mock_ledger_dongle):
        wallet = LedgerWallet()
        assert wallet.dongle == mock_ledger_dongle

    def test_init_failure(self, mock_ledger_dongle):
        mock_ledger_dongle.side_effect = Exception("Connection failed")
        with pytest.raises(BlockchainError) as exc_info:
            LedgerWallet()
        assert "Failed to connect to Ledger device" in str(exc_info.value)

    def test_get_addresses(self, mock_ledger_dongle):
        mock_ledger_dongle.exchange.return_value = bytes.fromhex("0123456789")
        wallet = LedgerWallet()
        addresses = wallet.get_addresses(start_index=0, count=2)
        assert len(addresses) == 2
        assert all(isinstance(addr, str) for addr in addresses)

    def test_sign_transaction(self, mock_ledger_dongle):
        mock_ledger_dongle.exchange.return_value = bytes.fromhex("0123456789")
        wallet = LedgerWallet()
        signature = wallet.sign_transaction({"nonce": 1, "to": "0x123"})
        assert isinstance(signature, str)
        assert len(signature) > 0

    def test_sign_message(self, mock_ledger_dongle):
        mock_ledger_dongle.exchange.return_value = bytes.fromhex("0123456789")
        wallet = LedgerWallet()
        signature = wallet.sign_message("Test message")
        assert isinstance(signature, str)
        assert len(signature) > 0

class TestTrezorWallet:
    def test_init_success(self, mock_trezor_client):
        wallet = TrezorWallet()
        assert wallet.client == mock_trezor_client

    def test_init_failure(self, mock_trezor_client):
        mock_trezor_client.side_effect = Exception("Connection failed")
        with pytest.raises(BlockchainError) as exc_info:
            TrezorWallet()
        assert "Failed to connect to Trezor device" in str(exc_info.value)

    def test_get_addresses(self, mock_trezor_client):
        mock_trezor_client.get_address.return_value = "0x123456789"
        wallet = TrezorWallet()
        addresses = wallet.get_addresses(start_index=0, count=2)
        assert len(addresses) == 2
        assert all(isinstance(addr, str) for addr in addresses)

    def test_sign_transaction(self, mock_trezor_client):
        mock_trezor_client.ethereum_sign_tx.return_value.hex.return_value = "0x123456789"
        wallet = TrezorWallet()
        signature = wallet.sign_transaction({"nonce": 1, "to": "0x123"})
        assert isinstance(signature, str)
        assert len(signature) > 0

    def test_sign_message(self, mock_trezor_client):
        mock_trezor_client.ethereum_sign_message.return_value.hex.return_value = "0x123456789"
        wallet = TrezorWallet()
        signature = wallet.sign_message("Test message")
        assert isinstance(signature, str)
        assert len(signature) > 0

class TestHardwareWalletManager:
    def test_get_ledger(self, mock_ledger_dongle):
        manager = HardwareWalletManager()
        ledger1 = manager.get_ledger()
        ledger2 = manager.get_ledger()
        assert isinstance(ledger1, LedgerWallet)
        assert ledger1 is ledger2  # Same instance

    def test_get_trezor(self, mock_trezor_client):
        manager = HardwareWalletManager()
        trezor1 = manager.get_trezor()
        trezor2 = manager.get_trezor()
        assert isinstance(trezor1, TrezorWallet)
        assert trezor1 is trezor2  # Same instance

    def test_close_all(self, mock_ledger_dongle, mock_trezor_client):
        manager = HardwareWalletManager()
        ledger = manager.get_ledger()
        trezor = manager.get_trezor()
        
        manager.close_all()
        assert manager._ledger is None
        assert manager._trezor is None 