"""OAuth authentication module."""

from typing import Any, Dict, List, Optional, Tuple, Union

from flask import Blueprint, Response, current_app, request, url_for
from flask.typing import ResponseReturnValue
from oauthlib.oauth2 import WebApplicationClient
from werkzeug.wrappers import Response as WerkzeugResponse

oauth_bp: Blueprint = Blueprint("oauth", __name__)
oauth_client: Optional[WebApplicationClient] = None


def init_oauth(client_id: str) -> None:
    """Initialize OAuth client.

    Args:
        client_id: OAuth client ID
    """
    global oauth_client
    oauth_client = WebApplicationClient(client_id)


@oauth_bp.route("/login/<provider>")
def oauth_login(provider: str) -> Response:
    """Handle OAuth login request.

    Args:
        provider: OAuth provider name

    Returns:
        Response: Redirect to provider's authorization URL
    """
    if provider not in current_app.config["OAUTH_PROVIDERS"]:
        return Response("Invalid provider", status=400)

    provider_config = current_app.config["OAUTH_PROVIDERS"][provider]
    request_uri = oauth_client.prepare_request_uri(
        provider_config["authorization_endpoint"],
        redirect_uri=url_for("oauth.callback", provider=provider, _external=True),
        scope=provider_config["scope"],
    )
    return Response(status=302, headers={"Location": request_uri})
