import pytest
from datetime import datetime
from bson import ObjectId
from ...models.marketplace import MarketplaceItem, Transaction, Wallet, UserInventory
from ...routes.api.marketplace import marketplace

@pytest.fixture
def test_client(app):
    return app.test_client()

@pytest.fixture
def auth_headers():
    # Mock authentication headers
    return {'Authorization': 'Bearer test_token'}

@pytest.fixture
def test_user():
    return {'_id': ObjectId(), 'username': 'test_user'}

@pytest.fixture
def test_wallet(test_user):
    wallet = Wallet.create({
        'userId': test_user['_id'],
        'balance': 1000,
        'currency': 'DP'
    })
    yield wallet
    wallet.delete()

@pytest.fixture
def test_items():
    items = [
        MarketplaceItem.create({
            'name': 'Test Power-up 1',
            'description': 'A test power-up item',
            'price': 100,
            'category': 'power-ups',
            'rarity': 'common',
            'stock': 10,
            'effects': [{'type': 'boost', 'value': 1.5}]
        }),
        MarketplaceItem.create({
            'name': 'Test Avatar 1',
            'description': 'A test avatar item',
            'price': 200,
            'category': 'avatars',
            'rarity': 'rare',
            'stock': 5
        })
    ]
    yield items
    for item in items:
        item.delete()

def test_get_items(test_client):
    """Test fetching marketplace items with various filters"""
    # Test getting all items
    response = test_client.get('/api/marketplace/items')
    assert response.status_code == 200
    items = response.json
    assert isinstance(items, list)

    # Test category filter
    response = test_client.get('/api/marketplace/items?category=power-ups')
    assert response.status_code == 200
    items = response.json
    assert all(item['category'] == 'power-ups' for item in items)

    # Test search filter
    response = test_client.get('/api/marketplace/items?search=power')
    assert response.status_code == 200
    items = response.json
    assert len(items) > 0

    # Test sort by price
    response = test_client.get('/api/marketplace/items?sortBy=price-asc')
    assert response.status_code == 200
    items = response.json
    assert all(items[i]['price'] <= items[i+1]['price'] 
              for i in range(len(items)-1))

def test_get_inventory(test_client, auth_headers, test_user, test_items):
    """Test fetching user inventory"""
    # Add items to user's inventory
    UserInventory.add_to_inventory(
        str(test_user['_id']), 
        str(test_items[0]._id),
        quantity=2
    )

    response = test_client.get(
        '/api/marketplace/inventory',
        headers=auth_headers
    )
    assert response.status_code == 200
    inventory = response.json
    assert len(inventory) > 0
    assert inventory[0]['quantity'] == 2

def test_get_wallet(test_client, auth_headers, test_wallet):
    """Test fetching user wallet"""
    response = test_client.get(
        '/api/marketplace/wallet',
        headers=auth_headers
    )
    assert response.status_code == 200
    wallet = response.json
    assert wallet['balance'] == 1000
    assert wallet['currency'] == 'DP'

def test_purchase_flow(test_client, auth_headers, test_user, test_wallet, test_items):
    """Test complete purchase flow"""
    # Initial wallet balance check
    response = test_client.get(
        '/api/marketplace/wallet',
        headers=auth_headers
    )
    initial_balance = response.json['balance']

    # Purchase items
    purchase_data = {
        'items': [{
            'id': str(test_items[0]._id),
            'quantity': 1
        }]
    }
    response = test_client.post(
        '/api/marketplace/purchase',
        json=purchase_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    result = response.json
    assert result['success'] is True
    assert result['total'] == test_items[0].price

    # Check updated wallet balance
    response = test_client.get(
        '/api/marketplace/wallet',
        headers=auth_headers
    )
    new_balance = response.json['balance']
    assert new_balance == initial_balance - test_items[0].price

    # Check inventory
    response = test_client.get(
        '/api/marketplace/inventory',
        headers=auth_headers
    )
    inventory = response.json
    purchased_item = next(
        (item for item in inventory 
         if item['id'] == str(test_items[0]._id)),
        None
    )
    assert purchased_item is not None
    assert purchased_item['quantity'] == 1

def test_purchase_validation(test_client, auth_headers, test_user, test_wallet, test_items):
    """Test purchase validation scenarios"""
    # Test insufficient funds
    expensive_item = test_items[1]
    purchase_data = {
        'items': [{
            'id': str(expensive_item._id),
            'quantity': 10
        }]
    }
    response = test_client.post(
        '/api/marketplace/purchase',
        json=purchase_data,
        headers=auth_headers
    )
    assert response.status_code == 400
    assert 'Insufficient funds' in response.json['error']

    # Test insufficient stock
    purchase_data = {
        'items': [{
            'id': str(test_items[0]._id),
            'quantity': 100
        }]
    }
    response = test_client.post(
        '/api/marketplace/purchase',
        json=purchase_data,
        headers=auth_headers
    )
    assert response.status_code == 400
    assert 'Insufficient stock' in response.json['error']

def test_transaction_history(test_client, auth_headers, test_user):
    """Test transaction history retrieval"""
    response = test_client.get(
        '/api/marketplace/transactions',
        headers=auth_headers
    )
    assert response.status_code == 200
    transactions = response.json
    assert isinstance(transactions, list)

    # Verify transaction fields
    if transactions:
        transaction = transactions[0]
        assert 'id' in transaction
        assert 'items' in transaction
        assert 'total' in transaction
        assert 'status' in transaction
        assert 'timestamp' in transaction

def test_item_preview(test_client, test_items):
    """Test item preview functionality"""
    # Add preview to test item
    test_items[0].preview = 'test_preview_data'
    test_items[0].save()

    response = test_client.get(
        f'/api/marketplace/items/{str(test_items[0]._id)}/preview'
    )
    assert response.status_code == 200
    preview = response.json
    assert preview['preview'] == 'test_preview_data'

    # Test non-existent preview
    response = test_client.get(
        f'/api/marketplace/items/{str(test_items[1]._id)}/preview'
    )
    assert response.status_code == 404 