import os

# Production configuration
DEBUG = False
TESTING = False

# Database
SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Security
SECRET_KEY = os.getenv('SECRET_KEY')
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')

# API Configuration
API_TITLE = 'Dojo Pool API'
API_VERSION = 'v1'
OPENAPI_VERSION = '3.0.2'
OPENAPI_URL_PREFIX = '/'
OPENAPI_SWAGGER_UI_PATH = '/swagger-ui'
OPENAPI_SWAGGER_UI_URL = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist/'

# File Upload
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
UPLOAD_FOLDER = '/app/uploads'

# Redis Cache
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')

# Rate Limiting
RATELIMIT_STORAGE_URL = REDIS_URL
RATELIMIT_DEFAULT = "100/minute"
RATELIMIT_HEADERS_ENABLED = True

# Logging
LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s' 