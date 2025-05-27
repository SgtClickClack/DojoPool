import pytest
from flask import g, Blueprint
from flask.testing import FlaskClient
from dojopool.app import create_app
from dojopool.core.extensions import db

from dojopool.core.rewards.routes import rewards_bp
from dojopool.core.rewards.service import RewardsService
from dojopool.models import User
from dojopool.core.rewards.models import Reward, UserReward

# TODO: Add fixtures for test application, test database, and test client
# These fixtures should set up a minimal Flask app with the rewards blueprint,
# an in-memory database, and a test client for making requests.

@pytest.fixture(scope="module")
def test_client():
    # Create a test app and add the rewards blueprint
    app = create_app(testing=True)
    # Assuming create_app can accept blueprints to register, or we register it after creation
    # If not, we might need a custom test app factory or register directly

    # Option 1: Assuming create_app can take blueprints
    # app = create_app(testing=True, blueprints=[rewards_bp])

    # Option 2: Register blueprint after creation if possible
    # Let's assume Option 2 is viable or required structure
    app.register_blueprint(rewards_bp, url_prefix='/rewards') # Assuming /rewards prefix from routes.py
    # Note: The route /shop/purchase is relative to the blueprint prefix, so it will be /rewards/shop/purchase
    # Need to confirm the actual URL prefix used when registering rewards_bp in the main app.
    # Let's assume the routes are registered at the root for now based on the frontend fetch call '/api/rewards/shop-items'
    # and the backend route '/shop/purchase' - this implies a /api/rewards prefix somewhere else.
    # Let's adjust the Blueprint registration temporarily for testing to match the frontend expectation.

    # Adjusting Blueprint registration for testing purposes to match frontend fetch:
    # The frontend fetches from "/api/rewards/shop-items" and the backend route is "/shop/purchase"
    # This implies the rewards_bp might be registered with url_prefix='/api/rewards'.
    # Let's try that for test purposes, but note it might need adjustment based on actual app setup.
    # Assuming /api prefix is handled higher up, and rewards_bp is registered at /rewards within that.
    # Or, the frontend path is incorrect/simplified.
    # Let's use the backend route structure directly and assume the test client uses it.
    # The route is @rewards_bp.route("/shop/purchase") so the full path is derived from rewards_bp registration.
    # If rewards_bp is registered at '/' in the test app for simplicity:
    test_app_instance = create_app(testing=True)
    # Assuming a simplified test setup where the blueprint routes are directly accessible
    # Or we need to mock the API endpoint behavior.
    # Let's assume we can register the blueprint directly for testing.
    # We need access to the Blueprint object itself, which is imported.

    # Let's use the achievement test pattern which seems to create a minimal app with relevant blueprints.
    # The achievement test uses `create_app(testing=True)` which likely sets up the full app including rewards_bp.
    # Let's stick to that pattern.
    test_app_instance = create_app(testing=True)

    with test_app_instance.app_context():
        db.create_all()

        # Create test data (user and reward)
        user = User(id=1, points=200) # Create a test user with some points
        db.session.add(user)
        db.session.commit()

        reward = Reward(
            id=101, # Assign a specific ID for testing
            name="Test Shop Item",
            description="A test item from the shop",
            points_cost=50,
            quantity_available=10,
            is_active=True
            # TODO: Add other necessary reward attributes if purchase logic uses them
        )
        db.session.add(reward)
        db.session.commit()

        yield test_app_instance.test_client() # Yield the test client

        db.session.remove() # Clean up session
        db.drop_all() # Drop tables

# Helper to mock authentication and g.user_id
def login_context(client: FlaskClient, user_id: int = 1):
    # Flask's test_request_context can be used to set g.user_id
    # Need to push a request context to access g
    ctx = client.application.test_request_context()
    ctx.push()
    g.user_id = user_id # Set the user ID on the global context object 'g'
    # We might also need to mock request.user if the decorator expects that.
    # The `@login_required` decorator in decorators.py likely sets request.user.
    # We should check how `login_required` works or mock it.
    # Let's assume for now setting g.user_id is sufficient based on how it was used in achievements tests.
    # If request.user is needed, we might need to mock `load_user_from_request` or similar.
    # Let's check the login_required decorator source.

    # Based on achievement test comment "Assuming user is attached to request by auth decorator",
    # it seems `request.user.id` is expected. We might need to mock `request.user`.
    # Let's add a patch for request.user for a more accurate simulation.
    from flask import request
    user = User.query.get(user_id)
    if user:
         patcher = patch('flask.request.user', user)
         patcher.start()
         # Store patcher to stop it later
         ctx._patcher = patcher
    else:
         ctx._patcher = None # No patcher if user not found


    return ctx # Return context to be used in a 'with' statement


def logout_context(ctx):
    # Pop the request context
    ctx.pop()
    # Stop the patcher if it exists
    if hasattr(ctx, '_patcher') and ctx._patcher:
        ctx._patcher.stop()

