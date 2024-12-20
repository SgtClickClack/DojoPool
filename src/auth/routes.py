"""Authentication routes."""
from flask import (
    Blueprint, request, jsonify, render_template,
    redirect, url_for, flash, current_app
)
from flask_login import login_user, logout_user, login_required, current_user
from src.models.user import User
from src.models.token import Token
from src.core.database import db
from src.auth.utils import get_safe_redirect_url
from src.email.service import send_verification_email, send_password_reset_email

auth_bp = Blueprint('auth', __name__)

def wants_json_response():
    """Check if client wants a JSON response."""
    return request.is_json or 'application/json' in request.headers.get('Accept', '')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Register a new user."""
    if request.method == 'GET':
        if wants_json_response():
            return jsonify({'message': 'Registration endpoint'}), 200
        return render_template('auth/register.html')
    
    data = request.get_json() if request.is_json else request.form
    
    # Validate input
    if not all(k in data for k in ['username', 'email', 'password']):
        if wants_json_response():
            return jsonify({'error': 'Missing required fields'}), 400
        flash('Missing required fields', 'error')
        return redirect(url_for('auth.register'))
    
    if data.get('password') != data.get('confirm_password'):
        if wants_json_response():
            return jsonify({'error': 'Passwords do not match'}), 400
        flash('Passwords do not match', 'error')
        return redirect(url_for('auth.register'))
    
    # Check if user exists
    if User.query.filter_by(username=data['username']).first():
        if wants_json_response():
            return jsonify({'error': 'Username already exists'}), 400
        flash('Username already exists', 'error')
        return redirect(url_for('auth.register'))
    
    if User.query.filter_by(email=data['email']).first():
        if wants_json_response():
            return jsonify({'error': 'Email already exists'}), 400
        flash('Email already exists', 'error')
        return redirect(url_for('auth.register'))
    
    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    # Send verification email
    try:
        send_verification_email(user)
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email: {e}")
    
    if wants_json_response():
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201
    
    flash('Registration successful. Please check your email to verify your account.', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Log in a user."""
    if request.method == 'GET':
        if wants_json_response():
            return jsonify({'message': 'Login endpoint'}), 200
        return render_template('auth/login.html')
    
    data = request.get_json() if request.is_json else request.form
    
    # Validate input
    if not all(k in data for k in ['email', 'password']):
        if wants_json_response():
            return jsonify({'error': 'Missing required fields'}), 400
        flash('Missing required fields', 'error')
        return redirect(url_for('auth.login'))
    
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        if wants_json_response():
            return jsonify({'error': 'Invalid credentials'}), 401
        flash('Invalid credentials', 'error')
        return redirect(url_for('auth.login'))
    
    if not user.is_verified:
        if wants_json_response():
            return jsonify({'error': 'Please verify your email first'}), 403
        flash('Please verify your email first', 'error')
        return redirect(url_for('auth.login'))
    
    # Log in user
    login_user(user, remember=data.get('remember_me', False))
    user.update_last_login()
    
    # Generate access token for API
    token = Token.generate_token(user.id, 'access', expires_in=3600)
    
    if wants_json_response():
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': token.token
        }), 200
    
    next_page = get_safe_redirect_url()
    return redirect(next_page or url_for('main.index'))

