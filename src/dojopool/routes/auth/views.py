"""Authentication views."""
from datetime import datetime
from flask import request, jsonify, make_response, render_template, redirect, url_for, flash, session, current_app
from werkzeug.security import check_password_hash, generate_password_hash
from authlib.integrations.flask_client import OAuth
from functools import wraps

from dojopool.core.security.session import SessionManager
from dojopool.models.user import User
from dojopool.extensions import db, redis_client
from dojopool.forms.auth import LoginForm, RegistrationForm, ForgotPasswordForm, ResetPasswordForm
from dojopool.core.email import send_reset_email
from . import auth_bp

session_manager = SessionManager(redis_client=redis_client)
oauth = OAuth()
google = None

def init_oauth(app):
    """Initialize OAuth with the application context."""
    global google
    if google is None:
        oauth.init_app(app)
        google = oauth.register(
            name='google',
            client_id=app.config.get('GOOGLE_CLIENT_ID'),
            client_secret=app.config.get('GOOGLE_CLIENT_SECRET'),
            access_token_url='https://accounts.google.com/o/oauth2/token',
            access_token_params=None,
            authorize_url='https://accounts.google.com/o/oauth2/auth',
            authorize_params=None,
            api_base_url='https://www.googleapis.com/oauth2/v1/',
            client_kwargs={'scope': 'openid email profile'},
        )
    return google

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_token = request.cookies.get('session_token')
        if not session_token:
            return redirect(url_for('auth.login'))
        
        session_data = session_manager.validate_session(session_token)
        if not session_data:
            return redirect(url_for('auth.login'))
            
        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/google-login')
def google_login():
    """Handle Google OAuth login."""
    if google is None:
        init_oauth(current_app)
    redirect_uri = url_for('auth.google_authorized', _external=True)
    return google.authorize_redirect(redirect_uri)

@auth_bp.route('/google-authorized')
def google_authorized():
    """Handle Google OAuth callback."""
    if google is None:
        init_oauth(current_app)
    
    try:
        token = google.authorize_access_token()
        if not token:
            flash('Access denied', 'error')
            return redirect(url_for('auth.login'))
            
        resp = google.get('userinfo')
        user_info = resp.json()
        
        # Check if user exists
        user = User.query.filter_by(email=user_info['email']).first()
        
        if not user:
            # Create new user
            user = User(
                username=user_info['name'],
                email=user_info['email'],
                google_id=user_info['id'],
                profile_picture=user_info.get('picture'),
                is_verified=True
            )
            db.session.add(user)
            db.session.commit()
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create session
        session_token = session_manager.create_session(user.id, remember=True)
        
        # Prepare response with redirect
        response = make_response(redirect(url_for('main.dashboard')))
        
        # Set secure cookie
        response.set_cookie(
            'session_token',
            session_token,
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=30 * 24 * 3600  # 30 days
        )
        
        flash('Login successful!', 'success')
        return response
        
    except Exception as e:
        current_app.logger.error(f"OAuth error: {str(e)}")
        flash('Authentication failed', 'error')
        return redirect(url_for('auth.login'))

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login with enhanced security."""
    form = LoginForm()
    
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if not user or not check_password_hash(user.password, form.password.data):
            flash('Invalid email or password', 'error')
            return redirect(url_for('auth.login'))
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create session
        session_token = session_manager.create_session(user.id, remember=form.remember_me.data)
        
        # Prepare response with redirect
        response = make_response(redirect(url_for('main.dashboard')))
        
        # Set secure cookie
        response.set_cookie(
            'session_token',
            session_token,
            httponly=True,
            secure=True,
            samesite='Lax',
            max_age=30 * 24 * 3600 if form.remember_me.data else None  # 30 days if remember
        )
        
        flash('Login successful!', 'success')
        return response
        
    return render_template('auth/login.html', form=form)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration."""
    form = RegistrationForm()
    
    if form.validate_on_submit():
        # Check if user already exists
        if User.query.filter_by(email=form.email.data).first():
            flash('Email already registered', 'error')
            return redirect(url_for('auth.register'))
        
        if User.query.filter_by(username=form.username.data).first():
            flash('Username already taken', 'error')
            return redirect(url_for('auth.register'))
        
        # Create new user
        try:
            new_user = User(
                username=form.username.data,
                email=form.email.data,
                password=generate_password_hash(form.password.data),
                is_active=True,
                is_verified=False
            )
            db.session.add(new_user)
            db.session.commit()
            
            # Create session for new user
            session_token = session_manager.create_session(new_user.id, remember=False)
            
            # Prepare response with redirect
            response = make_response(redirect(url_for('main.dashboard')))
            
            # Set secure cookie
            response.set_cookie(
                'session_token',
                session_token,
                httponly=True,
                secure=True,
                samesite='Lax'
            )
            
            flash('Registration successful! Welcome to DojoPool!', 'success')
            return response
            
        except Exception as e:
            db.session.rollback()
            flash('An error occurred during registration. Please try again.', 'error')
            return redirect(url_for('auth.register'))
            
    return render_template('auth/register.html', form=form)

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Handle forgot password requests."""
    form = ForgotPasswordForm()
    
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            try:
                # Generate reset token
                token = session_manager.generate_reset_token(user.id)
                
                # Send reset email
                reset_url = url_for('auth.reset_password', token=token, _external=True)
                send_reset_email(user.email, reset_url)
                
            except Exception as e:
                pass  # Silently handle errors to prevent user enumeration
        
        # Always show success message to prevent user enumeration
        flash('If an account exists with this email, you will receive password reset instructions.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('auth/forgot_password.html', form=form)

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Handle password reset."""
    # Verify token
    user_id = session_manager.verify_reset_token(token)
    if not user_id:
        flash('Invalid or expired reset link', 'error')
        return redirect(url_for('auth.login'))
        
    user = User.query.get(user_id)
    if not user:
        flash('Invalid reset link', 'error')
        return redirect(url_for('auth.login'))
        
    form = ResetPasswordForm()
    
    if form.validate_on_submit():
        try:
            user.password = generate_password_hash(form.password.data)
            db.session.commit()
            
            flash('Your password has been reset successfully!', 'success')
            return redirect(url_for('auth.login'))
            
        except Exception as e:
            db.session.rollback()
            flash('An error occurred. Please try again.', 'error')
            
    return render_template('auth/reset_password.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    """Handle user logout."""
    session_token = request.cookies.get('session_token')
    if session_token:
        session_manager.delete_session(session_token)
    
    response = make_response(redirect(url_for('auth.login')))
    response.delete_cookie('session_token')
    
    flash('You have been logged out successfully.', 'success')
    return response

@auth_bp.route('/sessions', methods=['GET'])
@login_required
def list_sessions():
    """List user's active sessions."""
    session_token = request.cookies.get('session_token')
    session_data = session_manager.validate_session(session_token)
    
    sessions = Session.get_user_sessions(session_data['user_id'])
    return jsonify({
        'sessions': [session.to_dict() for session in sessions]
    })

@auth_bp.route('/sessions/<token>', methods=['DELETE'])
@login_required
def revoke_session(token):
    """Revoke a specific session."""
    current_token = request.cookies.get('session_token')
    session_data = session_manager.validate_session(current_token)
    
    # Get session to revoke
    session = Session.query.filter_by(token=token).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Verify ownership
    if session.user_id != session_data['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    session_manager.delete_session(token)
    return jsonify({'message': 'Session revoked successfully'}) 