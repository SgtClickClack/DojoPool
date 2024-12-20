"""API test configuration and utilities."""

import json
from typing import Dict, Any, Optional
from flask.testing import FlaskClient

class ApiTestBase:
    """Base class for API tests with common utilities."""
    
    def __init__(self, client: FlaskClient):
        self.client = client
        self.base_url = '/api/v1'
    
    def get(self, endpoint: str, headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a GET request to the API."""
        response = self.client.get(
            f"{self.base_url}/{endpoint.lstrip('/')}",
            headers=headers
        )
        return {
            'status': response.status_code,
            'data': json.loads(response.data) if response.data else None
        }
    
    def post(self, endpoint: str, data: Dict, headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a POST request to the API."""
        response = self.client.post(
            f"{self.base_url}/{endpoint.lstrip('/')}",
            json=data,
            headers=headers
        )
        return {
            'status': response.status_code,
            'data': json.loads(response.data) if response.data else None
        }
    
    def put(self, endpoint: str, data: Dict, headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a PUT request to the API."""
        response = self.client.put(
            f"{self.base_url}/{endpoint.lstrip('/')}",
            json=data,
            headers=headers
        )
        return {
            'status': response.status_code,
            'data': json.loads(response.data) if response.data else None
        }
    
    def delete(self, endpoint: str, headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a DELETE request to the API."""
        response = self.client.delete(
            f"{self.base_url}/{endpoint.lstrip('/')}",
            headers=headers
        )
        return {
            'status': response.status_code,
            'data': json.loads(response.data) if response.data else None
        } 