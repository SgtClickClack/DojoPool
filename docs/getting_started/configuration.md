# Configuration Guide

This guide explains how to configure DojoPool for different environments and use cases.

## Environment Variables

DojoPool uses environment variables for configuration. Create a `.env` file in the project root:

```bash
# Application
FLASK_APP=src/app.py
FLASK_ENV=development  # or production
SECRET_KEY=your_secret_key
DEBUG=True  # False in production

# Database
SQLALCHEMY_DATABASE_URI=postgresql://username:password@localhost/dojopool
SQLALCHEMY_TRACK_MODIFICATIONS=False

# Redis
REDIS_URL=redis://localhost:6379/0
CACHE_TYPE=redis
CACHE_REDIS_DB=0
CACHE_DEFAULT_TIMEOUT=300

# Email (SendGrid)
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=apikey
SENDGRID_API_KEY=your_sendgrid_api_key
MAIL_DEFAULT_SENDER=noreply@dojopool.com

# Security
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
PERMANENT_SESSION_LIFETIME=86400  # 24 hours in seconds
WTF_CSRF_ENABLED=True
WTF_CSRF_SECRET_KEY=your_csrf_secret_key

# Rate Limiting
RATELIMIT_DEFAULT=100/minute
RATELIMIT_STORAGE_URL=redis://localhost:6379/1

# File Upload
MAX_CONTENT_LENGTH=16777216  # 16MB in bytes
UPLOAD_FOLDER=uploads
ALLOWED_EXTENSIONS=png,jpg,jpeg,gif
```

## Configuration Classes

The application uses different configuration classes for different environments:

### Base Configuration (config/base.py)

- Common settings for all environments
- Default values for required configurations
- Security settings

### Development Configuration (config/development.py)

- Debug mode enabled
- Simplified cache configuration
- Relaxed security settings for local development

### Production Configuration (config/production.py)

- Debug mode disabled
- Full security measures enabled
- Production-ready cache and database settings

### Testing Configuration (config/testing.py)

- SQLite database for testing
- Disabled CSRF for testing
- In-memory cache

## Custom Configuration

To add custom configuration:

1. Create a new configuration class:

```python
from .base import Config

class CustomConfig(Config):
    CUSTOM_SETTING = 'value'

    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        # Custom initialization code
```

2. Register the configuration:

```python
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'custom': CustomConfig,
    'default': DevelopmentConfig
}
```

## Security Considerations

### Secret Keys

- Use strong, random secret keys
- Never commit secret keys to version control
- Rotate keys periodically in production

### Cookie Security

- Enable secure cookies in production
- Set appropriate cookie lifetimes
- Use HTTP-only cookies

### CSRF Protection

- Enable CSRF protection
- Use unique CSRF keys
- Implement proper token validation

### Rate Limiting

- Configure appropriate rate limits
- Use Redis for rate limit storage
- Monitor and adjust limits as needed

## Logging Configuration

### Development

```python
LOGGING_CONFIG = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'DEBUG',
            'formatter': 'standard'
        }
    },
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        }
    },
    'root': {
        'level': 'DEBUG',
        'handlers': ['console']
    }
}
```

### Production

```python
LOGGING_CONFIG = {
    'version': 1,
    'handlers': {
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/dojopool.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'standard'
        }
    },
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        }
    },
    'root': {
        'level': 'INFO',
        'handlers': ['file']
    }
}
```

## Next Steps

- Set up your [Development Environment](development.md)
- Review the [Architecture Overview](../ARCHITECTURE.md)
- Learn about [Deployment](../DEPLOYMENT.md)
