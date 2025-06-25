import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.services.blockchain.EnhancedBlockchainService import EnhancedBlockchainService
from src.types.blockchain import NetworkType, TransactionStatus, NFTMetadata, BridgeQuote
from src.types.wallet import WalletInfo

class TestEnhancedBlockchainService:
    @pytest.fixture
    def service(self):
        return EnhancedBlockchainService()
    
    @pytest.fixture
    def mock_wallet_info(self):
        return WalletInfo(
            address="0x1234567890123456789012345678901234567890",
            network=NetworkType.ETHEREUM,
            balance=1000,
            isConnected=True
        )
    
    @pytest.fixture
    def mock_nft_metadata(self):
        return NFTMetadata(
            tokenId="1",
            name="Dojo Trophy #1",
            description="A legendary pool trophy",
            image="https://example.com/trophy1.png",
            attributes=[
                {"trait_type": "Rarity", "value": "Legendary"},
                {"trait_type": "Type", "value": "Territory Trophy"}
            ]
        )

    def test_init(self, service):
        """Test service initialization"""
        assert service.socket is None
        assert service.wallets == {}
        assert service.transactions == {}
        assert service.nft_marketplace == {}
        assert service.bridge_quotes == {}
        assert service.network_health == {}

    @patch('src.services.blockchain.EnhancedBlockchainService.socketio')
    def test_connect_socket(self, mock_socketio, service):
        """Test socket connection"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        
        service.connect_socket()
        
        assert service.socket == mock_socket
        mock_socketio.assert_called_once()

    def test_connect_wallet(self, service, mock_wallet_info):
        """Test connecting wallet"""
        wallet = service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        assert wallet.address == mock_wallet_info.address
        assert wallet.network == NetworkType.ETHEREUM
        assert wallet.isConnected is True
        assert mock_wallet_info.address in service.wallets

    def test_disconnect_wallet(self, service, mock_wallet_info):
        """Test disconnecting wallet"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        result = service.disconnect_wallet(mock_wallet_info.address)
        
        assert result is True
        assert mock_wallet_info.address not in service.wallets

    def test_disconnect_wallet_not_found(self, service):
        """Test disconnecting non-existent wallet"""
        result = service.disconnect_wallet("non-existent")
        assert result is False

    def test_get_wallet_balance(self, service, mock_wallet_info):
        """Test getting wallet balance"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        balance = service.get_wallet_balance(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        assert balance is not None
        assert balance > 0

    def test_get_wallet_balance_not_found(self, service):
        """Test getting balance for non-existent wallet"""
        balance = service.get_wallet_balance(
            address="non-existent",
            network=NetworkType.ETHEREUM
        )
        assert balance == 0

    def test_transfer_dojo_coins(self, service, mock_wallet_info):
        """Test transferring Dojo Coins"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        transaction = service.transfer_dojo_coins(
            from_address=mock_wallet_info.address,
            to_address="0x0987654321098765432109876543210987654321",
            amount=100,
            network=NetworkType.ETHEREUM
        )
        
        assert transaction.id is not None
        assert transaction.fromAddress == mock_wallet_info.address
        assert transaction.toAddress == "0x0987654321098765432109876543210987654321"
        assert transaction.amount == 100
        assert transaction.network == NetworkType.ETHEREUM
        assert transaction.id in service.transactions

    def test_transfer_dojo_coins_insufficient_balance(self, service, mock_wallet_info):
        """Test transferring Dojo Coins with insufficient balance"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        with pytest.raises(ValueError, match="Insufficient balance"):
            service.transfer_dojo_coins(
                from_address=mock_wallet_info.address,
                to_address="0x0987654321098765432109876543210987654321",
                amount=10000,
                network=NetworkType.ETHEREUM
            )

    def test_mint_nft(self, service, mock_wallet_info, mock_nft_metadata):
        """Test minting NFT"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        nft = service.mint_nft(
            to_address=mock_wallet_info.address,
            metadata=mock_nft_metadata,
            network=NetworkType.ETHEREUM
        )
        
        assert nft.tokenId == mock_nft_metadata.tokenId
        assert nft.name == mock_nft_metadata.name
        assert nft.owner == mock_wallet_info.address
        assert nft.network == NetworkType.ETHEREUM

    def test_get_nft_balance(self, service, mock_wallet_info):
        """Test getting NFT balance"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        # Mint an NFT first
        metadata = NFTMetadata(
            tokenId="1",
            name="Test NFT",
            description="Test NFT",
            image="https://example.com/test.png",
            attributes=[]
        )
        service.mint_nft(
            to_address=mock_wallet_info.address,
            metadata=metadata,
            network=NetworkType.ETHEREUM
        )
        
        balance = service.get_nft_balance(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        assert balance > 0

    def test_list_nft_for_sale(self, service, mock_wallet_info, mock_nft_metadata):
        """Test listing NFT for sale"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        # Mint an NFT first
        nft = service.mint_nft(
            to_address=mock_wallet_info.address,
            metadata=mock_nft_metadata,
            network=NetworkType.ETHEREUM
        )
        
        listing = service.list_nft_for_sale(
            token_id=nft.tokenId,
            price=100,
            network=NetworkType.ETHEREUM
        )
        
        assert listing.tokenId == nft.tokenId
        assert listing.price == 100
        assert listing.isListed is True
        assert listing.id in service.nft_marketplace

    def test_buy_nft(self, service, mock_wallet_info, mock_nft_metadata):
        """Test buying NFT"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        service.connect_wallet(
            address="0x0987654321098765432109876543210987654321",
            network=NetworkType.ETHEREUM
        )
        
        # Mint and list an NFT
        nft = service.mint_nft(
            to_address=mock_wallet_info.address,
            metadata=mock_nft_metadata,
            network=NetworkType.ETHEREUM
        )
        listing = service.list_nft_for_sale(
            token_id=nft.tokenId,
            price=100,
            network=NetworkType.ETHEREUM
        )
        
        # Buy the NFT
        purchase = service.buy_nft(
            listing_id=listing.id,
            buyer_address="0x0987654321098765432109876543210987654321",
            network=NetworkType.ETHEREUM
        )
        
        assert purchase.listingId == listing.id
        assert purchase.buyerAddress == "0x0987654321098765432109876543210987654321"
        assert purchase.status == TransactionStatus.COMPLETED

    def test_get_bridge_quote(self, service):
        """Test getting bridge quote"""
        quote = service.get_bridge_quote(
            from_network=NetworkType.ETHEREUM,
            to_network=NetworkType.POLYGON,
            amount=100
        )
        
        assert quote.fromNetwork == NetworkType.ETHEREUM
        assert quote.toNetwork == NetworkType.POLYGON
        assert quote.amount == 100
        assert quote.fee > 0
        assert quote.estimatedTime > 0
        assert quote.id in service.bridge_quotes

    def test_execute_bridge_transfer(self, service, mock_wallet_info):
        """Test executing bridge transfer"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        quote = service.get_bridge_quote(
            from_network=NetworkType.ETHEREUM,
            to_network=NetworkType.POLYGON,
            amount=100
        )
        
        transfer = service.execute_bridge_transfer(
            quote_id=quote.id,
            user_address=mock_wallet_info.address
        )
        
        assert transfer.quoteId == quote.id
        assert transfer.userAddress == mock_wallet_info.address
        assert transfer.status == TransactionStatus.PENDING
        assert transfer.id in service.transactions

    def test_get_transaction_status(self, service, mock_wallet_info):
        """Test getting transaction status"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        transaction = service.transfer_dojo_coins(
            from_address=mock_wallet_info.address,
            to_address="0x0987654321098765432109876543210987654321",
            amount=100,
            network=NetworkType.ETHEREUM
        )
        
        status = service.get_transaction_status(transaction.id)
        assert status is not None
        assert status in [TransactionStatus.PENDING, TransactionStatus.COMPLETED, TransactionStatus.FAILED]

    def test_get_transaction_status_not_found(self, service):
        """Test getting status for non-existent transaction"""
        status = service.get_transaction_status("non-existent")
        assert status is None

    def test_get_network_health(self, service):
        """Test getting network health"""
        health = service.get_network_health(NetworkType.ETHEREUM)
        
        assert health.network == NetworkType.ETHEREUM
        assert health.isHealthy is True
        assert health.blockHeight > 0
        assert health.gasPrice > 0
        assert health.network in service.network_health

    def test_get_all_network_health(self, service):
        """Test getting all network health"""
        health_data = service.get_all_network_health()
        
        assert NetworkType.ETHEREUM in health_data
        assert NetworkType.POLYGON in health_data
        assert NetworkType.SOLANA in health_data

    def test_get_user_transactions(self, service, mock_wallet_info):
        """Test getting user transactions"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        # Create a transaction
        service.transfer_dojo_coins(
            from_address=mock_wallet_info.address,
            to_address="0x0987654321098765432109876543210987654321",
            amount=100,
            network=NetworkType.ETHEREUM
        )
        
        transactions = service.get_user_transactions(mock_wallet_info.address)
        assert len(transactions) > 0

    def test_get_nft_marketplace_listings(self, service, mock_wallet_info, mock_nft_metadata):
        """Test getting NFT marketplace listings"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        # Mint and list an NFT
        nft = service.mint_nft(
            to_address=mock_wallet_info.address,
            metadata=mock_nft_metadata,
            network=NetworkType.ETHEREUM
        )
        service.list_nft_for_sale(
            token_id=nft.tokenId,
            price=100,
            network=NetworkType.ETHEREUM
        )
        
        listings = service.get_nft_marketplace_listings(NetworkType.ETHEREUM)
        assert len(listings) > 0

    def test_search_nft_marketplace(self, service, mock_wallet_info, mock_nft_metadata):
        """Test searching NFT marketplace"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        # Mint and list an NFT
        nft = service.mint_nft(
            to_address=mock_wallet_info.address,
            metadata=mock_nft_metadata,
            network=NetworkType.ETHEREUM
        )
        service.list_nft_for_sale(
            token_id=nft.tokenId,
            price=100,
            network=NetworkType.ETHEREUM
        )
        
        results = service.search_nft_marketplace(
            query="trophy",
            network=NetworkType.ETHEREUM
        )
        assert len(results) > 0

    def test_get_bridge_transfer_status(self, service, mock_wallet_info):
        """Test getting bridge transfer status"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        quote = service.get_bridge_quote(
            from_network=NetworkType.ETHEREUM,
            to_network=NetworkType.POLYGON,
            amount=100
        )
        
        transfer = service.execute_bridge_transfer(
            quote_id=quote.id,
            user_address=mock_wallet_info.address
        )
        
        status = service.get_bridge_transfer_status(transfer.id)
        assert status is not None

    def test_cancel_bridge_transfer(self, service, mock_wallet_info):
        """Test canceling bridge transfer"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        quote = service.get_bridge_quote(
            from_network=NetworkType.ETHEREUM,
            to_network=NetworkType.POLYGON,
            amount=100
        )
        
        transfer = service.execute_bridge_transfer(
            quote_id=quote.id,
            user_address=mock_wallet_info.address
        )
        
        result = service.cancel_bridge_transfer(transfer.id)
        assert result is True

    def test_get_blockchain_analytics(self, service):
        """Test getting blockchain analytics"""
        analytics = service.get_blockchain_analytics()
        
        assert analytics is not None
        assert "total_transactions" in analytics
        assert "total_volume" in analytics
        assert "active_users" in analytics
        assert "network_stats" in analytics

    @patch('src.services.blockchain.EnhancedBlockchainService.socketio')
    def test_broadcast_transaction_update(self, mock_socketio, service, mock_wallet_info):
        """Test broadcasting transaction updates"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        transaction = service.transfer_dojo_coins(
            from_address=mock_wallet_info.address,
            to_address="0x0987654321098765432109876543210987654321",
            amount=100,
            network=NetworkType.ETHEREUM
        )
        
        service.broadcast_transaction_update(transaction)
        
        mock_socket.emit.assert_called_with(
            'transaction_update',
            transaction.dict()
        )

    @patch('src.services.blockchain.EnhancedBlockchainService.socketio')
    def test_broadcast_network_health_update(self, mock_socketio, service):
        """Test broadcasting network health updates"""
        mock_socket = Mock()
        mock_socketio.return_value = mock_socket
        service.connect_socket()
        
        health = service.get_network_health(NetworkType.ETHEREUM)
        
        service.broadcast_network_health_update(health)
        
        mock_socket.emit.assert_called_with(
            'network_health_update',
            health.dict()
        )

    def test_validate_address(self, service):
        """Test address validation"""
        valid_address = "0x1234567890123456789012345678901234567890"
        invalid_address = "invalid-address"
        
        assert service.validate_address(valid_address, NetworkType.ETHEREUM) is True
        assert service.validate_address(invalid_address, NetworkType.ETHEREUM) is False

    def test_estimate_gas_fee(self, service):
        """Test gas fee estimation"""
        fee = service.estimate_gas_fee(
            from_address="0x1234567890123456789012345678901234567890",
            to_address="0x0987654321098765432109876543210987654321",
            amount=100,
            network=NetworkType.ETHEREUM
        )
        
        assert fee > 0

    def test_get_transaction_history(self, service, mock_wallet_info):
        """Test getting transaction history"""
        service.connect_wallet(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM
        )
        
        # Create multiple transactions
        service.transfer_dojo_coins(
            from_address=mock_wallet_info.address,
            to_address="0x0987654321098765432109876543210987654321",
            amount=100,
            network=NetworkType.ETHEREUM
        )
        service.transfer_dojo_coins(
            from_address=mock_wallet_info.address,
            to_address="0x0987654321098765432109876543210987654321",
            amount=200,
            network=NetworkType.ETHEREUM
        )
        
        history = service.get_transaction_history(
            address=mock_wallet_info.address,
            network=NetworkType.ETHEREUM,
            limit=10
        )
        
        assert len(history) > 0 