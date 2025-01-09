"""Main routes for the application."""
from flask import Blueprint, render_template, request
from dojopool.routes.auth.views import login_required, session_manager
from dojopool.models.user import User

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Landing page."""
    return render_template('index.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    """User dashboard."""
    session_token = request.cookies.get('session_token')
    session_data = session_manager.validate_session(session_token)
    user = User.query.get(session_data['user_id'])
    
    return render_template('dashboard.html', user=user)

@main_bp.route('/terms')
def terms():
    """Terms of service."""
    return render_template('terms.html')

@main_bp.route('/privacy')
def privacy():
    """Privacy policy."""
    return render_template('privacy.html')