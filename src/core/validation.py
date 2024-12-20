"""Input validation and sanitization utilities."""

import re
from functools import wraps
from flask import request, abort
from werkzeug.datastructures import FileStorage
import bleach
import html
from urllib.parse import urlparse

# Regular expressions for validation
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_-]{3,32}$')
PASSWORD_REGEX = re.compile(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$')
URL_REGEX = re.compile(
    r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$'
)

def sanitize_html(text):
    """Sanitize HTML content."""
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    allowed_attrs = {'*': ['class']}
    return bleach.clean(text, tags=allowed_tags, attributes=allowed_attrs, strip=True)

def sanitize_filename(filename):
    """Sanitize a filename."""
    # Remove any directory components
    filename = filename.replace('\\', '/').split('/')[-1]
    # Remove any null bytes
    filename = filename.replace('\0', '')
    # Limit length
    filename = filename[:255]
    return filename

def validate_email(email):
    """Validate email format."""
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email))

def validate_username(username):
    """Validate username format."""
    if not username or not isinstance(username, str):
        return False
    return bool(USERNAME_REGEX.match(username))

def validate_password(password):
    """Validate password strength."""
    if not password or not isinstance(password, str):
        return False
    return bool(PASSWORD_REGEX.match(password))

def validate_url(url):
    """Validate URL format and security."""
    if not url or not isinstance(url, str):
        return False
    if not URL_REGEX.match(url):
        return False
    # Additional security checks
    parsed = urlparse(url)
    return parsed.scheme in ('http', 'https')

def validate_file(file, allowed_extensions=None, max_size=None):
    """Validate file upload."""
    if not isinstance(file, FileStorage):
        return False
    
    if allowed_extensions:
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if ext not in allowed_extensions:
            return False
    
    if max_size and file.content_length > max_size:
        return False
    
    return True

# Validation decorators
def validate_json_schema(schema):
    """Validate JSON request against a schema."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                abort(400, description="Request must be JSON")
            
            try:
                data = request.get_json()
                schema.validate(data)
            except Exception as e:
                abort(400, description=str(e))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def sanitize_inputs(*fields):
    """Sanitize specified input fields."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.is_json:
                data = request.get_json()
                for field in fields:
                    if field in data and isinstance(data[field], str):
                        data[field] = html.escape(data[field])
                request._cached_json = (data, request._cached_json[1])
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Custom validators for specific use cases
def validate_game_type(game_type):
    """Validate game type."""
    valid_types = {'8-ball', '9-ball', 'straight', 'rotation'}
    return game_type in valid_types

def validate_score(score):
    """Validate game score."""
    try:
        score = int(score)
        return 0 <= score <= 100  # Adjust range as needed
    except (TypeError, ValueError):
        return False

def validate_date_range(start_date, end_date):
    """Validate date range."""
    try:
        return start_date <= end_date
    except (TypeError, ValueError):
        return False 