"""Unit tests for the marketplace module."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from redis import Redis

from dojopool.core.marketplace import (
    Marketplace, MarketplaceItem, Transaction,
    ItemType, ItemRarity, TransactionStatus, AuctionStatus
)

@pytest.fixture
def mock_redis():
    """Mock Redis instance."""
    with patch('dojopool.core.marketplace.Redis') as mock:
        yield mock

@pytest.fixture
def marketplace(mock_redis):
    """Marketplace instance with mocked Redis."""
    return Marketplace()

@pytest.mark.asyncio
async def test_create_item(marketplace):
    """Test creating a marketplace item."""
    # Arrange
    name = "Test Item"
    description = "A test item"
    item_type = ItemType.AVATAR
    rarity = ItemRarity.RARE
    price = 100.0
    creator_id = "user123"
    quantity = 5
    metadata = {"test": "data"}

    # Act
    item = await marketplace.create_item(
        name=name,
        description=description,
        type=item_type,
        rarity=rarity,
        price=price,
        creator_id=creator_id,
        available_quantity=quantity,
        metadata=metadata
    )

    # Assert
    assert item.name == name
    assert item.description == description
    assert item.type == item_type
    assert item.rarity == rarity
    assert item.price == price
    assert item.creator_id == creator_id
    assert item.available_quantity == quantity
    assert item.metadata == metadata
    assert item.total_sold == 0
    assert item.is_active is True

@pytest.mark.asyncio
async def test_get_item(marketplace, mock_redis):
    """Test retrieving a marketplace item."""
    # Arrange
    item_id = "test_id"
    mock_data = {
        'id': item_id,
        'name': "Test Item",
        'description': "A test item",
        'type': ItemType.AVATAR.value,
        'rarity': ItemRarity.RARE.value,
        'price': 100.0,
        'creator_id': "user123",
        'created_at': datetime.utcnow().isoformat(),
        'metadata': {},
        'available_quantity': 5,
        'total_sold': 0,
        'is_active': True
    }
    mock_redis.return_value.get.return_value = str(mock_data).encode()

    # Act
    item = await marketplace.get_item(item_id)

    # Assert
    assert item is not None
    assert item.id == item_id
    assert item.type == ItemType.AVATAR
    assert item.rarity == ItemRarity.RARE

@pytest.mark.asyncio
async def test_list_items_with_filters(marketplace, mock_redis):
    """Test listing marketplace items with filters."""
    # Arrange
    mock_items = [
        {
            'id': f"item_{i}",
            'name': f"Item {i}",
            'description': f"Description {i}",
            'type': ItemType.AVATAR.value,
            'rarity': ItemRarity.RARE.value,
            'price': 100.0 * i,
            'creator_id': "user123",
            'created_at': datetime.utcnow().isoformat(),
            'metadata': {},
            'available_quantity': 5,
            'total_sold': 0,
            'is_active': True
        }
        for i in range(3)
    ]
    mock_redis.return_value.scan_iter.return_value = [f"marketplace:item:{i}".encode() for i in range(3)]
    mock_redis.return_value.get.side_effect = [str(item).encode() for item in mock_items]

    # Act
    items = await marketplace.list_items(
        type=ItemType.AVATAR,
        rarity=ItemRarity.RARE,
        min_price=150.0
    )

    # Assert
    assert len(items) == 2  # Only items with price >= 150.0
    assert all(item.type == ItemType.AVATAR for item in items)
    assert all(item.rarity == ItemRarity.RARE for item in items)
    assert all(item.price >= 150.0 for item in items)

@pytest.mark.asyncio
async def test_create_transaction(marketplace, mock_redis):
    """Test creating a transaction."""
    # Arrange
    item_id = "test_item"
    mock_item = {
        'id': item_id,
        'name': "Test Item",
        'type': ItemType.AVATAR.value,
        'rarity': ItemRarity.RARE.value,
        'price': 100.0,
        'creator_id': "seller123",
        'created_at': datetime.utcnow().isoformat(),
        'metadata': {},
        'available_quantity': 5,
        'total_sold': 0,
        'is_active': True
    }
    mock_redis.return_value.get.return_value = str(mock_item).encode()

    # Act
    transaction = await marketplace.create_transaction(
        item_id=item_id,
        buyer_id="buyer123",
        quantity=2
    )

    # Assert
    assert transaction is not None
    assert transaction.item_id == item_id
    assert transaction.buyer_id == "buyer123"
    assert transaction.seller_id == "seller123"
    assert transaction.price == 200.0  # 100.0 * 2
    assert transaction.quantity == 2
    assert transaction.status == TransactionStatus.PENDING

@pytest.mark.asyncio
async def test_complete_transaction(marketplace, mock_redis):
    """Test completing a transaction."""
    # Arrange
    transaction_id = "test_transaction"
    mock_transaction = {
        'id': transaction_id,
        'item_id': "test_item",
        'buyer_id': "buyer123",
        'seller_id': "seller123",
        'price': 100.0,
        'quantity': 1,
        'status': TransactionStatus.PENDING.value,
        'created_at': datetime.utcnow().isoformat(),
        'completed_at': None,
        'metadata': {}
    }
    mock_redis.return_value.get.return_value = str(mock_transaction).encode()

    # Act
    transaction = await marketplace.complete_transaction(transaction_id)

    # Assert
    assert transaction is not None
    assert transaction.status == TransactionStatus.COMPLETED
    assert transaction.completed_at is not None

@pytest.mark.asyncio
async def test_get_user_transactions(marketplace, mock_redis):
    """Test getting user transactions."""
    # Arrange
    user_id = "user123"
    mock_transactions = [
        {
            'id': f"transaction_{i}",
            'item_id': f"item_{i}",
            'buyer_id': user_id if i % 2 == 0 else "other_user",
            'seller_id': "seller123",
            'price': 100.0,
            'quantity': 1,
            'status': TransactionStatus.COMPLETED.value,
            'created_at': datetime.utcnow().isoformat(),
            'completed_at': datetime.utcnow().isoformat(),
            'metadata': {}
        }
        for i in range(4)
    ]
    mock_redis.return_value.scan_iter.return_value = [f"marketplace:transaction:{i}".encode() for i in range(4)]
    mock_redis.return_value.get.side_effect = [str(t).encode() for t in mock_transactions]

    # Act
    transactions = await marketplace.get_user_transactions(
        user_id=user_id,
        as_buyer=True,
        status=TransactionStatus.COMPLETED
    )

    # Assert
    assert len(transactions) == 2  # Only transactions where user is buyer
    assert all(t.buyer_id == user_id for t in transactions)
    assert all(t.status == TransactionStatus.COMPLETED for t in transactions)

@pytest.mark.asyncio
async def test_error_handling(marketplace, mock_redis):
    """Test error handling in marketplace operations."""
    # Arrange
    mock_redis.return_value.get.side_effect = Exception("Redis error")

    # Act & Assert
    with pytest.raises(Exception):
        await marketplace.create_item(
            name="Test",
            description="Test",
            type=ItemType.AVATAR,
            rarity=ItemRarity.COMMON,
            price=100.0,
            creator_id="user123",
            available_quantity=1
        )

    # Should return None on error
    assert await marketplace.get_item("test_id") is None
    assert await marketplace.get_transaction("test_id") is None
    assert len(await marketplace.list_items()) == 0
    assert len(await marketplace.get_user_transactions("user123")) == 0 

@pytest.mark.asyncio
async def test_search_items(marketplace, mock_redis):
    """Test searching marketplace items."""
    # Arrange
    mock_items = [
        {
            'id': f"item_{i}",
            'name': f"Test Item {i}",
            'description': f"Description {i}",
            'type': ItemType.AVATAR.value,
            'rarity': ItemRarity.RARE.value,
            'price': 100.0,
            'creator_id': "user123",
            'created_at': datetime.utcnow().isoformat(),
            'metadata': {},
            'available_quantity': 5,
            'total_sold': i,
            'is_active': True
        }
        for i in range(3)
    ]
    mock_redis.return_value.scan_iter.return_value = [f"marketplace:item:{i}".encode() for i in range(3)]
    mock_redis.return_value.get.side_effect = [str(item).encode() for item in mock_items]

    # Act
    items = await marketplace.search_items("Test Item 1")

    # Assert
    assert len(items) == 1
    assert items[0].name == "Test Item 1"

@pytest.mark.asyncio
async def test_get_featured_items(marketplace, mock_redis):
    """Test getting featured marketplace items."""
    # Arrange
    mock_items = [
        {
            'id': f"item_{i}",
            'name': f"Item {i}",
            'description': f"Description {i}",
            'type': ItemType.AVATAR.value,
            'rarity': ItemRarity.RARE.value if i % 2 == 0 else ItemRarity.LEGENDARY.value,
            'price': 100.0,
            'creator_id': "user123",
            'created_at': datetime.utcnow().isoformat(),
            'metadata': {},
            'available_quantity': 5,
            'total_sold': i * 10,
            'is_active': True
        }
        for i in range(5)
    ]
    mock_redis.return_value.scan_iter.return_value = [f"marketplace:item:{i}".encode() for i in range(5)]
    mock_redis.return_value.get.side_effect = [str(item).encode() for item in mock_items]

    # Act
    items = await marketplace.get_featured_items(limit=3)

    # Assert
    assert len(items) == 3
    # Legendary items with high sales should be first
    assert items[0].rarity == ItemRarity.LEGENDARY
    assert items[0].total_sold == 30  # item_3

@pytest.mark.asyncio
async def test_refund_transaction(marketplace, mock_redis):
    """Test refunding a transaction."""
    # Arrange
    transaction_id = "test_transaction"
    item_id = "test_item"
    
    mock_transaction = {
        'id': transaction_id,
        'item_id': item_id,
        'buyer_id': "buyer123",
        'seller_id': "seller123",
        'price': 100.0,
        'quantity': 2,
        'status': TransactionStatus.COMPLETED.value,
        'created_at': datetime.utcnow().isoformat(),
        'completed_at': datetime.utcnow().isoformat(),
        'metadata': {}
    }
    
    mock_item = {
        'id': item_id,
        'name': "Test Item",
        'type': ItemType.AVATAR.value,
        'rarity': ItemRarity.RARE.value,
        'price': 50.0,
        'creator_id': "seller123",
        'created_at': datetime.utcnow().isoformat(),
        'metadata': {},
        'available_quantity': 3,
        'total_sold': 2,
        'is_active': True
    }
    
    def mock_get(key):
        if 'transaction' in key:
            return str(mock_transaction).encode()
        return str(mock_item).encode()
    
    mock_redis.return_value.get.side_effect = mock_get

    # Act
    transaction = await marketplace.refund_transaction(
        transaction_id,
        reason="Customer request"
    )

    # Assert
    assert transaction is not None
    assert transaction.status == TransactionStatus.REFUNDED
    assert transaction.metadata['refund_reason'] == "Customer request"
    assert 'refunded_at' in transaction.metadata

@pytest.mark.asyncio
async def test_get_item_stats(marketplace, mock_redis):
    """Test getting item statistics."""
    # Arrange
    item_id = "test_item"
    mock_item = {
        'id': item_id,
        'name': "Test Item",
        'type': ItemType.AVATAR.value,
        'rarity': ItemRarity.RARE.value,
        'price': 100.0,
        'creator_id': "seller123",
        'created_at': datetime.utcnow().isoformat(),
        'metadata': {},
        'available_quantity': 5,
        'total_sold': 3,
        'is_active': True
    }
    
    mock_transactions = [
        {
            'id': f"transaction_{i}",
            'item_id': item_id,
            'buyer_id': f"buyer_{i}",
            'seller_id': "seller123",
            'price': 100.0,
            'quantity': 1,
            'status': TransactionStatus.COMPLETED.value if i < 2 else TransactionStatus.REFUNDED.value,
            'created_at': datetime.utcnow().isoformat(),
            'completed_at': datetime.utcnow().isoformat(),
            'metadata': {}
        }
        for i in range(3)
    ]
    
    mock_redis.return_value.scan_iter.return_value = [f"marketplace:transaction:{i}".encode() for i in range(3)]
    
    def mock_get(key):
        if 'item' in key:
            return str(mock_item).encode()
        return str(mock_transactions[int(key.split('_')[-1].decode())]).encode()
    
    mock_redis.return_value.get.side_effect = mock_get

    # Act
    stats = await marketplace.get_item_stats(item_id)

    # Assert
    assert stats['total_sold'] == 3
    assert stats['available_quantity'] == 5
    assert stats['total_revenue'] == 200.0  # 2 completed transactions * 100.0
    assert stats['average_price'] == 100.0
    assert stats['total_transactions'] == 3
    assert stats['completed_transactions'] == 2
    assert stats['refunded_transactions'] == 1
    assert stats['refund_rate'] == 0.5  # 1 refund / 2 completed 

@pytest.mark.asyncio
async def test_create_auction(marketplace, mock_redis):
    """Test creating an auction."""
    # Arrange
    item_id = "test_item"
    mock_item = {
        'id': item_id,
        'name': "Test Item",
        'type': ItemType.AVATAR.value,
        'rarity': ItemRarity.RARE.value,
        'price': 100.0,
        'creator_id': "seller123",
        'created_at': datetime.utcnow().isoformat(),
        'metadata': {},
        'available_quantity': 1,
        'total_sold': 0,
        'is_active': True
    }
    mock_redis.return_value.get.return_value = str(mock_item).encode()

    # Act
    auction = await marketplace.create_auction(
        item_id=item_id,
        seller_id="seller123",
        start_price=50.0,
        min_increment=5.0,
        duration_hours=24,
        start_delay_hours=1
    )

    # Assert
    assert auction is not None
    assert auction.item_id == item_id
    assert auction.seller_id == "seller123"
    assert auction.start_price == 50.0
    assert auction.min_increment == 5.0
    assert auction.status == AuctionStatus.PENDING

@pytest.mark.asyncio
async def test_place_bid(marketplace, mock_redis):
    """Test placing a bid on an auction."""
    # Arrange
    auction_id = "test_auction"
    mock_auction = {
        'id': auction_id,
        'item_id': "test_item",
        'seller_id': "seller123",
        'start_price': 50.0,
        'min_increment': 5.0,
        'start_time': (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        'end_time': (datetime.utcnow() + timedelta(hours=23)).isoformat(),
        'status': AuctionStatus.ACTIVE.value,
        'current_bid': None,
        'current_winner': None,
        'created_at': datetime.utcnow().isoformat(),
        'metadata': {}
    }
    
    def mock_get(key):
        if 'auction' in key:
            return str(mock_auction).encode()
        return None
    
    mock_redis.return_value.get.side_effect = mock_get

    # Act
    bid = await marketplace.place_bid(
        auction_id=auction_id,
        bidder_id="bidder123",
        amount=60.0
    )

    # Assert
    assert bid is not None
    assert bid.auction_id == auction_id
    assert bid.bidder_id == "bidder123"
    assert bid.amount == 60.0

@pytest.mark.asyncio
async def test_get_auction_bids(marketplace, mock_redis):
    """Test getting bids for an auction."""
    # Arrange
    auction_id = "test_auction"
    mock_bids = [
        {
            'id': f"bid_{i}",
            'auction_id': auction_id,
            'bidder_id': f"bidder_{i}",
            'amount': 50.0 + (i * 10),
            'created_at': datetime.utcnow().isoformat(),
            'metadata': {}
        }
        for i in range(3)
    ]
    mock_redis.return_value.scan_iter.return_value = [f"marketplace:bid:{i}".encode() for i in range(3)]
    mock_redis.return_value.get.side_effect = [str(bid).encode() for bid in mock_bids]

    # Act
    bids = await marketplace.get_auction_bids(auction_id)

    # Assert
    assert len(bids) == 3
    assert bids[0].amount == 70.0  # Highest bid first
    assert bids[-1].amount == 50.0  # Lowest bid last

@pytest.mark.asyncio
async def test_get_active_auctions(marketplace, mock_redis):
    """Test getting active auctions."""
    # Arrange
    mock_auctions = [
        {
            'id': f"auction_{i}",
            'item_id': f"item_{i}",
            'seller_id': "seller123",
            'start_price': 50.0,
            'min_increment': 5.0,
            'start_time': (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            'end_time': (datetime.utcnow() + timedelta(hours=i)).isoformat(),
            'status': AuctionStatus.ACTIVE.value,
            'current_bid': 60.0,
            'current_winner': "bidder123",
            'created_at': datetime.utcnow().isoformat(),
            'metadata': {}
        }
        for i in range(3)
    ]
    
    mock_items = [
        {
            'id': f"item_{i}",
            'type': ItemType.AVATAR.value,
            'rarity': ItemRarity.RARE.value,
            'price': 100.0,
            'creator_id': "seller123",
            'created_at': datetime.utcnow().isoformat(),
            'metadata': {},
            'available_quantity': 1,
            'total_sold': 0,
            'is_active': False
        }
        for i in range(3)
    ]
    
    mock_redis.return_value.scan_iter.return_value = [f"marketplace:auction:{i}".encode() for i in range(3)]
    
    def mock_get(key):
        if 'item' in key:
            item_id = key.split(':')[-1].decode()
            item_index = int(item_id.split('_')[-1])
            return str(mock_items[item_index]).encode()
        auction_id = key.split(':')[-1].decode()
        auction_index = int(auction_id.split('_')[-1])
        return str(mock_auctions[auction_index]).encode()
    
    mock_redis.return_value.get.side_effect = mock_get

    # Act
    auctions = await marketplace.get_active_auctions(
        item_type=ItemType.AVATAR,
        min_price=55.0
    )

    # Assert
    assert len(auctions) == 3
    assert all(a.status == AuctionStatus.ACTIVE for a in auctions)
    assert all(a.current_bid >= 55.0 for a in auctions)
    # Should be sorted by end time
    assert auctions[0].end_time < auctions[1].end_time < auctions[2].end_time

@pytest.mark.asyncio
async def test_auction_lifecycle(marketplace, mock_redis):
    """Test the complete lifecycle of an auction."""
    # Arrange
    item_id = "test_item"
    auction_id = "test_auction"
    
    mock_item = {
        'id': item_id,
        'name': "Test Item",
        'type': ItemType.AVATAR.value,
        'rarity': ItemRarity.RARE.value,
        'price': 100.0,
        'creator_id': "seller123",
        'created_at': datetime.utcnow().isoformat(),
        'metadata': {},
        'available_quantity': 1,
        'total_sold': 0,
        'is_active': True
    }
    
    mock_auction = {
        'id': auction_id,
        'item_id': item_id,
        'seller_id': "seller123",
        'start_price': 50.0,
        'min_increment': 5.0,
        'start_time': (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        'end_time': (datetime.utcnow() + timedelta(hours=23)).isoformat(),
        'status': AuctionStatus.ACTIVE.value,
        'current_bid': None,
        'current_winner': None,
        'created_at': datetime.utcnow().isoformat(),
        'metadata': {}
    }
    
    def mock_get(key):
        if 'item' in key:
            return str(mock_item).encode()
        return str(mock_auction).encode()
    
    mock_redis.return_value.get.side_effect = mock_get

    # Act & Assert
    # 1. Create auction
    auction = await marketplace.create_auction(
        item_id=item_id,
        seller_id="seller123",
        start_price=50.0,
        min_increment=5.0,
        duration_hours=24
    )
    assert auction is not None
    assert auction.status == AuctionStatus.ACTIVE
    
    # 2. Place first bid
    bid1 = await marketplace.place_bid(
        auction_id=auction_id,
        bidder_id="bidder1",
        amount=55.0
    )
    assert bid1 is not None
    assert bid1.amount == 55.0
    
    # 3. Place higher bid
    bid2 = await marketplace.place_bid(
        auction_id=auction_id,
        bidder_id="bidder2",
        amount=65.0
    )
    assert bid2 is not None
    assert bid2.amount == 65.0
    
    # 4. Try to place lower bid (should fail)
    bid3 = await marketplace.place_bid(
        auction_id=auction_id,
        bidder_id="bidder3",
        amount=60.0
    )
    assert bid3 is None
    
    # 5. Get auction bids
    bids = await marketplace.get_auction_bids(auction_id)
    assert len(bids) == 2
    assert bids[0].amount == 65.0  # Highest bid first 