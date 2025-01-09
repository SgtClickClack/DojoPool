"""
API key configuration and validation module for DojoPool.
This module manages all external API integrations and their respective keys.
"""
import os
from typing import Optional
from functools import lru_cache
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class APIKeyManager:
    """Manages API keys and their validation for various services."""
    
    def __init__(self):
        self.google_maps_key: str = os.getenv('GOOGLE_MAPS_API_KEY', '')
        self.openai_key: str = os.getenv('OPENAI_API_KEY', '')
        self.websocket_secret: str = os.getenv('WEBSOCKET_SECRET', '')
        
    @lru_cache(maxsize=1)
    def validate_google_maps_key(self) -> tuple[bool, Optional[str]]:
        """Validate Google Maps API key."""
        if not self.google_maps_key:
            return False, "Google Maps API key not found in environment variables"
            
        try:
            # Test the API key with a simple geocoding request
            test_url = f"https://maps.googleapis.com/maps/api/geocode/json?address=test&key={self.google_maps_key}"
            response = requests.get(test_url)
            data = response.json()
            
            if response.status_code == 200 and data.get('status') != 'REQUEST_DENIED':
                return True, None
            return False, f"API key validation failed: {data.get('error_message', 'Unknown error')}"
            
        except Exception as e:
            return False, f"Error validating Google Maps API key: {str(e)}"
    
    @lru_cache(maxsize=1)
    def validate_openai_key(self) -> tuple[bool, Optional[str]]:
        """Validate OpenAI API key."""
        if not self.openai_key:
            return False, "OpenAI API key not found in environment variables"
            
        try:
            headers = {
                'Authorization': f'Bearer {self.openai_key}',
                'Content-Type': 'application/json'
            }
            # Simple model list request to validate key
            response = requests.get('https://api.openai.com/v1/models', headers=headers)
            
            if response.status_code == 200:
                return True, None
            return False, f"OpenAI API key validation failed: {response.text}"
            
        except Exception as e:
            return False, f"Error validating OpenAI API key: {str(e)}"
    
    def get_google_maps_key(self) -> str:
        """Get Google Maps API key with validation."""
        is_valid, error = self.validate_google_maps_key()
        if not is_valid:
            raise ValueError(f"Invalid Google Maps API key: {error}")
        return self.google_maps_key
    
    def get_openai_key(self) -> str:
        """Get OpenAI API key with validation."""
        is_valid, error = self.validate_openai_key()
        if not is_valid:
            raise ValueError(f"Invalid OpenAI API key: {error}")
        return self.openai_key
    
    def get_websocket_secret(self) -> str:
        """Get WebSocket secret key."""
        if not self.websocket_secret:
            raise ValueError("WebSocket secret key not found in environment variables")
        return self.websocket_secret

# Create a singleton instance
api_keys = APIKeyManager() 