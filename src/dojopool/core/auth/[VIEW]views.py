"""Authentication views.

This module provides the authentication-related routes and views.
"""

from flask import (
    Blueprint, request, jsonify, current_app,
    url_for, render_template, redirect, flash
)
from flask_login import (
    login_user, logout_user, login_required,
    current_user
)
from urllib.parse import urlparse, urljoin

from src.core import db, User, Role
from src.core.auth import auth_service
from src.core.auth.totp import TOTPService
from src.core.auth.oauth import oauth
from src.core.auth.password import password_manager
from src.core.auth.exceptions import (
    AuthenticationError,
    RegistrationError,
    InvalidTokenError
)
from src.core.auth.forms import (
    LoginForm, RegistrationForm,
    ResetPasswordForm, ForgotPasswordForm
)

bp = Blueprint('auth', __name__)

def wants_json_response():
    """Check if client wants JSON response."""
    return request.accept_mimetypes.best == 'application/json'

@bp.route('/register', methods=['GET', 'POST'])
def register():
    """Register a new user."""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'GET':
        return render_template('auth/register.html')
        
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form
    
    try:
        user = auth_service.register(
            username=data['username'],
            email=data['email'],
            os.getenv("PASSWORD_36")]
        )
        
        if wants_json_response():
            return jsonify({
                'message': 'Registration successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }), 201
            
        flash('Registration successful. Please check your email to verify your account.', 'success')
        return redirect(url_for('auth.login'))
        
    except RegistrationError as e:
        if wants_json_response():
            return jsonify({'error': str(e)}), 400
        flash(str(e), 'error')
        return redirect(url_for('auth.register'))
    except KeyError:
        if wants_json_response():
            return jsonify({'error': 'Missing required fields'}), 400
        flash('Missing required fields', 'error')
        return redirect(url_for('auth.register'))

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """Log in a user."""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'GET':
        return render_template('auth/login.html')
        
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form
    
    try:
        user = auth_service.authenticate(
            email=data['email'],
            os.getenv("PASSWORD_36")],
            totp_token=data.get('totp_token')
        )
        
        login_user(user, remember=data.get('remember_me', False))
        
        if wants_json_response():
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
            
        next_page = request.args.get('next')
        if not next_page or urlparse(next_page).netloc != '':
            next_page = url_for('dashboard')
        return redirect(next_page)
        
    except AuthenticationError as e:
        if wants_json_response():
            return jsonify({'error': str(e)}), 401
        flash(str(e), 'error')
        return redirect(url_for('auth.login'))
    except KeyError:
        if wants_json_response():
            return jsonify({'error': 'Missing required fields'}), 400
        flash('Missing required fields', 'error')
        return redirect(url_for('auth.login'))

@bp.route('/logout')
@login_required
def logout():
    """Log out the current user."""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@bp.route('/verify-email/<token>')
def verify_email(token):
    """Verify user's email address."""
    try:
        user = auth_service.verify_email(token)
        flash('Email verified successfully. You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    except InvalidTokenError as e:
        flash(str(e), 'error')
        return redirect(url_for('auth.login'))

@bp.route('/reset-password', methods=['GET', 'POST'])
def request_password_reset():
    """Request password reset."""
    if request.method == 'GET':
        return render_template('auth/forgot_password.html')
        
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form
    
    if 'email' not in data:
        if wants_json_response():
            return jsonify({'error': 'Email required'}), 400
        flash('Email is required', 'error')
        return redirect(url_for('auth.request_password_reset'))
        
    try:
        auth_service.send_password_reset(data['email'])
        
        if wants_json_response():
            return jsonify({'message': 'If your email is registered, you will receive reset instructions'})
        flash('If your email is registered, you will receive reset instructions.', 'info')
        return redirect(url_for('auth.login'))
    except Exception as e:
        if wants_json_response():
            return jsonify({'error': str(e)}), 400
        flash(str(e), 'error')
        return redirect(url_for('auth.request_password_reset'))

@bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Reset password with token."""
    if request.method == 'GET':
        return render_template('auth/reset_password.html', token=token)
        
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form
    
    try:
        auth_service.reset_os.getenv("PASSWORD_36")])
        
        if wants_json_response():
            return jsonify({'message': 'Password reset successfully'})
        flash('Password reset successfully. You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    except (InvalidTokenError, KeyError) as e:
        if wants_json_response():
            return jsonify({'error': str(e)}), 400
        flash(str(e), 'error')
        return redirect(url_for('auth.login')) 