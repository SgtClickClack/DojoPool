"""WebSocket room logging module.

This module provides logging functionality for room operations.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
import logging
import logging.handlers
import os
from pathlib import Path

from .constants import EventTypes
from .log_config import logger

class RoomLogger:
    """Room logger class."""
    
    def __init__(self, log_dir: str = 'logs/rooms'):
        """Initialize RoomLogger.
        
        Args:
            log_dir: Directory for log files
        """
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Set up room event logger
        self.event_logger = self._setup_logger(
            'room_events',
            self.log_dir / 'events.log',
            formatter=logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s'
            )
        )
        
        # Set up room access logger
        self.access_logger = self._setup_logger(
            'room_access',
            self.log_dir / 'access.log',
            formatter=logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s'
            )
        )
        
        # Set up room error logger
        self.error_logger = self._setup_logger(
            'room_errors',
            self.log_dir / 'errors.log',
            formatter=logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s\n'
                'Exception: %(exc_info)s\n'
                'Details: %(details)s'
            )
        )
        
        # Set up room audit logger
        self.audit_logger = self._setup_logger(
            'room_audit',
            self.log_dir / 'audit.log',
            formatter=logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s\n'
                'User: %(user_id)s\n'
                'Action: %(action)s\n'
                'Details: %(details)s'
            )
        )
    
    def _setup_logger(
        self,
        name: str,
        log_file: Path,
        formatter: logging.Formatter
    ) -> logging.Logger:
        """Set up logger instance.
        
        Args:
            name: Logger name
            log_file: Log file path
            formatter: Log formatter
            
        Returns:
            logging.Logger: Configured logger
        """
        handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5
        )
        handler.setFormatter(formatter)
        
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)
        logger.addHandler(handler)
        
        return logger
    
    def log_room_event(
        self,
        event_type: str,
        room_id: str,
        user_id: Optional[str],
        data: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log room event.
        
        Args:
            event_type: Event type
            room_id: Room ID
            user_id: Optional user ID
            data: Optional event data
        """
        event_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type,
            'room_id': room_id,
            'user_id': user_id,
            'data': data or {}
        }
        
        self.event_logger.info(
            f"Room event: {event_type}",
            extra={'details': json.dumps(event_data)}
        )
    
    def log_room_access(
        self,
        action: str,
        room_id: str,
        user_id: Optional[str],
        success: bool,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log room access attempt.
        
        Args:
            action: Access action
            room_id: Room ID
            user_id: Optional user ID
            success: Whether access was successful
            details: Optional access details
        """
        access_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'room_id': room_id,
            'user_id': user_id,
            'success': success,
            'details': details or {}
        }
        
        level = logging.INFO if success else logging.WARNING
        self.access_logger.log(
            level,
            f"Room access: {action} - {'Success' if success else 'Failed'}",
            extra={'details': json.dumps(access_data)}
        )
    
    def log_room_error(
        self,
        error_type: str,
        room_id: str,
        user_id: Optional[str],
        error: Exception,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log room error.
        
        Args:
            error_type: Error type
            room_id: Room ID
            user_id: Optional user ID
            error: Error exception
            details: Optional error details
        """
        error_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'error_type': error_type,
            'room_id': room_id,
            'user_id': user_id,
            'error': str(error),
            'details': details or {}
        }
        
        self.error_logger.error(
            f"Room error: {error_type}",
            exc_info=error,
            extra={'details': json.dumps(error_data)}
        )
    
    def log_room_audit(
        self,
        action: str,
        room_id: str,
        user_id: str,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log room audit event.
        
        Args:
            action: Audit action
            room_id: Room ID
            user_id: User ID
            details: Optional audit details
        """
        audit_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'room_id': room_id,
            'user_id': user_id,
            'details': details or {}
        }
        
        self.audit_logger.info(
            f"Room audit: {action}",
            extra={
                'user_id': user_id,
                'action': action,
                'details': json.dumps(audit_data)
            }
        )
    
    def get_room_events(
        self,
        room_id: str,
        event_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get room events from log.
        
        Args:
            room_id: Room ID
            event_type: Optional event type filter
            start_time: Optional start time filter
            end_time: Optional end time filter
            
        Returns:
            List[Dict[str, Any]]: List of room events
        """
        events = []
        log_file = self.log_dir / 'events.log'
        
        if not log_file.exists():
            return events
        
        with open(log_file, 'r') as f:
            for line in f:
                try:
                    # Parse log entry
                    parts = line.strip().split(' - ', 2)
                    if len(parts) != 3:
                        continue
                    
                    timestamp_str, level, message = parts
                    timestamp = datetime.fromisoformat(timestamp_str)
                    
                    # Apply time filters
                    if start_time and timestamp < start_time:
                        continue
                    if end_time and timestamp > end_time:
                        continue
                    
                    # Parse event details
                    if 'Room event:' not in message:
                        continue
                    
                    details_str = message.split('details: ', 1)[1]
                    details = json.loads(details_str)
                    
                    # Apply filters
                    if details['room_id'] != room_id:
                        continue
                    if event_type and details['event_type'] != event_type:
                        continue
                    
                    events.append(details)
                    
                except Exception as e:
                    logger.error(
                        "Error parsing room event log",
                        exc_info=True,
                        extra={'error': str(e)}
                    )
        
        return events
    
    def get_room_access_logs(
        self,
        room_id: str,
        user_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get room access logs.
        
        Args:
            room_id: Room ID
            user_id: Optional user ID filter
            start_time: Optional start time filter
            end_time: Optional end time filter
            
        Returns:
            List[Dict[str, Any]]: List of access logs
        """
        logs = []
        log_file = self.log_dir / 'access.log'
        
        if not log_file.exists():
            return logs
        
        with open(log_file, 'r') as f:
            for line in f:
                try:
                    # Parse log entry
                    parts = line.strip().split(' - ', 2)
                    if len(parts) != 3:
                        continue
                    
                    timestamp_str, level, message = parts
                    timestamp = datetime.fromisoformat(timestamp_str)
                    
                    # Apply time filters
                    if start_time and timestamp < start_time:
                        continue
                    if end_time and timestamp > end_time:
                        continue
                    
                    # Parse access details
                    if 'Room access:' not in message:
                        continue
                    
                    details_str = message.split('details: ', 1)[1]
                    details = json.loads(details_str)
                    
                    # Apply filters
                    if details['room_id'] != room_id:
                        continue
                    if user_id and details['user_id'] != user_id:
                        continue
                    
                    logs.append(details)
                    
                except Exception as e:
                    logger.error(
                        "Error parsing room access log",
                        exc_info=True,
                        extra={'error': str(e)}
                    )
        
        return logs
    
    def get_room_audit_logs(
        self,
        room_id: str,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get room audit logs.
        
        Args:
            room_id: Room ID
            user_id: Optional user ID filter
            action: Optional action filter
            start_time: Optional start time filter
            end_time: Optional end time filter
            
        Returns:
            List[Dict[str, Any]]: List of audit logs
        """
        logs = []
        log_file = self.log_dir / 'audit.log'
        
        if not log_file.exists():
            return logs
        
        with open(log_file, 'r') as f:
            for line in f:
                try:
                    # Parse log entry
                    parts = line.strip().split(' - ', 2)
                    if len(parts) != 3:
                        continue
                    
                    timestamp_str, level, message = parts
                    timestamp = datetime.fromisoformat(timestamp_str)
                    
                    # Apply time filters
                    if start_time and timestamp < start_time:
                        continue
                    if end_time and timestamp > end_time:
                        continue
                    
                    # Parse audit details
                    if 'Room audit:' not in message:
                        continue
                    
                    details_str = message.split('details: ', 1)[1]
                    details = json.loads(details_str)
                    
                    # Apply filters
                    if details['room_id'] != room_id:
                        continue
                    if user_id and details['user_id'] != user_id:
                        continue
                    if action and details['action'] != action:
                        continue
                    
                    logs.append(details)
                    
                except Exception as e:
                    logger.error(
                        "Error parsing room audit log",
                        exc_info=True,
                        extra={'error': str(e)}
                    )
        
        return logs

# Global room logger instance
room_logger = RoomLogger() 