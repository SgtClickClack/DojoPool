"""Authentication views."""
from datetime import datetime
from flask import Blueprint, request, jsonify, make_response
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import Schema, fields, validate, ValidationError
from dojopool.core.models import User
from dojopool.core.database import db
from dojopool.core.security.session import SessionManager
from dojopool.core.security.tokens import generate_reset_token
from dojopool.core.email import send_reset_email
import time
import random
import re

auth_bp = Blueprint('auth', __name__)

# Input validation schemas
class LoginSchema(Schema):
    email = fields.Email(required=True, validate=[
        validate.Length(min=5, max=254),
        validate.Regexp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    ])
    password = fields.Str(required=True, validate=[
        validate.Length(min=8, max=72),
        validate.Regexp(
            r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
            error='Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        )
    ])
    remember_me = fields.Boolean(missing=False)

class RegisterSchema(LoginSchema):
    username = fields.Str(required=True, validate=[
        validate.Length(min=3, max=30),
        validate.Regexp(r'^[a-zA-Z0-9_-]+$', error='Username can only contain letters, numbers, underscores and hyphens')
    ])

class PasswordResetRequestSchema(Schema):
    email = fields.Email(required=True)

class PasswordResetConfirmSchema(Schema):
    token = fields.Str(required=True, validate=validate.Length(min=32, max=512))
    new_password = fields.Str(required=True, validate=[
        validate.Length(min=8, max=72),
        validate.Regexp(
            r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
            error='Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        )
    ])

# Rate limiting configuration
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"
)

session_manager = SessionManager()

def sanitize_email(email: str) -> str:
    """Sanitize email address."""
    return email.lower().strip()

def validate_password_strength(password: str) -> bool:
    """Additional password strength validation."""
    if re.search(r'(.)\1{2,}', password):  # Check for character repetition
        return False
    if any(common in password.lower() for common in ['password', '123456', 'qwerty']):
        return False
    return True

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """Handle user login with rate limiting and enhanced validation."""
    try:
        data = LoginSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400

    email = sanitize_email(data['email'])
    password = data['password']

    if not validate_password_strength(password):
        return jsonify({'error': 'Password does not meet security requirements'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        time.sleep(random.uniform(0.1, 0.3))  # Add delay to prevent timing attacks
        return jsonify({'error': 'Invalid email or password'}), 401

    # Check for too many failed attempts
    if user.failed_login_attempts >= 5:
        if (datetime.utcnow() - user.last_failed_login).total_seconds() < 300:  # 5 minutes lockout
            return jsonify({'error': 'Account temporarily locked. Please try again later'}), 429

        # Reset counter after lockout period
        user.failed_login_attempts = 0
    
    # Update login tracking
    user.last_login_at = datetime.utcnow()
    user.failed_login_attempts = 0
    user.last_failed_login = None
    db.session.commit()

    # Create session with enhanced security
    session_token = session_manager.create_session(
        str(user.id),
        remember=data.get('remember_me', False),
        metadata={
            'ip_address': request.remote_addr,
            'user_agent': request.user_agent.string,
            'origin': request.headers.get('Origin', 'unknown')
        }
    )

    response = make_response(jsonify({'message': 'Login successful'}))
    response.set_cookie(
        'session_token',
        session_token,
        httponly=True,
        secure=True,
        samesite='Lax',
        max_age=30 * 24 * 3600 if data.get('remember_me') else None
    )

    return response

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("3 per hour")
def register():
    """Handle user registration with enhanced validation."""
    try:
        data = RegisterSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400

    email = sanitize_email(data['email'])
    password = data['password']

    if not validate_password_strength(password):
        return jsonify({'error': 'Password does not meet security requirements'}), 400

    if User.query.filter_by(email=email).first():
        time.sleep(random.uniform(0.1, 0.3))  # Add delay to prevent enumeration
        return jsonify({'error': 'Email already registered'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        email=email,
        username=data['username'],
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Registration successful'}), 201

@auth_bp.route('/password-reset', methods=['POST'])
@limiter.limit("3 per hour")
def password_reset():
    """Handle password reset requests with enhanced security."""
    try:
        data = PasswordResetRequestSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 400

    email = sanitize_email(data['email'])
    user = User.query.filter_by(email=email).first()

    if user:
        token = generate_reset_token(user)
        send_reset_email(user.email, token)

    # Always return success to prevent email enumeration
    return jsonify({'message': 'If an account exists with this email, a reset link has been sent'}) 