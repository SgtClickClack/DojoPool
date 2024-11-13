import logging
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, current_user
from models import User, db
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import os
from flask_wtf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman

# Initialize CSRF protection and rate limiter
csrf = CSRFProtect()
limiter = Limiter(key_func=get_remote_address)

# Secure headers with Flask-Talisman
talisman = Talisman()

# Configure logging with JSON structured format
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s : %(message)s')
logger = logging.getLogger(__name__)

auth = Blueprint("auth", __name__, url_prefix="/auth")

@auth.route("/login", methods=["GET", "POST"])
@limiter.limit("5 per minute")  # Rate limit to prevent brute-force attacks
@csrf.exempt  # Ensure CSRF protection on the login route
def login():
    try:
        if current_user.is_authenticated:
            logger.info(f"Already authenticated user {current_user.email} attempted login")
            return redirect(url_for('routes.index'))
        
        if request.method == "POST":
            email = request.form.get("email", '').strip()
            password = request.form.get("password", '')
            remember = request.form.get("remember", False)
            
            # Enhanced validation
            if not email or not password:
                logger.warning("Login attempt with missing credentials")
                flash("Both email and password are required", "error")
                return redirect(url_for("auth.login"))
            
            user = User.query.filter_by(email=email).first()
            
            if user and user.check_password(password):
                # Secure session setup
                session.permanent = True
                session.modified = True
                session['last_activity'] = datetime.datetime.utcnow().isoformat()
                session['user_id'] = user.id
                session['user_agent'] = request.headers.get('User-Agent')
                
                login_user(user, remember=remember)
                logger.info(f"Successful login for user: {email}")
                
                next_page = request.args.get('next')
                if next_page and next_page.startswith('/'):
                    return redirect(next_page)
                return redirect(url_for("routes.index"))
            
            logger.warning(f"Failed login attempt for email: {email}")
            flash("Invalid email or password", "error")
        
        return render_template("login.html")
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        flash("An unexpected error occurred. Please try again.", "error")
        return redirect(url_for("auth.login"))

@auth.route("/register", methods=["GET", "POST"])
@csrf.exempt
def register():
    try:
        if current_user.is_authenticated:
            return redirect(url_for('routes.index'))
        
        if request.method == "POST":
            email = request.form.get("email", '').strip()
            password = request.form.get("password", '')
            username = request.form.get("username", '').strip()
            
            # Enhanced validation
            if not all([email, password, username]):
                flash("All fields are required", "error")
                return redirect(url_for("auth.register"))
            
            if len(password) < 8 or not any(char.isdigit() for char in password):
                flash("Password must be at least 8 characters long and contain a number", "error")
                return redirect(url_for("auth.register"))
            
            if User.query.filter_by(email=email).first():
                logger.warning(f"Registration attempt with existing email: {email}")
                flash("Email already registered", "error")
                return redirect(url_for("auth.register"))
            
            if User.query.filter_by(username=username).first():
                flash("Username already taken", "error")
                return redirect(url_for("auth.register"))
            
            try:
                user = User(email=email, username=username)
                user.set_password(password)
                db.session.add(user)
                db.session.commit()
                logger.info(f"New user registered successfully: {email}")
                
                # Initialize secure session
                session.permanent = True
                session.modified = True
                session['last_activity'] = datetime.datetime.utcnow().isoformat()
                session['user_id'] = user.id
                session['user_agent'] = request.headers.get('User-Agent')
                
                login_user(user)
                flash("Registration successful! Welcome to Dojo Pool!", "success")
                return redirect(url_for("routes.index"))
                
            except Exception as e:
                logger.error(f"Database error during registration: {str(e)}", exc_info=True)
                db.session.rollback()
                flash("Registration failed. Please try again.", "error")
                return redirect(url_for("auth.register"))
        
        return render_template("register.html")
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        flash("An unexpected error occurred", "error")
        return redirect(url_for("routes.index"))

@auth.route("/logout")
def logout():
    try:
        if current_user.is_authenticated:
            email = current_user.email
            session.clear()
            logout_user()
            logger.info(f"User logged out successfully: {email}")
            flash("You have been logged out successfully", "success")
        return redirect(url_for('routes.index'))
    except Exception as e:
        logger.error(f"Logout error: {str(e)}", exc_info=True)
        flash("An error occurred during logout", "error")
        return redirect(url_for('routes.index'))

@auth.before_request
def check_session():
    """Enhanced session validation"""
    if current_user.is_authenticated:
        try:
            last_activity = session.get('last_activity')
            if last_activity:
                last_activity = datetime.datetime.fromisoformat(last_activity)
                now = datetime.datetime.utcnow()
                if (now - last_activity).total_seconds() > 1800:  # 30 minutes
                    logger.info(f"Session expired for user: {current_user.email}")
                    logout_user()
                    session.clear()
                    flash("Session expired. Please log in again.", "info")
                    return redirect(url_for('auth.login'))
                
                session['last_activity'] = now.isoformat()
                session.modified = True
                
                current_agent = request.headers.get('User-Agent')
                if session.get('user_agent') != current_agent:
                    logger.warning(f"User agent mismatch for user: {current_user.email}")
                    logout_user()
                    session.clear()
                    flash("Session invalid. Please log in again.", "warning")
                    return redirect(url_for('auth.login'))
                    
        except Exception as e:
            logger.error(f"Session validation error: {str(e)}", exc_info=True)
            logout_user()
            session.clear()
            flash("Session error. Please log in again.", "error")
            return redirect(url_for('auth.login'))

@auth.errorhandler(404)
def page_not_found(error):
    logger.error(f"404 error: {str(error)}")
    return render_template('error.html', error_code=404, message="Page not found"), 404

@auth.errorhandler(500)
def internal_server_error(error):
    logger.error(f"500 error: {str(error)}")
    return render_template('error.html', error_code=500, message="Internal server error"), 500