class TestRewardsRoutes:
    # TODO: Add fixtures (e.g., test_client, test_db, create_test_user, create_test_reward)

    def test_purchase_shop_item_success(self, test_client):
        client = test_client
        item_id_to_purchase = 101 # Match the ID created in test_client fixture
        user_id_making_purchase = 1 # Match the user ID created in test_client fixture

        # Use login_context to simulate authenticated user
        with login_context(client, user_id=user_id_making_purchase):
            # Make POST request to purchase endpoint
            response = client.post(
                '/shop/purchase', # Assuming rewards_bp is registered at '/'
                json={'itemId': item_id_to_purchase}
            )

            # Assert response status code and body
            assert response.status_code == 200
            data = response.get_json()
            assert data is not None
            assert "message" in data
            assert data['message'] == "Item purchased successfully"

            # Verify changes in the database (optional but good practice for integration tests)
            # Access the database using db.session
            with client.application.app_context():
                # Verify user points deduction
                user = User.query.get(user_id_making_purchase)
                # We need to know the initial points and item cost. Initial user points are 200, cost is 50.
                assert user.points == 200 - 50 # Expected remaining points

                # Verify UserReward entry created
                user_reward = UserReward.query.filter_by(
                    user_id=user_id_making_purchase,
                    reward_id=item_id_to_purchase
                ).first()
                assert user_reward is not None
                assert user_reward.status == "purchased"
                assert user_reward.points_spent == 50 # Verify points spent recorded

    def test_purchase_shop_item_unauthenticated(self, test_client):
        client = test_client
        item_id_to_purchase = 101

        # Make POST request without authentication context
        response = client.post(
            '/shop/purchase',
            json={'itemId': item_id_to_purchase}
        )

        # Assert response status code (should be unauthorized)
        assert response.status_code == 401 # Assuming 401 for unauthenticated
        # Optional: Assert response body for error message
        data = response.get_json()
        assert data is not None
        assert "error" in data or "message" in data # Check for some indication of error

    def test_purchase_shop_item_insufficient_points(self, test_client):
        client = test_client
        # Create a user with insufficient points (fixture already creates user with 200 points, item costs 50)
        # Need to create a new user with less than 50 points or update the existing one for this test.
        # Let's create a new user with ID 2 and 30 points.
        user_id_insufficient_points = 2
        item_id_to_purchase = 101
        with client.application.app_context():
             user = User(id=user_id_insufficient_points, points=30)
             db.session.add(user)
             db.session.commit()

        with login_context(client, user_id=user_id_insufficient_points):
            response = client.post(
                '/shop/purchase',
                json={'itemId': item_id_to_purchase}
            )

            # Assert response status code (should be bad request or similar for insufficient funds)
            # The backend returns 400 with "Failed to purchase item"
            assert response.status_code == 400
            data = response.get_json()
            assert data is not None
            assert "error" in data
            assert data['error'] == "Failed to purchase item"

            # Verify user points not deducted
            with client.application.app_context():
                 updated_user = User.query.get(user_id_insufficient_points)
                 assert updated_user.points == 30 # Points should remain unchanged

            # Verify no UserReward entry created
            with client.application.app_context():
                 user_reward = UserReward.query.filter_by(user_id=user_id_insufficient_points, reward_id=item_id_to_purchase).first()
                 assert user_reward is None

    def test_purchase_shop_item_not_found(self, test_client):
        client = test_client
        user_id_making_purchase = 1 # Use the user created in the fixture
        non_existent_item_id = 999 # An ID that does not exist

        with login_context(client, user_id=user_id_making_purchase):
            response = client.post(
                '/shop/purchase',
                json={'itemId': non_existent_item_id}
            )

            # Assert response status code (should be not found or bad request)
            # The backend returns 400 with "Failed to purchase item" if item not found in service.
            assert response.status_code == 400 # Or potentially 404 if handled in route
            data = response.get_json()
            assert data is not None
            assert "error" in data
            assert data['error'] == "Failed to purchase item" # Based on service return

            # Verify user points not deducted
            with client.application.app_context():
                 user = User.query.get(user_id_making_purchase)
                 assert user.points == 200 # Points should remain unchanged from initial fixture setup

            # Verify no UserReward entry created
            with client.application.app_context():
                 user_reward = UserReward.query.filter_by(user_id=user_id_making_purchase, reward_id=non_existent_item_id).first()
                 assert user_reward is None

    def test_purchase_shop_item_invalid_input(self, test_client):
        client = test_client
        user_id_making_purchase = 1 # Use the user created in the fixture

        with login_context(client, user_id=user_id_making_purchase):
            # Test case 1: Missing itemId in payload
            response_missing_item_id = client.post(
                '/shop/purchase',
                json={}
            )

            # Assert response status code (should be bad request)
            assert response_missing_item_id.status_code == 400
            data_missing_item_id = response_missing_item_id.get_json()
            assert data_missing_item_id is not None
            assert "error" in data_missing_item_id
            assert data_missing_item_id['error'] == "Item ID is required"

            # Test case 2: Invalid payload format (e.g., not JSON)
            response_invalid_json = client.post(
                '/shop/purchase',
                data="not a json string",
                headers={'Content-Type': 'text/plain'}
            )

            # The backend might return 400 or 415 (Unsupported Media Type)
            # Based on the route's `request.get_json()` and exception handling, 400 is likely.
            assert response_invalid_json.status_code == 400
            data_invalid_json = response_invalid_json.get_json()
            assert data_invalid_json is not None
            assert "error" in data_invalid_json # Should indicate a JSON parsing error

            # Verify user points not deducted for both invalid cases
            with client.application.app_context():
                 user = User.query.get(user_id_making_purchase)
                 assert user.points == 200 # Points should remain unchanged

    # TODO: Add more integration test cases (e.g., insufficient points, item not found, invalid input) 