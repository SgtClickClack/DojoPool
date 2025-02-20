"""
OAuth authentication module.

This module provides OAuth-based authentication with social providers.
"""

from typing import Any, Dict, Optional

from authlib.integrations.flask_client import OAuth
from flask import current_app, g, url_for
from werkzeug.wrappers import Response as WerkzeugResponse

from ..extensions import db
from .models import User

oauth = OAuth()


def init_oauth(app: Any) -> None:
    """Initialize OAuth providers.

    Args:
        app: Flask application instance
    """
    oauth.init_app(app)

    # Configure Google
    if app.config["OAUTH_PROVIDERS"].get("google"):
        oauth.register(
            name="google",
            client_id=app.config["OAUTH_PROVIDERS"]["google"]["client_id"],
            client_secret=app.config["OAUTH_PROVIDERS"]["google"]["client_secret"],
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )

    # Configure GitHub
    if app.config["OAUTH_PROVIDERS"].get("github"):
        oauth.register(
            name="github",
            client_id=app.config["OAUTH_PROVIDERS"]["github"]["client_id"],
            client_secret=app.config["OAUTH_PROVIDERS"]["github"]["client_secret"],
            access_token_url="https://github.com/login/oauth/access_token",
            access_token_params=None,
            authorize_url="https://github.com/login/oauth/authorize",
            authorize_params=None,
            api_base_url="https://api.github.com/",
            client_kwargs={"scope": "user:email"},
        )


class OAuthService:
    """Service for handling OAuth authentication."""

    @staticmethod
    def get_oauth_redirect_url(provider: str) -> str:
        """Get OAuth redirect URL.

        Args:
            provider: OAuth provider name

        Returns:
            Redirect URL for OAuth flow
        """
        return url_for("auth.oauth_callback", provider=provider, _external=True)

    @staticmethod
    def get_user_from_oauth(provider: str, token: Dict[str, Any]):
        """Get or create user from OAuth data.

        Args:
            provider: OAuth provider name
            token: OAuth token data

        Returns:
            User instance or None if failed
        """
        if provider == "google":
            userinfo = oauth.google.get("oauth2/v2/userinfo").json()
            oauth_id = userinfo["id"]
            email = userinfo["email"]
            username = userinfo["email"].split("@")[0]

        elif provider == "github":
            resp = oauth.github.get("user").json()
            oauth_id = str(resp["id"])
            email = resp["email"]
            username = resp["login"]

        else:
            return None

        # Find existing user
        user = User.query.filter_by(oauth_provider=provider, oauth_id=oauth_id).first()

        if user:
            return user

        # Create new user
        user = User(
            username=username,
            email=email,
            oauth_provider=provider,
            oauth_id=oauth_id,
            email_verified=True,  # OAuth emails are verified
        )

        # Generate random password for OAuth users
        import secrets

        user.password = secrets.token_urlsafe(32)

        db.session.add(user)
        db.session.commit()

        return user

    @staticmethod
    def link_oauth_account(user: User, provider: str, token: Dict[str, Any]):
        """Link OAuth account to existing user.

        Args:
            user: User to link account to
            provider: OAuth provider name
            token: OAuth token data

        Returns:
            True if account was linked
        """
        try:
            if provider == "google":
                userinfo = oauth.google.get("oauth2/v2/userinfo").json()
                oauth_id = userinfo["id"]
            elif provider == "github":
                resp = oauth.github.get("user").json()
                oauth_id = str(resp["id"])
            else:
                return False

            # Check if already linked to another user
            existing = User.query.filter_by(
                oauth_provider=provider, oauth_id=oauth_id
            ).first()

            if existing and existing.id != user.id:
                return False

            user.oauth_provider = provider
            user.oauth_id = oauth_id
            db.session.commit()

            return True

        except Exception:
            return False
