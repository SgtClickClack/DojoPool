from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash
from src.core.models import User, db
from src.core.auth.utils import generate_token
from datetime import datetime

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields'
        }), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({
            'status': 'error',
            'message': 'Username already exists'
        }), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({
            'status': 'error',
            'message': 'Email already exists'
        }), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        is_active=True,
        created_at=datetime.utcnow()
    )
    # Set the user's password using the provided data
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # Generate auth token
        token = generate_token(user)
        
        return jsonify({
            'status': 'success',
            'message': 'User registered successfully',
            'data': {
                'user': user.to_dict(),
                'token': token
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.route('/login', methods=['POST'])
def login():
    """Login user and return auth token."""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('username') or not data.get('password'):
        return jsonify({
            'status': 'error',
            'message': 'Missing username or password'
        }), 400
    
    # Find user
    user = User.query.filter_by(username=data['username']).first()
    # Check the user exists and the provided password is correct
    if not user or not user.check_password(data['password']):
        return jsonify({
            'status': 'error',
            'message': 'Invalid username or password'
        }), 401
    
    if not user.is_active:
        return jsonify({
            'status': 'error',
            'message': 'Account is deactivated'
        }), 401
    
    # Login user
    login_user(user)
    
    # Generate auth token
    token = generate_token(user)
    
    return jsonify({
        'status': 'success',
        'message': 'Login successful',
        'data': {
            'user': user.to_dict(),
            'token': token
        }
    })

@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logout current user."""
    logout_user()
    return jsonify({
        'status': 'success',
        'message': 'Logout successful'
    })

@bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current user profile."""
    return jsonify({
        'status': 'success',
        'data': {
            'user': current_user.to_dict()
        }
    })

@bp.route('/me', methods=['PUT'])
@login_required
def update_profile():
    """Update current user profile."""
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['email', 'password']
    for field in allowed_fields:
        if field in data:
            if field == 'password':
                current_user.set_password(data[field])
            else:
                setattr(current_user, field, data[field])
    
    try:
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Profile updated successfully',
            'data': {
                'user': current_user.to_dict()
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@bp.errorhandler(401)
def unauthorized(error):
    """Handle unauthorized access."""
    return jsonify({
        'status': 'error',
        'message': 'Unauthorized access'
    }), 401 