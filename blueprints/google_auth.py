import os
import hashlib
import json
import logging
from flask import Blueprint, redirect, request, url_for, session, flash, render_template
from flask_login import login_user, logout_user, current_user
from oauthlib.oauth2 import WebApplicationClient
import requests
from models import User, db

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

google_auth = Blueprint("google_auth", __name__, url_prefix="/auth")

# Google OAuth2 client configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "").strip()
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

# Add validation with logging
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    logger.error("Google OAuth credentials missing")
    raise RuntimeError("Invalid Google OAuth configuration")

# Initialize OAuth client
client = WebApplicationClient(GOOGLE_CLIENT_ID)

def get_callback_url():
    """Get the callback URL for OAuth"""
    if request.headers.get('X-Forwarded-Proto') == 'https':
        scheme = 'https'
    else:
        scheme = request.scheme
    return url_for('google_auth.callback', _external=True, _scheme=scheme)

def get_google_provider_config():
    """Fetch Google provider configuration"""
    try:
        logger.debug("Fetching Google provider configuration from discovery URL")
        response = requests.get(GOOGLE_DISCOVERY_URL, timeout=10)
        if not response.ok:
            logger.error(f"Failed to fetch Google configuration: {response.status_code}")
            return None
        config = response.json()
        logger.debug("Successfully retrieved Google provider configuration")
        return config
    except Exception as e:
        logger.error(f"Error fetching Google configuration: {str(e)}", exc_info=True)
        return None

@google_auth.route("/login")
def login():
    logger.debug("Starting OAuth login flow")
    
    if current_user.is_authenticated:
        logger.debug(f"User already authenticated: {current_user.email}")
        return redirect(url_for('routes.index'))
    
    # Get Google provider configuration
    google_provider_cfg = get_google_provider_config()
    if not google_provider_cfg:
        logger.error("Failed to fetch Google provider configuration")
        flash("Error connecting to authentication service", "error")
        return redirect(url_for('routes.index'))

    # Generate state token for security
    state = hashlib.sha256(os.urandom(64)).hexdigest()
    session['oauth_state'] = state
    logger.debug(f"Generated OAuth state token: {state[:10]}...")
    
    # Store the next URL if provided
    if 'next' in request.args:
        session['next'] = request.args['next']
        logger.debug(f"Storing next URL: {request.args['next']}")
    
    callback_url = get_callback_url()
    logger.debug(f"Using callback URL: {callback_url}")
    
    # Prepare the authorization request
    request_uri = client.prepare_request_uri(
        google_provider_cfg["authorization_endpoint"],
        redirect_uri=callback_url,
        scope=['openid', 'email', 'profile'],
        state=state
    )
    
    logger.debug(f"Redirecting to Google OAuth: {request_uri}")
    return redirect(request_uri)

@google_auth.route("/callback")
def callback():
    try:
        logger.debug(f"OAuth callback received with args: {request.args}")
        
        # Verify state token to prevent CSRF
        if request.args.get('state') != session.get('oauth_state'):
            logger.error("Invalid state token in callback")
            flash("Authentication failed: Invalid state token", "error")
            return redirect(url_for('routes.index'))

        # Get authorization code from Google
        code = request.args.get("code")
        if not code:
            error = request.args.get('error', 'No authorization code received')
            logger.error(f"OAuth error: {error}")
            flash(f"Authentication failed: {error}", "error")
            return redirect(url_for('routes.index'))

        # Get Google provider configuration
        google_provider_cfg = get_google_provider_config()
        if not google_provider_cfg:
            logger.error("Failed to fetch Google provider configuration in callback")
            flash("Error connecting to authentication service", "error")
            return redirect(url_for('routes.index'))

        callback_url = get_callback_url()
        logger.debug(f"Using callback URL in token request: {callback_url}")

        # Prepare and send token request
        token_url, headers, body = client.prepare_token_request(
            google_provider_cfg["token_endpoint"],
            authorization_response=request.url,
            redirect_url=callback_url,
            code=code
        )
        
        logger.debug("Sending token request to Google")
        
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            timeout=10
        )

        # Handle token response
        if not token_response.ok:
            logger.error(f"Token request failed: {token_response.status_code}")
            flash("Failed to authenticate with Google", "error")
            return redirect(url_for('routes.index'))

        # Parse token response
        client.parse_request_body_response(token_response.text)
        logger.debug("Successfully parsed token response")

        # Get user info from Google
        logger.debug("Fetching user info from Google")
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
        userinfo_response = requests.get(
            userinfo_endpoint,
            headers={'Authorization': f'Bearer {client.token["access_token"]}'},
            timeout=10
        )

        if not userinfo_response.ok:
            logger.error(f"Failed to get user info: {userinfo_response.status_code}")
            flash("Failed to get user information", "error")
            return redirect(url_for('routes.index'))

        # Process user data
        userinfo = userinfo_response.json()
        logger.debug(f"Received user info for email: {userinfo.get('email', 'unknown')}")
        
        if not userinfo.get("email_verified"):
            logger.error("User email not verified")
            flash("Google account email not verified", "error")
            return redirect(url_for('routes.index'))

        # Get or create user
        user = User.query.filter_by(email=userinfo["email"]).first()
        if not user:
            logger.debug(f"Creating new user: {userinfo['email']}")
            user = User(
                email=userinfo["email"],
                username=userinfo.get("name", userinfo["email"].split("@")[0]),
                profile_pic=userinfo.get("picture")
            )
            db.session.add(user)
        else:
            logger.debug(f"Updating existing user: {user.email}")
            user.username = userinfo.get("name", user.username)
            user.profile_pic = userinfo.get("picture", user.profile_pic)
        
        db.session.commit()
        login_user(user)
        logger.info(f"User {user.email} logged in successfully")
        
        # Redirect to next URL if available
        next_url = session.pop('next', url_for('routes.index'))
        return redirect(next_url)

    except Exception as e:
        logger.error(f"Callback error: {str(e)}", exc_info=True)
        flash("Authentication failed. Please try again.", "error")
        return redirect(url_for('routes.index'))

@google_auth.route("/logout")
def logout():
    logger.debug(f"Logging out user: {current_user.email if current_user.is_authenticated else 'anonymous'}")
    logout_user()
    return redirect(url_for('routes.index'))

@google_auth.errorhandler(403)
def handle_403_error(error):
    logger.error(f"403 error: {str(error)}")
    return render_template('error.html', error_code=403, message="Access forbidden"), 403
