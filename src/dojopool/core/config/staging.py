from .production import ProductionConfig


class StagingConfig(ProductionConfig):
    """Staging configuration that inherits from production but with specific overrides."""

    ENV = "staging"
    DEBUG = False
    TESTING = False

    # Database configuration with staging prefix
    SQLALCHEMY_DATABASE_URI = (
        "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres/dojopool_staging"
    )

    # Redis configuration for staging
    REDIS_URL = "redis://redis:6379/1"

    # Celery configuration
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    # Rate limiting for staging environment
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_STRATEGY = "fixed-window"

    # Security settings specific to staging
    SESSION_COOKIE_NAME = "dojopool_staging_session"
    REMEMBER_COOKIE_NAME = "dojopool_staging_remember_token"

    # Logging configuration
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "%(asctime)s [%(levelname)s] [Staging] %(message)s"
    LOG_FILE = "/var/log/dojopool/staging.log"

    # Email configuration for staging
    MAIL_DEFAULT_SENDER = "staging@dojopool.com"

    @classmethod
    def init_app(cls, app):
        """Initialize staging-specific handlers."""
        ProductionConfig.init_app(app)

        # Configure staging-specific logging
        import logging
        from logging.handlers import RotatingFileHandler

        file_handler = RotatingFileHandler(
            cls.LOG_FILE, maxBytes=10485760, backupCount=10
        )  # 10MB
        file_handler.setFormatter(logging.Formatter(cls.LOG_FORMAT))
        file_handler.setLevel(cls.LOG_LEVEL)
        app.logger.addHandler(file_handler)

        # Add staging environment header
        @app.after_request
        def add_staging_header(response):
            response.headers["X-Environment"] = "staging"
            return response
