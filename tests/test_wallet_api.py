import pytest
import os

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

# Use environment variables for test credentials
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "test_password_123")
TEST_EMAIL = os.getenv("TEST_EMAIL", "test@example.com")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")

def create_user(client, username="testuser", email=TEST_EMAIL):
    resp = client.post(
        url_for("auth.register"),
        json={"username": username, "email": email, "password": TEST_PASSWORD},
    )
    assert resp.status_code == 201
    return resp.get_json()["user"]["id"]

def login_user(client, username="testuser", password=TEST_PASSWORD):
    resp = client.post(
        url_for("auth.login"),
        json={"username": username, "password": password},
    )
    assert resp.status_code == 200
    return resp.get_json()["access_token"]

def create_admin_user(client, username="adminuser", email=ADMIN_EMAIL):
    resp = client.post(
        url_for("auth.register"),
        json={"username": username, "email": email, "password": TEST_PASSWORD},
    )
    assert resp.status_code == 201
    user_id = resp.get_json()["user"]["id"]
    # Assign admin role
    with client.application.app_context():
        user = db.session.query(User).get(user_id)
        admin_role = db.session.query(Role).filter_by(name='admin').first()
        if not admin_role:
            admin_role = Role(name='admin')
            db.session.add(admin_role)
            db.session.commit()
        user.roles.append(admin_role)
        db.session.commit()
    return user_id

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
    user_id = create_user(client, username="testuser", email=TEST_EMAIL)
    token = login_user(client, username="testuser", password=TEST_PASSWORD)
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client, user_id

@pytest.fixture
def admin_auth_client(client):
    admin_user_id = create_admin_user(client)
    token = login_user(client, username="adminuser", password=TEST_PASSWORD)
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client, admin_user_id

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

def test_admin_freeze_wallet(admin_auth_client, auth_client):
    admin_client, _ = admin_auth_client
    _, normal_user_id = auth_client # Get a regular user's ID

    # Ensure wallet exists
    resp = admin_client.get(url_for("marketplace.get_wallet", _external=False), headers={"Authorization": admin_client.environ_base["HTTP_AUTHORIZATION"].replace(str(normal_user_id), str(admin_client[1]))}) # Need to fix how client is passed/used
    # Hacky way to get normal user wallet, fix fixture interaction later
    normal_client, normal_user_id = auth_client
    resp_get = normal_client.get(url_for("marketplace.get_wallet"))
    assert resp_get.status_code == 200
    assert resp_get.get_json()["is_active"] is True

    # Freeze the wallet
    freeze_resp = admin_client.post(url_for("marketplace.admin_freeze_wallet", user_id=normal_user_id), json={"reason": "Test freeze"})
    assert freeze_resp.status_code == 200
    assert freeze_resp.get_json()["success"] is True
    assert freeze_resp.get_json()["status"] is False

    # Verify wallet is inactive
    resp_check = normal_client.get(url_for("marketplace.get_wallet"))
    assert resp_check.status_code == 200
    assert resp_check.get_json()["is_active"] is False

def test_admin_reactivate_wallet(admin_auth_client, auth_client):
    admin_client, _ = admin_auth_client
    normal_client, normal_user_id = auth_client

    # First, freeze the wallet (using admin client)
    freeze_resp = admin_client.post(url_for("marketplace.admin_freeze_wallet", user_id=normal_user_id), json={"reason": "Test setup"})
    assert freeze_resp.status_code == 200
    assert freeze_resp.get_json()["status"] is False

    # Reactivate the wallet
    reactivate_resp = admin_client.post(url_for("marketplace.admin_reactivate_wallet", user_id=normal_user_id), json={"reason": "Test reactivate"})
    assert reactivate_resp.status_code == 200
    assert reactivate_resp.get_json()["success"] is True
    assert reactivate_resp.get_json()["status"] is True

    # Verify wallet is active again
    resp_check = normal_client.get(url_for("marketplace.get_wallet"))
    assert resp_check.status_code == 200
    assert resp_check.get_json()["is_active"] is True

def test_admin_get_wallet_audit(admin_auth_client, auth_client):
    admin_client, _ = admin_auth_client
    _, normal_user_id = auth_client

    # Perform some actions to generate audit logs (e.g., freeze/reactivate)
    admin_client.post(url_for("marketplace.admin_freeze_wallet", user_id=normal_user_id), json={"reason": "Audit test freeze"})
    admin_client.post(url_for("marketplace.admin_reactivate_wallet", user_id=normal_user_id), json={"reason": "Audit test reactivate"})

    # Get audit trail
    audit_resp = admin_client.get(url_for("marketplace.admin_get_wallet_audit", user_id=normal_user_id))
    assert audit_resp.status_code == 200
    audit_data = audit_resp.get_json()
    assert isinstance(audit_data, list)
    # Check for expected events
    assert len(audit_data) >= 3 # Freeze, Reactivate, Audit Access Logged
    event_types = [event["event_type"] for event in audit_data]
    assert "wallet_freeze" in event_types
    assert "wallet_reactivate" in event_types
    assert "wallet_audit" in event_types

def test_admin_access_control(auth_client):
    normal_client, normal_user_id = auth_client

    # Try to access admin endpoint as normal user
    freeze_resp = normal_client.post(url_for("marketplace.admin_freeze_wallet", user_id=normal_user_id), json={"reason": "Attempted freeze"})
    assert freeze_resp.status_code == 403 # Expect Forbidden

    audit_resp = normal_client.get(url_for("marketplace.admin_get_wallet_audit", user_id=normal_user_id))
    assert audit_resp.status_code == 403 # Expect Forbidden
