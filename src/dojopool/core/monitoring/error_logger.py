"""
Comprehensive error logging system for DojoPool.
Integrates with Prometheus metrics and provides structured logging.
"""

import logging
import json
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from enum import Enum
import threading
from prometheus_client import Counter, Histogram
from ...utils.monitoring import REQUEST_COUNT

# Error metrics
ERROR_COUNT = Counter(
    'app_error_count_total',
    'Total number of application errors',
    ['error_type', 'severity']
)

ERROR_HANDLING_TIME = Histogram(
    'app_error_handling_seconds',
    'Time spent handling errors',
    ['error_type']
)

class ErrorSeverity(Enum):
    """Error severity levels."""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

@dataclass
class ErrorContext:
    """Context information for errors."""
    timestamp: str
    error_type: str
    severity: ErrorSeverity
    message: str
    stack_trace: Optional[str] = None
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    component: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None

class ErrorLogger:
    """Centralized error logging system."""
    
    def __init__(self):
        """Initialize the error logger."""
        self.logger = logging.getLogger('dojopool.errors')
        self._setup_logger()
        self._local = threading.local()
        
    def _setup_logger(self):
        """Configure the logger with appropriate handlers and formatters."""
        # Create handlers if they don't exist
        if not self.logger.handlers:
            # File handler for all errors
            fh = logging.FileHandler('logs/error.log')
            fh.setLevel(logging.WARNING)
            
            # File handler for critical errors
            ch = logging.FileHandler('logs/critical.log')
            ch.setLevel(logging.CRITICAL)
            
            # Console handler
            console = logging.StreamHandler()
            console.setLevel(logging.ERROR)
            
            # Create formatter
            formatter = logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s'
            )
            
            # Set formatters
            fh.setFormatter(formatter)
            ch.setFormatter(formatter)
            console.setFormatter(formatter)
            
            # Add handlers
            self.logger.addHandler(fh)
            self.logger.addHandler(ch)
            self.logger.addHandler(console)
    
    def set_context(self, request_id: Optional[str] = None, user_id: Optional[str] = None):
        """Set context for the current thread."""
        self._local.request_id = request_id
        self._local.user_id = user_id
    
    def clear_context(self):
        """Clear context for the current thread."""
        if hasattr(self._local, 'request_id'):
            del self._local.request_id
        if hasattr(self._local, 'user_id'):
            del self._local.user_id
    
    def log_error(
        self,
        error: Exception,
        severity: ErrorSeverity,
        component: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None
    ):
        """Log an error with context information."""
        error_context = ErrorContext(
            timestamp=datetime.utcnow().isoformat(),
            error_type=error.__class__.__name__,
            severity=severity,
            message=str(error),
            stack_trace=traceback.format_exc(),
            request_id=getattr(self._local, 'request_id', None),
            user_id=getattr(self._local, 'user_id', None),
            component=component,
            additional_data=additional_data
        )
        
        # Update Prometheus metrics
        ERROR_COUNT.labels(
            error_type=error_context.error_type,
            severity=error_context.severity.value
        ).inc()
        
        # Log the error
        log_message = self._format_error_message(error_context)
        
        if severity == ErrorSeverity.CRITICAL:
            self.logger.critical(log_message)
        elif severity == ErrorSeverity.ERROR:
            self.logger.error(log_message)
        elif severity == ErrorSeverity.WARNING:
            self.logger.warning(log_message)
        else:
            self.logger.info(log_message)
    
    def _format_error_message(self, error_context: ErrorContext) -> str:
        """Format error context into a structured log message."""
        return json.dumps(asdict(error_context), indent=2)
    
    def get_recent_errors(
        self,
        severity: Optional[ErrorSeverity] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get recent errors from the log file."""
        errors = []
        log_file = 'logs/critical.log' if severity == ErrorSeverity.CRITICAL else 'logs/error.log'
        
        try:
            with open(log_file, 'r') as f:
                for line in f.readlines()[-limit:]:
                    try:
                        error_dict = json.loads(line.split(' - ')[-1])
                        if severity is None or error_dict['severity'] == severity.value:
                            errors.append(error_dict)
                    except json.JSONDecodeError:
                        continue
        except FileNotFoundError:
            pass
        
        return errors

# Global error logger instance
error_logger = ErrorLogger() 