"""Main views.

This module provides the main routes for the application.
"""

from flask import (
    Blueprint, render_template, redirect,
    url_for, flash, request, jsonify
)
from flask_login import current_user, login_required

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    """Render index page."""
    return render_template('index.html')

@bp.route('/dashboard')
@login_required
def dashboard():
    """Render dashboard page."""
    return render_template('dashboard.html')

@bp.route('/profile')
@login_required
def profile():
    """Render profile page."""
    return render_template('profile.html')

@bp.route('/settings')
@login_required
def settings():
    """Render settings page."""
    return render_template('settings.html')

@bp.route('/about')
def about():
    """Render about page."""
    return render_template('about.html')

@bp.route('/contact')
def contact():
    """Render contact page."""
    return render_template('contact.html') 