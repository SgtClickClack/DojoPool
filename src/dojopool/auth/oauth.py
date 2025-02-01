"""OAuth module for authentication."""

import requests
from flask import current_app, url_for
from oauthlib.oauth2 import WebApplicationClient


class GoogleOAuth:
    """Google OAuth client."""

    GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

    def __init__(self):
        """Initialize Google OAuth client."""
        self.client_id = current_app.config["GOOGLE_CLIENT_ID"]
        self.client_secret = current_app.config["GOOGLE_CLIENT_SECRET"]
        self.client = WebApplicationClient(self.client_id)

        # Get Google provider configuration
        try:
            self.provider_cfg = requests.get(self.GOOGLE_DISCOVERY_URL).json()
        except Exception as e:
            current_app.logger.error(f"Failed to get Google provider config: {e}")
            self.provider_cfg = None

    def get_auth_url(self):
        """Get Google OAuth authorization URL."""
        if not self.provider_cfg:
            return None

        # Find out what URL to hit for Google login
        authorization_endpoint = self.provider_cfg["authorization_endpoint"]

        # Use library to construct the request for Google login
        # and provide the redirect URI where Google will respond
        request_uri = self.client.prepare_request_uri(
            authorization_endpoint,
            redirect_uri=url_for("auth.google_callback", _external=True),
            scope=["openid", "email", "profile"],
        )

        return request_uri

    def get_token_url(self):
        """Get Google OAuth token URL."""
        return self.provider_cfg["token_endpoint"] if self.provider_cfg else None

    def get_userinfo_url(self):
        """Get Google OAuth userinfo URL."""
        return self.provider_cfg["userinfo_endpoint"] if self.provider_cfg else None

    def prepare_token_request(self, authorization_response, redirect_url):
        """Prepare token request."""
        return self.client.prepare_token_request(
            self.get_token_url(),
            authorization_response=authorization_response,
            redirect_url=redirect_url,
            client_secret=self.client_secret,
        )

    def parse_token_response(self, token_response):
        """Parse token response."""
        return self.client.parse_request_body_response(token_response)

    def add_token(self, token):
        """Add token to client."""
        self.client.token = token

    def prepare_userinfo_request(self, token=None):
        """Prepare userinfo request."""
        if token:
            self.add_token(token)
        return self.client.add_token(self.get_userinfo_url())
