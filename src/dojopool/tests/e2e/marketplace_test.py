import pytest
from dojopool import create_app

@pytest.fixture(scope="session")
def app():
    test_config = {
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_ENGINE_OPTIONS": {"connect_args": {"check_same_thread": False}},
        "TESTING": True,
    }
    app = create_app(test_config=test_config)
    with app.app_context():
        from dojopool.core.extensions import db
        import traceback
        try:
            db.create_all()
        except Exception as e:
            print('ERROR during db.create_all():', e)
            traceback.print_exc()
            with open('traceback_debug.txt', 'w') as f:
                traceback.print_exc(file=f)
            raise
        print('DEBUG: Registered tables after create_all:', list(db.metadata.tables.keys()))
        try:
            print('DEBUG: SQLAlchemy model registry:', db.Model.registry._class_registry)
        except AttributeError as e:
            print('DEBUG: Could not access model registry:', e)
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_client(app):
    with app.app_context():
        yield app.test_client()

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test_token"}

@pytest.fixture
def test_user(app):
    with app.app_context():
        from dojopool.core.extensions import db
        User = db.Model.registry._class_registry["User"]
        user = User(username="test_user", email="test_user@example.com", password="testpass")
        db.session.add(user)
        db.session.commit()
        yield user
        db.session.delete(user)
        db.session.commit()

@pytest.fixture
def test_items(app):
    with app.app_context():
        from dojopool.core.extensions import db
        MarketplaceItem = db.Model.registry._class_registry["MarketplaceItem"]
        print('DEBUG: MarketplaceItem.__table__ in test_items:', MarketplaceItem.__table__)
        item1 = MarketplaceItem(
            name="Test Power-up 1",
            description="A test power-up item",
            price=100,
            category="power-ups",
            rarity="common",
            stock=10,
            effects=None,
        )
        item2 = MarketplaceItem(
            name="Test Power-up 2",
            description="Another test power-up item",
            price=200,
            category="power-ups",
            rarity="rare",
            stock=5,
            effects=None,
        )
        db.session.add(item1)
        db.session.add(item2)
        db.session.commit()
        yield [item1, item2]
        db.session.delete(item1)
        db.session.delete(item2)
        db.session.commit()

@pytest.fixture
def test_wallet(app, test_user):
    with app.app_context():
        from dojopool.core.extensions import db
        Wallet = db.Model.registry._class_registry["Wallet"]
        wallet = Wallet(user_id=test_user.id, balance=1000, currency="DP")
        db.session.add(wallet)
        db.session.commit()
        yield wallet
        db.session.delete(wallet)
        db.session.commit()

def test_get_items(test_client, test_items):
    response = test_client.get("/api/marketplace/items")
    assert response.status_code == 200
    items = response.get_json()
    assert isinstance(items, list)
    assert len(items) >= 2
    assert all("name" in item for item in items)
    assert all("price" in item for item in items)
    assert items[0]["price"] <= items[1]["price"]
    assert all(items[i]["price"] <= items[i + 1]["price"] for i in range(len(items) - 1))

def test_get_inventory(test_client, auth_headers, test_user, test_items):
    with test_client.application.app_context():
        from dojopool.core.extensions import db
        UserInventory = db.Model.registry._class_registry["UserInventory"]
        UserInventory.add_to_inventory(user_id=test_user.id, item_id=test_items[0].id, quantity=2)
    response = test_client.get("/api/marketplace/inventory", headers=auth_headers)
    assert response.status_code == 200
    inventory = response.get_json()
    assert isinstance(inventory, list)
    assert any(item["item_id"] == test_items[0].id for item in inventory)

def test_get_wallet(test_client, auth_headers, test_wallet):
    response = test_client.get("/api/marketplace/wallet", headers=auth_headers)
    assert response.status_code == 200
    wallet = response.get_json()
    assert wallet["balance"] == 1000

def test_purchase_flow(test_client, auth_headers, test_user, test_wallet, test_items):
    with test_client.application.app_context():
        response = test_client.get("/api/marketplace/wallet", headers=auth_headers)
        initial_balance = response.get_json()["balance"]
        purchase_data = {"items": [{"id": test_items[0].id, "quantity": 1}]}
        response = test_client.post(
            "/api/marketplace/purchase", json=purchase_data, headers=auth_headers
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["success"] is True
        assert result["total"] == test_items[0].price
        response = test_client.get("/api/marketplace/wallet", headers=auth_headers)
        new_balance = response.get_json()["balance"]
        assert new_balance == initial_balance - test_items[0].price
        response = test_client.get("/api/marketplace/inventory", headers=auth_headers)
        inventory = response.get_json()
        purchased_item = next((item for item in inventory if item["item_id"] == test_items[0].id), None)
        assert purchased_item is not None
        assert purchased_item["quantity"] == 1

def test_purchase_validation(test_client, auth_headers, test_user, test_wallet, test_items):
    with test_client.application.app_context():
        purchase_data = {"items": [{"id": test_items[1].id, "quantity": 10}]}
        response = test_client.post(
            "/api/marketplace/purchase", json=purchase_data, headers=auth_headers
        )
        assert response.status_code == 400
        assert "Insufficient funds" in response.get_json()["error"]
        purchase_data = {"items": [{"id": test_items[0].id, "quantity": 100}]}
        response = test_client.post(
            "/api/marketplace/purchase", json=purchase_data, headers=auth_headers
        )
        assert response.status_code == 400
        assert "Insufficient stock" in response.get_json()["error"]

def test_transaction_history(test_client, auth_headers, test_user):
    with test_client.application.app_context():
        response = test_client.get("/api/marketplace/transactions", headers=auth_headers)
        assert response.status_code == 200
        transactions = response.get_json()
        assert isinstance(transactions, list)
        if transactions:
            transaction = transactions[0]
            assert "id" in transaction
            assert "item_id" in transaction
            assert "quantity" in transaction
            assert "price_at_purchase" in transaction
            assert "status" in transaction
            assert "created_at" in transaction

def test_item_preview(test_client, test_items):
    with test_client.application.app_context():
        from dojopool.core.extensions import db
        test_items[0].preview_url = "test_preview_data"
        db.session.add(test_items[0])
        db.session.commit()
        response = test_client.get(f"/api/marketplace/items/{test_items[0].id}/preview")
        assert response.status_code == 200
        preview = response.get_json()
        assert preview["preview_url"] == "test_preview_data"
        response = test_client.get(f"/api/marketplace/items/{test_items[1].id}/preview")
        assert response.status_code == 404
