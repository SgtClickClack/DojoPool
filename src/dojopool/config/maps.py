"""Google Maps configuration and API key management module."""

import os
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Any, Dict, Optional, Tuple

import requests


class MapsConfig:
    """Manages Google Maps configuration and API key."""

    def __init__(self):
        self._api_key: Optional[str] = None
        self._last_validation: Optional[datetime] = None
        self._validation_cache_duration = timedelta(hours=1)

        # Default map configuration
        self.default_center = {"lat": 51.5074, "lng": -0.1278}  # London
        self.default_zoom = 13
        self.map_styles = [
            {"elementType": "geometry", "stylers": [{"color": "#242f3e"}]},
            {"elementType": "labels.text.stroke", "stylers": [{"color": "#242f3e"}]},
            {"elementType": "labels.text.fill", "stylers": [{"color": "#746855"}]},
        ]
        self.map_options = {
            "mapTypeControl": False,
            "streetViewControl": False,
            "fullscreenControl": True,
            "zoomControl": True,
            "styles": self.map_styles,
        }

    @property
    def api_key(self) -> str:
        """Get the Google Maps API key with validation."""
        if not self._api_key:
            self._api_key = self._load_api_key()
        return self._api_key

    def _load_api_key(self):
        """Load the API key from environment variables."""
        key = os.getenv("GOOGLE_MAPS_API_KEY")
        if not key:
            raise ValueError(
                "Google Maps API key not found. "
                "Please set the GOOGLE_MAPS_API_KEY environment variable."
            )
        return key

    @lru_cache(maxsize=1)
    def validate_api_key(self):
        """Validate the Google Maps API key.

        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message)
        """
        # Check if we have a recent validation result
        if (
            self._last_validation
            and datetime.now() - self._last_validation < self._validation_cache_duration
        ):
            return True, None

        try:
            # Test the API key with a simple geocoding request
            test_url = (
                "https://maps.googleapis.com/maps/api/geocode/json"
                f"?address=test&key={self.api_key}"
            )
            response = requests.get(test_url, timeout=5)
            data = response.json()

            if response.status_code == 200 and data.get("status") != "REQUEST_DENIED":
                self._last_validation = datetime.now()
                return True, None

            return (
                False,
                f"API key validation failed: {data.get('error_message', 'Unknown error')}",
            )

        except requests.exceptions.Timeout:
            return False, "API key validation timed out"
        except requests.exceptions.RequestException as e:
            return False, f"Error validating API key: {str(e)}"
        except Exception as e:
            return False, f"Unexpected error during validation: {str(e)}"

    def get_frontend_config(self) -> Dict[str, Any]:
        """Get configuration for frontend use.

        Returns:
            Dict[str, Any]: Configuration dictionary for frontend

        Raises:
            ValueError: If API key is invalid
        """
        is_valid, error = self.validate_api_key()
        if not is_valid:
            raise ValueError(f"Invalid Google Maps API key: {error}")

        return {
            "api_key": self.api_key,
            "default_center": self.default_center,
            "default_zoom": self.default_zoom,
            "styles": self.map_styles,
            "options": self.map_options,
        }

    def get_map_url(self, libraries: Optional[str] = None):
        """Get the Google Maps API URL.

        Args:
            libraries: Comma-separated list of libraries to load

        Returns:
            str: The complete URL for loading the Google Maps API
        """
        base_url = "https://maps.googleapis.com/maps/api/js"
        params = [f"key={self.api_key}"]

        if libraries:
            params.append(f"libraries={libraries}")

        params.extend(["callback=initMap", "v=weekly", "loading=async"])

        return f'{base_url}?{"&".join(params)}'


# Global instance
maps_config = MapsConfig()