@auth_bp.route('/verify-email/<token>')
def verify_email(token):
    """Verify user's email address."""
    token_obj = Token.verify_token(token, 'verify_email')
    if not token_obj:
        if wants_json_response():
            return jsonify({'error': 'Invalid or expired token'}), 400
        flash('Invalid or expired verification link', 'error')
        return redirect(url_for('auth.login'))
    
    user = User.query.get(token_obj.user_id)
    if not user:
        if wants_json_response():
            return jsonify({'error': 'User not found'}), 404
        flash('User not found', 'error')
        return redirect(url_for('auth.login'))
    
    user.verify_email()
    token_obj.revoke()
    
    if wants_json_response():
        return jsonify({'message': 'Email verified successfully'}), 200
    
    flash('Email verified successfully. You can now log in.', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email."""
    data = request.get_json() if request.is_json else request.form
    email = data.get('email')
    
    if not email:
        if wants_json_response():
            return jsonify({'error': 'Email is required'}), 400
        flash('Email is required', 'error')
        return redirect(url_for('auth.login'))
    
    user = User.query.filter_by(email=email).first()
    if not user:
        if wants_json_response():
            return jsonify({'error': 'User not found'}), 404
        flash('User not found', 'error')
        return redirect(url_for('auth.login'))
    
    if user.is_verified:
        if wants_json_response():
            return jsonify({'error': 'Email already verified'}), 400
        flash('Email already verified', 'error')
        return redirect(url_for('auth.login'))
    
    try:
        send_verification_email(user)
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email: {e}")
        if wants_json_response():
            return jsonify({'error': 'Failed to send verification email'}), 500
        flash('Failed to send verification email', 'error')
        return redirect(url_for('auth.login'))
    
    if wants_json_response():
        return jsonify({'message': 'Verification email sent'}), 200
    
    flash('Verification email sent. Please check your inbox.', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Handle password reset request."""
    if request.method == 'GET':
        if wants_json_response():
            return jsonify({'message': 'Forgot password endpoint'}), 200
        return render_template('auth/forgot_password.html')
    
    data = request.get_json() if request.is_json else request.form
    email = data.get('email')
    
    if not email:
        if wants_json_response():
            return jsonify({'error': 'Email is required'}), 400
        flash('Email is required', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    user = User.query.filter_by(email=email).first()
    if not user:
        if wants_json_response():
            return jsonify({'error': 'User not found'}), 404
        flash('If an account exists with this email, a password reset link will be sent.', 'info')
        return redirect(url_for('auth.login'))
    
    try:
        send_password_reset_email(user)
    except Exception as e:
        current_app.logger.error(f"Failed to send password reset email: {e}")
        if wants_json_response():
            return jsonify({'error': 'Failed to send password reset email'}), 500
        flash('Failed to send password reset email', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    if wants_json_response():
        return jsonify({'message': 'Password reset email sent'}), 200
    
    flash('Password reset instructions have been sent to your email.', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Reset user's password."""
    token_obj = Token.verify_token(token, 'reset_password')
    if not token_obj:
        if wants_json_response():
            return jsonify({'error': 'Invalid or expired token'}), 400
        flash('Invalid or expired reset link', 'error')
        return redirect(url_for('auth.login'))
    
    if request.method == 'GET':
        if wants_json_response():
            return jsonify({'message': 'Reset password endpoint'}), 200
        return render_template('auth/reset_password.html')
    
    data = request.get_json() if request.is_json else request.form
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    
    if not password or not confirm_password:
        if wants_json_response():
            return jsonify({'error': 'Missing required fields'}), 400
        flash('Missing required fields', 'error')
        return redirect(url_for('auth.reset_password', token=token))
    
    if password != confirm_password:
        if wants_json_response():
            return jsonify({'error': 'Passwords do not match'}), 400
        flash('Passwords do not match', 'error')
        return redirect(url_for('auth.reset_password', token=token))
    
    user = User.query.get(token_obj.user_id)
    if not user:
        if wants_json_response():
            return jsonify({'error': 'User not found'}), 404
        flash('User not found', 'error')
        return redirect(url_for('auth.login'))
    
    user.set_password(password)
    token_obj.revoke()
    db.session.commit()
    
    if wants_json_response():
        return jsonify({'message': 'Password reset successful'}), 200
    
    flash('Password has been reset successfully. You can now log in.', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/logout')
@login_required
def logout():
    """Log out the current user."""
    logout_user()
    if wants_json_response():
        return jsonify({'message': 'Logged out successfully'}), 200
    return redirect(url_for('auth.login'))