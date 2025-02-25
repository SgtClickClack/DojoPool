"""Security audit logging system."""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from flask import current_app, request

class SecurityAuditLogger:
    """Security audit logger implementation."""
    
    def __init__(self, log_dir: Optional[str] = None):
        """Initialize security audit logger."""
        self.log_dir = Path(log_dir) if log_dir else Path("logs/audit")
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Set up logger
        self.logger = logging.getLogger("security_audit")
        self.logger.setLevel(logging.INFO)
        
        # Add file handler
        log_file = self.log_dir / f"audit_{datetime.now().strftime('%Y-%m-%d')}.log"
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(levelname)s - %(message)s"
            )
        )
        self.logger.addHandler(handler)
    
    def log_event(
        self,
        event_type: str,
        user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        severity: str = "INFO"
    ) -> None:
        """Log security event."""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "ip_address": request.remote_addr if request else None,
            "user_agent": request.user_agent.string if request and request.user_agent else None,
            "details": details or {},
            "severity": severity
        }
        
        self.logger.log(
            getattr(logging, severity),
            json.dumps(event)
        )
    
    def log_auth_event(
        self,
        event_type: str,
        user_id: int,
        success: bool,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log authentication event."""
        self.log_event(
            event_type=f"auth_{event_type}",
            user_id=user_id,
            details={
                "success": success,
                **(details or {})
            },
            severity="WARNING" if not success else "INFO"
        )
    
    def log_access_event(
        self,
        resource_type: str,
        resource_id: str,
        action: str,
        user_id: Optional[int] = None,
        success: bool = True,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log resource access event."""
        self.log_event(
            event_type="resource_access",
            user_id=user_id,
            details={
                "resource_type": resource_type,
                "resource_id": resource_id,
                "action": action,
                "success": success,
                **(details or {})
            },
            severity="WARNING" if not success else "INFO"
        )

# Create global instance
security_logger = SecurityAuditLogger() 