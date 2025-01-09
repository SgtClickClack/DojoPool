"""WebSocket room notification module.

This module provides functionality for handling user notifications and events.
"""
from typing import Dict, Any, Optional, List, Set, Tuple
from datetime import datetime, timedelta
import asyncio
import json
import time
from redis import Redis, ConnectionPool
from functools import wraps
from statistics import mean

from .constants import ErrorCodes, RoomTypes, RoomState, NotificationPriority, MetricTypes
from .utils import format_error_response
from .log_config import logger
from .room_state import room_state_manager
from .room_monitor import room_monitor
from .room_broadcast import room_broadcaster
from .rooms import room_manager

def measure_performance(metric_type: MetricTypes):
    """Decorator to measure performance of methods."""
    def decorator(func):
        @wraps(func)
        async def wrapper(self, *args, **kwargs):
            start_time = time.perf_counter()
            try:
                result = await func(self, *args, **kwargs)
                execution_time = time.perf_counter() - start_time
                await self._record_metric(metric_type, execution_time)
                return result
            except Exception as e:
                execution_time = time.perf_counter() - start_time
                await self._record_metric(metric_type, execution_time, error=True)
                raise e
        return wrapper
    return decorator

class RoomNotifications:
    """Room notifications class."""
    
    def __init__(self):
        """Initialize RoomNotifications."""
        self._notification_stats: Dict[str, Any] = {
            'total_notifications': 0,
            'successful_notifications': 0,
            'failed_notifications': 0,
            'last_notification': None
        }
        self._notification_lock = asyncio.Lock()
        self._event_subscribers: Dict[str, Set[str]] = {}
        self._user_notifications: Dict[str, List[Dict[str, Any]]] = {}
        self._redis_pool = ConnectionPool(
            host='localhost',
            port=6379,
            db=0,
            max_connections=10
        )
        self._redis = Redis(connection_pool=self._redis_pool)
        self._notification_batch: List[Dict[str, Any]] = []
        self._min_batch_size = 5
        self._max_batch_size = 50
        self._batch_size_window = 60  # seconds
        self._batch_size_metrics = []
        self._last_batch_size_adjustment = datetime.utcnow()
        self._cleanup_threshold = timedelta(days=30)  # Cleanup notifications older than 30 days
        self._performance_metrics: Dict[str, List[Tuple[float, datetime]]] = {}
        self._metric_window = timedelta(minutes=5)  # Keep 5 minutes of metrics
        self._metric_alert_thresholds = {
            MetricTypes.MESSAGE_RATE.value: 1000,  # alerts if > 1000 msg/sec
            MetricTypes.LATENCY.value: 0.1,        # alerts if > 100ms
            MetricTypes.ERROR_RATE.value: 0.01     # alerts if > 1% error rate
        }
    
    async def _record_metric(
        self,
        metric_type: MetricTypes,
        value: float,
        error: bool = False
    ) -> None:
        """Record a performance metric."""
        try:
            now = datetime.utcnow()
            if metric_type.value not in self._performance_metrics:
                self._performance_metrics[metric_type.value] = []
            
            # Add new metric
            self._performance_metrics[metric_type.value].append((value, now))
            
            # Update error rate if applicable
            if metric_type == MetricTypes.ERROR_RATE and error:
                await self._update_error_rate()
            
            # Clean old metrics
            self._clean_old_metrics(metric_type.value)
            
            # Check for alerts
            await self._check_metric_alerts(metric_type, value)
            
        except Exception as e:
            logger.error(f"Error recording metric {metric_type}", exc_info=True)

    def _clean_old_metrics(self, metric_type: str) -> None:
        """Clean metrics older than the metric window."""
        if metric_type not in self._performance_metrics:
            return
            
        cutoff_time = datetime.utcnow() - self._metric_window
        self._performance_metrics[metric_type] = [
            (value, timestamp)
            for value, timestamp in self._performance_metrics[metric_type]
            if timestamp > cutoff_time
        ]

    async def _check_metric_alerts(
        self,
        metric_type: MetricTypes,
        value: float
    ) -> None:
        """Check if metric should trigger an alert."""
        if metric_type.value not in self._metric_alert_thresholds:
            return
            
        threshold = self._metric_alert_thresholds[metric_type.value]
        if value > threshold:
            alert_data = {
                'metric_type': metric_type.value,
                'current_value': value,
                'threshold': threshold,
                'timestamp': datetime.utcnow().isoformat()
            }
            await self.notify_room_event(
                'system',
                'performance_alert',
                alert_data,
                priority=NotificationPriority.HIGH
            )

    async def _update_error_rate(self) -> None:
        """Update error rate metric."""
        if MetricTypes.ERROR_RATE.value not in self._performance_metrics:
            return
            
        total_ops = len(self._performance_metrics[MetricTypes.ERROR_RATE.value])
        if total_ops == 0:
            return
            
        error_count = sum(1 for value, _ in self._performance_metrics[MetricTypes.ERROR_RATE.value] if value > 0)
        error_rate = error_count / total_ops
        
        await self._record_metric(MetricTypes.ERROR_RATE, error_rate)

    def get_performance_metrics(
        self,
        metric_type: Optional[MetricTypes] = None
    ) -> Dict[str, Any]:
        """Get performance metrics.
        
        Args:
            metric_type: Optional specific metric type to retrieve
            
        Returns:
            Dict[str, Any]: Performance metrics
        """
        metrics = {}
        
        try:
            if metric_type:
                metric_values = self._performance_metrics.get(metric_type.value, [])
                if metric_values:
                    values = [value for value, _ in metric_values]
                    metrics[metric_type.value] = {
                        'current': values[-1],
                        'average': mean(values),
                        'min': min(values),
                        'max': max(values)
                    }
            else:
                for m_type, values in self._performance_metrics.items():
                    if values:
                        metric_values = [value for value, _ in values]
                        metrics[m_type] = {
                            'current': metric_values[-1],
                            'average': mean(metric_values),
                            'min': min(metric_values),
                            'max': max(metric_values)
                        }
            
            return metrics
            
        except Exception as e:
            logger.error("Error getting performance metrics", exc_info=True)
            return {}

    @measure_performance(MetricTypes.MESSAGE_RATE)
    async def notify_room_event(
        self,
        room_id: str,
        event: str,
        data: Dict[str, Any],
        exclude_user_id: Optional[str] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> Optional[Dict[str, Any]]:
        """Notify room members of event."""
        try:
            async with self._notification_lock:
                # Get room state
                room_state = room_state_manager.get_room_state(room_id)
                if not room_state:
                    return format_error_response(
                        ErrorCodes.ROOM_NOT_FOUND,
                        "Room not found",
                        {'room_id': room_id}
                    )
                
                # Get room
                room = room_manager.get_room(room_id)
                if not room:
                    return format_error_response(
                        ErrorCodes.ROOM_NOT_FOUND,
                        "Room not found",
                        {'room_id': room_id}
                    )
                
                # Prepare notification data with priority
                notification_data = {
                    **data,
                    'room_id': room_id,
                    'event': event,
                    'timestamp': datetime.utcnow().isoformat(),
                    'priority': priority.value,
                    'read_by': set()
                }
                
                # Add to batch if normal priority
                if priority == NotificationPriority.NORMAL:
                    self._notification_batch.append(notification_data)
                    if len(self._notification_batch) >= self._batch_size or \
                       (datetime.utcnow() - self._last_batch_time).total_seconds() >= self._batch_timeout:
                        await self._process_notification_batch()
                else:
                    # High priority notifications are sent immediately
                    await self._process_single_notification(notification_data, exclude_user_id)
                
                # Store in Redis
                notification_key = f"notification:{room_id}:{event}:{datetime.utcnow().timestamp()}"
                self._redis.set(
                    notification_key,
                    json.dumps({**notification_data, 'read_by': list(notification_data['read_by'])})
                )
                
                return None
                
        except Exception as e:
            logger.error("Error notifying room event", exc_info=True)
            return format_error_response(ErrorCodes.INTERNAL_ERROR, str(e))

    async def _adjust_batch_size(self) -> None:
        """Dynamically adjust batch size based on performance metrics."""
        now = datetime.utcnow()
        if (now - self._last_batch_size_adjustment).total_seconds() < self._batch_size_window:
            return
            
        try:
            # Get recent latency metrics
            latency_metrics = self._performance_metrics.get(MetricTypes.LATENCY.value, [])
            if not latency_metrics:
                return
                
            # Calculate average latency
            recent_latencies = [
                value for value, timestamp in latency_metrics
                if (now - timestamp).total_seconds() <= self._batch_size_window
            ]
            if not recent_latencies:
                return
                
            avg_latency = mean(recent_latencies)
            
            # Adjust batch size based on latency
            if avg_latency > 0.1:  # If latency > 100ms, decrease batch size
                self._batch_size = max(
                    self._min_batch_size,
                    int(self._batch_size * 0.8)
                )
            elif avg_latency < 0.05:  # If latency < 50ms, increase batch size
                self._batch_size = min(
                    self._max_batch_size,
                    int(self._batch_size * 1.2)
                )
                
            self._last_batch_size_adjustment = now
            
        except Exception as e:
            logger.error("Error adjusting batch size", exc_info=True)
    
    async def _store_notifications_batch(
        self,
        notifications: List[Dict[str, Any]]
    ) -> None:
        """Store multiple notifications using Redis pipeline."""
        try:
            with self._redis.pipeline() as pipe:
                for notification in notifications:
                    key = f"notification:{notification['room_id']}:{notification['event']}:{notification['timestamp']}"
                    pipe.set(
                        key,
                        json.dumps({
                            **notification,
                            'read_by': list(notification.get('read_by', set()))
                        })
                    )
                pipe.execute()
        except Exception as e:
            logger.error("Error storing notifications batch", exc_info=True)
    
    @measure_performance(MetricTypes.LATENCY)
    async def _process_notification_batch(self) -> None:
        """Process batched notifications with optimizations."""
        if not self._notification_batch:
            return
            
        try:
            # Sort notifications by priority
            sorted_notifications = sorted(
                self._notification_batch,
                key=lambda x: x['priority']
            )
            
            # Group notifications by room for efficient broadcasting
            room_notifications: Dict[str, List[Dict[str, Any]]] = {}
            for notification in sorted_notifications:
                room_id = notification['room_id']
                if room_id not in room_notifications:
                    room_notifications[room_id] = []
                room_notifications[room_id].append(notification)
            
            # Store all notifications in one batch
            await self._store_notifications_batch(sorted_notifications)
            
            # Broadcast notifications room by room
            for room_id, notifications in room_notifications.items():
                subscribers = set()
                for notification in notifications:
                    room_subscribers = self._event_subscribers.get(notification['event'], set())
                    room = room_manager.get_room(room_id)
                    if room:
                        room_subscribers.update(room.members)
                    subscribers.update(room_subscribers)
                
                # Broadcast all notifications for this room at once
                if subscribers:
                    await room_broadcaster.broadcast_to_room(
                        room_id,
                        'batch_notifications',
                        {'notifications': notifications}
                    )
            
            # Clear batch and update timing
            self._notification_batch.clear()
            self._last_batch_time = datetime.utcnow()
            
            # Adjust batch size based on performance
            await self._adjust_batch_size()
            
        except Exception as e:
            logger.error("Error processing notification batch", exc_info=True)
            # On error, process notifications individually as fallback
            for notification in sorted_notifications:
                try:
                    await self._process_single_notification(notification)
                except Exception:
                    continue

    async def _process_single_notification(
        self,
        notification: Dict[str, Any],
        exclude_user_id: Optional[str] = None
    ) -> None:
        """Process a single notification."""
        room_id = notification['room_id']
        event = notification['event']
        
        # Get subscribers and room members
        subscribers = self._event_subscribers.get(event, set())
        room = room_manager.get_room(room_id)
        if room:
            subscribers.update(room.members)
        
        if exclude_user_id:
            subscribers.discard(exclude_user_id)
            
        # Store and broadcast
        for user_id in subscribers:
            if user_id not in self._user_notifications:
                self._user_notifications[user_id] = []
            self._user_notifications[user_id].append(notification)
            
        await room_broadcaster.broadcast_to_room(
            room_id,
            event,
            notification,
            exclude_user_id
        )

    @measure_performance(MetricTypes.LATENCY)
    async def mark_notification_read(
        self,
        notification_id: str,
        user_id: str
    ) -> None:
        """Mark notification as read by user."""
        try:
            notification_data = self._redis.get(f"notification:{notification_id}")
            if notification_data:
                notification = json.loads(notification_data)
                read_by = set(notification['read_by'])
                read_by.add(user_id)
                notification['read_by'] = list(read_by)
                self._redis.set(
                    f"notification:{notification_id}",
                    json.dumps(notification)
                )
                
                # Broadcast read receipt
                await room_broadcaster.broadcast_to_room(
                    notification['room_id'],
                    'notification_read',
                    {
                        'notification_id': notification_id,
                        'user_id': user_id,
                        'timestamp': datetime.utcnow().isoformat()
                    }
                )
        except Exception as e:
            logger.error("Error marking notification as read", exc_info=True)

    def get_unread_notifications(
        self,
        user_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get unread notifications for user."""
        notifications = []
        for key in self._redis.scan_iter("notification:*"):
            try:
                notification = json.loads(self._redis.get(key))
                if user_id not in notification['read_by']:
                    notifications.append(notification)
            except Exception:
                continue
                
        notifications.sort(key=lambda x: x['timestamp'], reverse=True)
        return notifications[:limit] if limit else notifications

    async def notify_user(
        self,
        user_id: str,
        event: str,
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Notify specific user.
        
        Args:
            user_id: User ID
            event: Event name
            data: Event data
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            async with self._notification_lock:
                # Prepare notification data
                notification_data = {
                    **data,
                    'user_id': user_id,
                    'event': event,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                # Store notification
                if user_id not in self._user_notifications:
                    self._user_notifications[user_id] = []
                self._user_notifications[user_id].append(notification_data)
                
                # Broadcast notification
                error = await room_broadcaster.broadcast_to_user(
                    user_id,
                    event,
                    notification_data
                )
                
                if error:
                    self._notification_stats['failed_notifications'] += 1
                    return error
                
                # Update stats
                self._notification_stats.update({
                    'total_notifications': self._notification_stats['total_notifications'] + 1,
                    'successful_notifications': (
                        self._notification_stats['successful_notifications'] + 1
                    ),
                    'last_notification': datetime.utcnow().isoformat()
                })
                
                return None
                
        except Exception as e:
            logger.error(
                "Error notifying user",
                exc_info=True,
                extra={
                    'user_id': user_id,
                    'event': event,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error notifying user",
                {'error': str(e)}
            )
    
    def subscribe_to_event(
        self,
        event: str,
        user_id: str
    ) -> None:
        """Subscribe user to event.
        
        Args:
            event: Event name
            user_id: User ID
        """
        if event not in self._event_subscribers:
            self._event_subscribers[event] = set()
        self._event_subscribers[event].add(user_id)
    
    def unsubscribe_from_event(
        self,
        event: str,
        user_id: str
    ) -> None:
        """Unsubscribe user from event.
        
        Args:
            event: Event name
            user_id: User ID
        """
        if event in self._event_subscribers:
            self._event_subscribers[event].discard(user_id)
            if not self._event_subscribers[event]:
                del self._event_subscribers[event]
    
    def get_user_notifications(
        self,
        user_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get notifications for user.
        
        Args:
            user_id: User ID
            limit: Optional limit on number of notifications
            
        Returns:
            List[Dict[str, Any]]: List of notifications
        """
        notifications = self._user_notifications.get(user_id, [])
        if limit:
            return notifications[-limit:]
        return notifications
    
    def clear_user_notifications(
        self,
        user_id: str
    ) -> None:
        """Clear notifications for user.
        
        Args:
            user_id: User ID
        """
        if user_id in self._user_notifications:
            del self._user_notifications[user_id]
    
    def get_notification_stats(self) -> Dict[str, Any]:
        """Get notification statistics.
        
        Returns:
            Dict[str, Any]: Notification statistics
        """
        return dict(self._notification_stats)
    
    def get_event_subscribers(
        self,
        event: str
    ) -> Set[str]:
        """Get subscribers for event.
        
        Args:
            event: Event name
            
        Returns:
            Set[str]: Set of subscriber user IDs
        """
        return self._event_subscribers.get(event, set()).copy()

    async def cleanup_old_notifications(self) -> None:
        """Clean up old notifications using Redis pipeline."""
        try:
            cutoff_time = datetime.utcnow() - self._cleanup_threshold
            keys_to_delete = []
            
            # Scan for old notifications in batches
            cursor = 0
            while True:
                cursor, keys = self._redis.scan(
                    cursor,
                    match="notification:*",
                    count=1000
                )
                
                if keys:
                    # Get all notifications in one batch
                    with self._redis.pipeline() as pipe:
                        for key in keys:
                            pipe.get(key)
                        notifications = pipe.execute()
                    
                    # Check timestamps and collect keys to delete
                    for key, data in zip(keys, notifications):
                        if data:
                            try:
                                notification = json.loads(data)
                                notification_time = datetime.fromisoformat(
                                    notification['timestamp']
                                )
                                if notification_time < cutoff_time:
                                    keys_to_delete.append(key)
                            except Exception:
                                continue
                
                if cursor == 0:
                    break
            
            # Delete old notifications in batches
            if keys_to_delete:
                batch_size = 1000
                for i in range(0, len(keys_to_delete), batch_size):
                    batch = keys_to_delete[i:i + batch_size]
                    self._redis.delete(*batch)
                
                logger.info(f"Cleaned up {len(keys_to_delete)} old notifications")
                
        except Exception as e:
            logger.error("Error cleaning up old notifications", exc_info=True)

    def get_filtered_notifications(
        self,
        user_id: str,
        filters: Dict[str, Any],
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get filtered notifications for user.
        
        Args:
            user_id: User ID
            filters: Dictionary of filters to apply
                - priority: NotificationPriority
                - start_time: datetime
                - end_time: datetime
                - event_types: List[str]
                - read_status: bool
            limit: Optional limit on number of notifications
            
        Returns:
            List[Dict[str, Any]]: Filtered notifications
        """
        notifications = []
        try:
            for key in self._redis.scan_iter("notification:*"):
                try:
                    notification_data = self._redis.get(key)
                    if notification_data:
                        notification = json.loads(notification_data)
                        
                        # Apply filters
                        if not self._matches_filters(notification, user_id, filters):
                            continue
                            
                        notifications.append(notification)
                except Exception:
                    continue
                    
            # Sort by timestamp
            notifications.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return notifications[:limit] if limit else notifications
            
        except Exception as e:
            logger.error("Error getting filtered notifications", exc_info=True)
            return []

    def _matches_filters(
        self,
        notification: Dict[str, Any],
        user_id: str,
        filters: Dict[str, Any]
    ) -> bool:
        """Check if notification matches filters."""
        try:
            # Priority filter
            if 'priority' in filters and notification['priority'] != filters['priority'].value:
                return False
            
            # Time range filter
            notification_time = datetime.fromisoformat(notification['timestamp'])
            if 'start_time' in filters and notification_time < filters['start_time']:
                return False
            if 'end_time' in filters and notification_time > filters['end_time']:
                return False
            
            # Event type filter
            if 'event_types' in filters and notification['event'] not in filters['event_types']:
                return False
            
            # Read status filter
            if 'read_status' in filters:
                is_read = user_id in notification.get('read_by', [])
                if is_read != filters['read_status']:
                    return False
            
            return True
            
        except Exception:
            return False

    async def start_cleanup_task(self) -> None:
        """Start periodic cleanup of old notifications."""
        while True:
            await self.cleanup_old_notifications()
            await asyncio.sleep(86400)  # Run cleanup daily

# Global room notifications instance
room_notifications = RoomNotifications() 