"""Authentication routes."""

from flask import (
    Blueprint,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required, login_user, logout_user
from flask_wtf import FlaskForm
from requests_oauthlib import OAuth2Session
from werkzeug.security import check_password_hash, generate_password_hash
from wtforms import BooleanField, PasswordField, StringField
from wtforms.validators import DataRequired, Email, Length
from functools import wraps
from firebase_admin import auth as firebase_auth
from ..models.user import User
from ..extensions import db

auth_bp = Blueprint("auth", __name__)


class LoginForm(FlaskForm):
    """Login form."""

    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    remember_me = BooleanField("Remember Me")


class RegisterForm(FlaskForm):
    """Registration form."""

    username = StringField("Username", validators=[DataRequired(), Length(min=3, max=80)])
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=6)])


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Register a new user."""
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.is_json:
        data = request.get_json()
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not all([username, email, password]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"status": "error", "message": "Username already taken"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"status": "error", "message": "Email already registered"}), 400

        user = User(username=username, email=email, password_hash=generate_password_hash(password))
        db.session.add(user)
        db.session.commit()

        return jsonify({"status": "success", "message": "Registration successful"}), 201

    form = RegisterForm()
    if form.validate_on_submit():
        if User.query.filter_by(username=form.username.data).first():
            flash("Username already taken")
            return redirect(url_for("auth.register"))

        if User.query.filter_by(email=form.email.data).first():
            flash("Email already registered")
            return redirect(url_for("auth.register"))

        user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=generate_password_hash(form.password.data),
        )
        db.session.add(user)
        db.session.commit()
        flash("Registration successful! Please log in.")
        return redirect(url_for("auth.login"))

    return render_template("auth/register.html", form=form)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """Log in a user."""
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get("next")
            return redirect(next_page if next_page else url_for("dashboard"))
        flash("Invalid email or password")
        return redirect(url_for("auth.login"))

    return render_template("auth/login.html", form=form)


def verify_firebase_token(token):
    """Verify Firebase ID token."""
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        current_app.logger.error(f"Firebase token verification failed: {str(e)}")
        return None


def firebase_auth_required(f):
    """Decorator to require Firebase authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
        
        token = auth_header.split('Bearer ')[1]
        decoded_token = verify_firebase_token(token)
        
        if not decoded_token:
            return jsonify({'error': 'Invalid token'}), 401
            
        # Get or create user
        email = decoded_token.get('email')
        if not email:
            return jsonify({'error': 'No email in token'}), 401
            
        user = User.query.filter_by(email=email).first()
        if not user:
            # Create new user with Firebase auth
            user = User()
            user.username = email.split('@')[0]
            user.email = email
            user.password_hash = generate_password_hash('firebase-auth-' + email)
            user.is_verified = True  # Firebase emails are verified
            user._is_active = True
            db.session.add(user)
            db.session.commit()
            
        login_user(user, remember=True)
        return f(*args, **kwargs)
    return decorated_function


@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify Firebase token and return user info."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401
        
    token = auth_header.split('Bearer ')[1]
    decoded_token = verify_firebase_token(token)
    
    if not decoded_token:
        return jsonify({'error': 'Invalid token'}), 401
        
    email = decoded_token.get('email')
    if not email:
        return jsonify({'error': 'No email in token'}), 401
        
    user = User.query.filter_by(email=email).first()
    if not user:
        # Create new user with Firebase auth
        user = User()
        user.username = email.split('@')[0]
        user.email = email
        user.password_hash = generate_password_hash('firebase-auth-' + email)
        user.is_verified = True  # Firebase emails are verified
        user._is_active = True
        db.session.add(user)
        db.session.commit()
        
    login_user(user, remember=True)
    return jsonify({
        'user': {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'is_verified': user.is_verified,
            'roles': [role.name for role in user.roles]
        }
    })


@auth_bp.route("/logout")
@login_required
def logout():
    """Log out the current user."""
    logout_user()
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route("/forgot-password")
def forgot_password():
    """Handle forgot password requests."""
    # TODO: Implement forgot password functionality
    flash("Password reset functionality is not yet implemented.")
    return redirect(url_for("auth.login"))
