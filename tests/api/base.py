"""Base test class for API tests."""
import pytest
from dojopool.models import User
from dojopool.core.db import db
from dojopool.core.auth.service import auth_service

class ApiTestBase:
    """Base test class for API tests."""
    
    @pytest.fixture(autouse=True)
    def setup_method(self, client, db_session):
        """Set up test data."""
        self.client = client
        self.db_session = db_session
        
        # Create test user
        self.user = User(
            username="testuser",
            email="test@example.com"
        )
        self.user.set_password("password123")
        self.user.is_verified = True
        self.db_session.add(self.user)
        self.db_session.commit()
        
        # Create auth token
        self.token = auth_service.create_token(self.user)
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
    