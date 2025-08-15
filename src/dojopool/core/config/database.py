"""Database configuration settings."""

import os
from typing import Dict

DATABASE_CONFIG: Dict = {
    'user': os.getenv('DB_USER', 'postgres'),
    'os.getenv("PASSWORD_39"), ''),
    'database': os.getenv('DB_NAME', 'dojo_pool'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'min_connections': int(os.getenv('DB_MIN_CONN', '5')),
    'max_connections': int(os.getenv('DB_MAX_CONN', '20')),
    'connection_timeout': int(os.getenv('DB_CONN_TIMEOUT', '60')),
    'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '3600')),
    'ssl_mode': os.getenv('DB_SSL_MODE', 'prefer'),
    'application_name': 'dojo_pool_app'
}

# Connection pool settings
POOL_CONFIG: Dict = {
    'min_size': DATABASE_CONFIG['min_connections'],
    'max_size': DATABASE_CONFIG['max_connections'],
    'max_queries': int(os.getenv('DB_MAX_QUERIES', '50000')),
    'max_inactive_connection_lifetime': float(os.getenv('DB_MAX_INACTIVE_LIFETIME', '300.0')),
    'connection_class': None,  # Use default connection class
    'setup': None  # No custom setup needed
}

# Query timeout settings
QUERY_TIMEOUT: int = int(os.getenv('DB_QUERY_TIMEOUT', '30'))  # seconds

# Statement cache settings
STATEMENT_CACHE_SIZE: int = int(os.getenv('DB_STMT_CACHE_SIZE', '1000'))

# Transaction settings
TRANSACTION_ISOLATION: str = os.getenv('DB_TRANSACTION_ISOLATION', 'read_committed')
TRANSACTION_READ_ONLY: bool = os.getenv('DB_TRANSACTION_READ_ONLY', 'false').lower() == 'true'

# Logging settings
LOGGING_CONFIG: Dict = {
    'level': os.getenv('DB_LOG_LEVEL', 'INFO'),
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': os.getenv('DB_LOG_FILE', 'database.log'),
    'max_size': int(os.getenv('DB_LOG_MAX_SIZE', '10485760')),  # 10MB
    'backup_count': int(os.getenv('DB_LOG_BACKUP_COUNT', '5'))
}

# Migration settings
MIGRATION_CONFIG: Dict = {
    'directory': os.path.join(os.path.dirname(__file__), '..', '..', '..', 'migrations'),
    'table': os.getenv('DB_MIGRATION_TABLE', 'schema_version'),
    'batch_size': int(os.getenv('DB_MIGRATION_BATCH_SIZE', '1000'))
}

# Connection retry settings
RETRY_CONFIG: Dict = {
    'max_attempts': int(os.getenv('DB_RETRY_MAX_ATTEMPTS', '3')),
    'initial_delay': float(os.getenv('DB_RETRY_INITIAL_DELAY', '0.1')),  # seconds
    'max_delay': float(os.getenv('DB_RETRY_MAX_DELAY', '1.0')),  # seconds
    'exponential_base': float(os.getenv('DB_RETRY_EXP_BASE', '2.0'))
}

# Query performance settings
PERFORMANCE_CONFIG: Dict = {
    'statement_timeout': int(os.getenv('DB_STMT_TIMEOUT', '30000')),  # milliseconds
    'lock_timeout': int(os.getenv('DB_LOCK_TIMEOUT', '5000')),  # milliseconds
    'idle_in_transaction_session_timeout': int(os.getenv('DB_IDLE_TXN_TIMEOUT', '60000'))  # milliseconds
}

# Connection settings string
def get_connection_string() -> str:
    """Get the database connection string.
    
    Returns:
        str: Connection string for database
    """
    return (
        f"postgresql://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}"
        f"@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}"
        f"/{DATABASE_CONFIG['database']}"
    )
