import pytest

def test_pytest_runs():
    assert True

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
import pytest
from flask import url_for
from dojopool.app import create_app
from dojopool.core.extensions import db
from dojopool.models.user import User
from dojopool.models.marketplace import Wallet, Transaction, MarketplaceItem, UserInventory
from dojopool.models.player import Player
from dojopool.models.role import Role
from dojopool.models.tournament import Tournament
from dojopool.models.venue import Venue
from dojopool.models.token import Token

def create_user(client, username="testuser", email="test@example.com"):
    resp = client.post(
        url_for("auth.register"),
        json={"username": username, "email": email, "password": "password123"},
    )
    assert resp.status_code == 201
    return resp.get_json()["user"]["id"]

def login_user(client, username="testuser", password="password123"):
    resp = client.post(
        url_for("auth.login"),
        json={"username": username, "password": password},
    )
    assert resp.status_code == 200
    return resp.get_json()["access_token"]

@pytest.fixture(scope="module")
def client():
    app = create_app(config_name="testing")
    with app.test_client() as client:
        with app.app_context():
            # Only create tables; all models are imported in create_app
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

@pytest.fixture
def auth_client(client):
    user_id = create_user(client, username="testuser", email="test@example.com")
    token = login_user(client, username="testuser", password="password123")
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client, user_id

def test_wallet_creation_and_fetch(auth_client):
    client, user_id = auth_client
    resp = client.get(url_for("marketplace.get_wallet"))
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["user_id"] == user_id
    assert data["balance"] == 0.0
    assert data["currency"] == "DP"
    assert data["is_active"] is True

def test_wallet_purchase_and_transaction(auth_client):
    client, user_id = auth_client
    # Add funds to wallet directly for test
    with client.application.app_context():
        wallet = db.session.query(Wallet).filter_by(user_id=user_id).first()
        wallet.balance = 100.0
        db.session.commit()
    # Simulate purchase
    purchase_items = [{"id": 1, "quantity": 2}]  # You may need to create a test item with id=1
    resp = client.post(url_for("marketplace.purchase_items"), json={"items": purchase_items})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["newBalance"] < 100.0
    # Check transaction record
    with client.application.app_context():
        txs = db.session.query(Transaction).filter_by(user_id=user_id).all()
        assert len(txs) > 0
        tx = txs[-1]
        assert tx.status == "completed"

def test_wallet_transactions_endpoint(auth_client):
    client, user_id = auth_client
    resp = client.get(url_for("marketplace.get_transactions"))
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    for tx in data:
        assert tx["user_id"] == user_id
        assert "amount" in tx
        assert "status" in tx
        assert "type" in tx
