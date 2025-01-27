"""Authentication routes."""
from flask import (
    Blueprint, render_template, redirect, url_for,
    flash, request, current_app
)
from flask_login import login_user, logout_user, login_required, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField
from wtforms.validators import DataRequired, Email, Length
from werkzeug.security import generate_password_hash, check_password_hash
import requests
from requests_oauthlib import OAuth2Session
import json
import os
from typing import Optional, Any, cast
from sqlalchemy import update

from ..core.auth.models import User, Role, db
from .oauth import GoogleOAuth

auth_bp = Blueprint('auth', __name__)

class LoginForm(FlaskForm):
    """Login form."""
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')

class RegisterForm(FlaskForm):
    """Registration form."""
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Register a new user."""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = RegisterForm()
    if form.validate_on_submit():
        if User.query.filter_by(username=form.username.data).first():
            flash('Username already taken')
            return redirect(url_for('auth.register'))

        if User.query.filter_by(email=form.email.data).first():
            flash('Email already registered')
            return redirect(url_for('auth.register'))

        user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=generate_password_hash(form.password.data)
        )
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! Please log in.')
        return redirect(url_for('auth.login'))

    return render_template('auth/register.html', form=form)

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """Log in a user."""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            return redirect(next_page if next_page else url_for('dashboard'))
        flash('Invalid email or password')
        return redirect(url_for('auth.login'))

    return render_template('auth/login.html', form=form)

@auth_bp.route("/logout")
@login_required
def logout():
    """Log out the current user."""
    logout_user()
    flash('You have been logged out.')
    return redirect(url_for('index'))

@auth_bp.route("/google-login")
def google_login():
    """Initiate Google OAuth login."""
    google = GoogleOAuth()
    auth_url = google.get_auth_url()
    if not auth_url:
        flash('Failed to get Google authorization URL. Please try again later.', 'error')
        return redirect(url_for('auth.login'))
    return redirect(auth_url)

@auth_bp.route("/google-callback")
def google_callback():
    """Google OAuth callback route."""
    google = GoogleOAuth()
    
    # Get authorization code from Google
    code = request.args.get('code')
    if not code:
        flash('Authentication failed. Please try again.', 'error')
        return redirect(url_for('auth.login'))
    
    try:
        # Create OAuth2 session
        oauth = OAuth2Session(
            google.client_id,
            redirect_uri=url_for('auth.google_callback', _external=True),
            scope=["openid", "email", "profile"]
        )
        
        # Get token using authorization code
        token_url = google.get_token_url()
        if not token_url:
            raise Exception('Failed to get token URL')
            
        token = oauth.fetch_token(
            token_url,
            client_secret=google.client_secret,
            authorization_response=request.url
        )
        
        # Get user info URL
        userinfo_url = google.get_userinfo_url()
        if not userinfo_url:
            raise Exception('Failed to get user info URL')
        
        # Get user info from Google
        userinfo = oauth.get(userinfo_url).json()
        
        if not userinfo.get('email_verified'):
            flash('Google account email is not verified.', 'error')
            return redirect(url_for('auth.login'))
        
        # Get user info
        email = userinfo['email']
        name = userinfo.get('given_name', '')
        
        # Find or create user
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                username=email.split('@')[0],
                email=email,
                password_hash='',  # No password for Google users
                is_active=True
            )
            db.session.add(user)
            db.session.commit()
        
        # Log in user
        login_user(user, remember=True)
        return redirect(url_for('dashboard'))
        
    except Exception as e:
        current_app.logger.error(f'Google OAuth error: {str(e)}')
        flash('Authentication failed. Please try again.', 'error')
        return redirect(url_for('auth.login'))

@auth_bp.route("/forgot-password")
def forgot_password():
    """Handle forgot password requests."""
    # TODO: Implement forgot password functionality
    flash('Password reset functionality is not yet implemented.')
    return redirect(url_for('auth.login'))
