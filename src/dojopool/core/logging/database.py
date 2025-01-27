"""Database logger module for logging database operations."""

from datetime import datetime
from typing import Any, Dict, Optional, Union

from .base import BaseLogger, LogFormat, LogLevel

class DatabaseLogger(BaseLogger):
    """Database logger class for logging database operations."""

    def __init__(
        self,
        log_dir: Union[str, str],
        name: str = 'database',
        log_format: LogFormat = LogFormat.JSON,
        max_bytes: int = 10*1024*1024,  # 10MB
        backup_count: int = 5,
        level: LogLevel = LogLevel.INFO
    ):
        """Initialize database logger.
        
        Args:
            log_dir: Directory for log files
            name: Logger name
            log_format: Log format (JSON or text)
            max_bytes: Maximum log file size
            backup_count: Number of backup files to keep
            level: Logging level
        """
        super().__init__(name, log_dir, log_format, max_bytes, backup_count, level)
        self.query_start_times: Dict[str, datetime] = {}

    def log_query(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        duration: Optional[float] = None,
        rows_affected: Optional[int] = None,
        **kwargs
    ) -> None:
        """Log database query.
        
        Args:
            query: SQL query string
            params: Query parameters
            duration: Query execution duration in seconds
            rows_affected: Number of rows affected
            **kwargs: Additional context
        """
        context = {
            'query': query,
            'params': params,
            'duration': duration,
            'rows_affected': rows_affected,
            **kwargs
        }
        self.info('Database query executed', **context)

    def log_slow_query(
        self,
        query: str,
        duration: float,
        params: Optional[Dict[str, Any]] = None,
        threshold: float = 1.0,
        **kwargs
    ) -> None:
        """Log slow database query.
        
        Args:
            query: SQL query string
            duration: Query execution duration in seconds
            params: Query parameters
            threshold: Slow query threshold in seconds
            **kwargs: Additional context
        """
        context = {
            'query': query,
            'params': params,
            'duration': duration,
            'threshold': threshold,
            **kwargs
        }
        self.warning('Slow database query detected', **context)

    def log_connection_error(
        self,
        error: Exception,
        retries: int = 0,
        **kwargs
    ) -> None:
        """Log database connection error.
        
        Args:
            error: Connection error
            retries: Number of connection retries
            **kwargs: Additional context
        """
        context = {
            'retries': retries,
            **kwargs
        }
        self.error('Database connection error', error=error, **context)

    def log_transaction_begin(
        self,
        transaction_id: str,
        isolation_level: Optional[str] = None,
        **kwargs
    ) -> None:
        """Log transaction begin.
        
        Args:
            transaction_id: Transaction identifier
            isolation_level: Transaction isolation level
            **kwargs: Additional context
        """
        context = {
            'transaction_id': transaction_id,
            'isolation_level': isolation_level,
            **kwargs
        }
        self.info('Database transaction started', **context)

    def log_transaction_commit(
        self,
        transaction_id: str,
        duration: Optional[float] = None,
        **kwargs
    ) -> None:
        """Log transaction commit.
        
        Args:
            transaction_id: Transaction identifier
            duration: Transaction duration in seconds
            **kwargs: Additional context
        """
        context = {
            'transaction_id': transaction_id,
            'duration': duration,
            **kwargs
        }
        self.info('Database transaction committed', **context)

    def log_transaction_rollback(
        self,
        transaction_id: str,
        reason: str,
        error: Optional[Exception] = None,
        **kwargs
    ) -> None:
        """Log transaction rollback.
        
        Args:
            transaction_id: Transaction identifier
            reason: Rollback reason
            error: Optional error that caused rollback
            **kwargs: Additional context
        """
        context = {
            'transaction_id': transaction_id,
            'reason': reason,
            **kwargs
        }
        self.warning('Database transaction rolled back', error=error, **context)

    def log_schema_change(
        self,
        operation: str,
        table: str,
        details: Dict[str, Any],
        **kwargs
    ) -> None:
        """Log schema change.
        
        Args:
            operation: Schema operation type
            table: Affected table
            details: Change details
            **kwargs: Additional context
        """
        context = {
            'operation': operation,
            'table': table,
            'details': details,
            **kwargs
        }
        self.info('Database schema changed', **context)

    def log_index_operation(
        self,
        operation: str,
        table: str,
        index_name: str,
        columns: list[str],
        **kwargs
    ) -> None:
        """Log index operation.
        
        Args:
            operation: Index operation type
            table: Affected table
            index_name: Index name
            columns: Affected columns
            **kwargs: Additional context
        """
        context = {
            'operation': operation,
            'table': table,
            'index_name': index_name,
            'columns': columns,
            **kwargs
        }
        self.info('Database index operation performed', **context)

    def log_connection_pool_status(
        self,
        total_connections: int,
        active_connections: int,
        idle_connections: int,
        **kwargs
    ) -> None:
        """Log connection pool status.
        
        Args:
            total_connections: Total number of connections
            active_connections: Number of active connections
            idle_connections: Number of idle connections
            **kwargs: Additional context
        """
        context = {
            'total_connections': total_connections,
            'active_connections': active_connections,
            'idle_connections': idle_connections,
            **kwargs
        }
        self.info('Database connection pool status', **context)

# Global database logger instance
db_logger = DatabaseLogger('logs/database') 