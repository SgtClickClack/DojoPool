"""Tests for the real-time notification system."""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from src.dojopool.core.realtime.room_notifications import RoomNotifications
from src.dojopool.core.realtime.constants import NotificationPriority, ErrorCodes, MetricTypes

@pytest.fixture
def mock_redis():
    """Mock Redis instance."""
    with patch('redis.Redis') as mock:
        mock.return_value.get.return_value = None
        mock.return_value.set.return_value = True
        mock.return_value.scan_iter.return_value = []
        yield mock.return_value

@pytest.fixture
def notification_manager(mock_redis):
    """Notification manager instance with mocked Redis."""
    return RoomNotifications()

@pytest.mark.asyncio
async def test_high_priority_notification(notification_manager, mock_redis):
    """Test high priority notification is sent immediately."""
    room_id = "test_room"
    event = "test_event"
    data = {"message": "High priority test"}
    
    with patch('src.dojopool.core.realtime.room_notifications.room_broadcaster') as mock_broadcaster:
        await notification_manager.notify_room_event(
            room_id, 
            event, 
            data,
            priority=NotificationPriority.HIGH
        )
        
        # Verify immediate broadcast
        mock_broadcaster.broadcast_to_room.assert_called_once()
        
        # Verify Redis storage
        mock_redis.set.assert_called_once()
        stored_data = mock_redis.set.call_args[0][1]
        assert "high" in stored_data

@pytest.mark.asyncio
async def test_normal_priority_batching(notification_manager):
    """Test normal priority notifications are batched."""
    room_id = "test_room"
    event = "test_event"
    
    with patch('src.dojopool.core.realtime.room_notifications.room_broadcaster') as mock_broadcaster:
        # Send multiple normal priority notifications
        for i in range(5):
            await notification_manager.notify_room_event(
                room_id,
                event,
                {"message": f"Test {i}"},
                priority=NotificationPriority.NORMAL
            )
            
        # Verify notifications are batched (not sent immediately)
        assert len(notification_manager._notification_batch) == 5
        mock_broadcaster.broadcast_to_room.assert_not_called()
        
        # Force batch processing
        notification_manager._batch_timeout = 0
        await notification_manager._process_notification_batch()
        
        # Verify all notifications were sent
        assert mock_broadcaster.broadcast_to_room.call_count == 5
        assert len(notification_manager._notification_batch) == 0

@pytest.mark.asyncio
async def test_read_receipts(notification_manager, mock_redis):
    """Test notification read receipts."""
    notification_id = "test_notification"
    user_id = "test_user"
    room_id = "test_room"
    
    # Mock stored notification
    mock_redis.get.return_value = '{{"read_by": [], "room_id": "{0}"}}'.format(room_id)
    
    with patch('src.dojopool.core.realtime.room_notifications.room_broadcaster') as mock_broadcaster:
        await notification_manager.mark_notification_read(notification_id, user_id)
        
        # Verify read status updated
        mock_redis.set.assert_called_once()
        stored_data = mock_redis.set.call_args[0][1]
        assert user_id in stored_data
        
        # Verify read receipt broadcast
        mock_broadcaster.broadcast_to_room.assert_called_once()
        broadcast_data = mock_broadcaster.broadcast_to_room.call_args[0][2]
        assert broadcast_data['notification_id'] == notification_id
        assert broadcast_data['user_id'] == user_id

@pytest.mark.asyncio
async def test_get_unread_notifications(notification_manager, mock_redis):
    """Test retrieving unread notifications."""
    user_id = "test_user"
    notifications = [
        '{{"read_by": [], "timestamp": "{0}", "message": "Test 1"}}'.format(
            datetime.utcnow().isoformat()
        ),
        '{{"read_by": ["{0}"], "timestamp": "{1}", "message": "Test 2"}}'.format(
            user_id,
            datetime.utcnow().isoformat()
        )
    ]
    
    mock_redis.scan_iter.return_value = ["notification:1", "notification:2"]
    mock_redis.get.side_effect = notifications
    
    unread = notification_manager.get_unread_notifications(user_id)
    
    # Verify only unread notifications returned
    assert len(unread) == 1
    assert unread[0]['message'] == "Test 1"

@pytest.mark.asyncio
async def test_notification_persistence(notification_manager, mock_redis):
    """Test notifications are persisted in Redis."""
    room_id = "test_room"
    event = "test_event"
    data = {"message": "Test persistence"}
    
    await notification_manager.notify_room_event(room_id, event, data)
    
    # Verify notification stored in Redis
    mock_redis.set.assert_called_once()
    stored_data = mock_redis.set.call_args[0][1]
    assert "message" in stored_data
    assert "Test persistence" in stored_data

@pytest.mark.asyncio
async def test_batch_timeout(notification_manager):
    """Test notifications are processed after batch timeout."""
    room_id = "test_room"
    event = "test_event"
    
    with patch('src.dojopool.core.realtime.room_notifications.room_broadcaster') as mock_broadcaster:
        # Send notification and set old batch time
        await notification_manager.notify_room_event(
            room_id,
            event,
            {"message": "Test timeout"}
        )
        notification_manager._last_batch_time = datetime.utcnow() - timedelta(seconds=2)
        
        # Send another notification to trigger timeout check
        await notification_manager.notify_room_event(
            room_id,
            event,
            {"message": "Test timeout 2"}
        )
        
        # Verify batch was processed due to timeout
        assert mock_broadcaster.broadcast_to_room.call_count == 2
        assert len(notification_manager._notification_batch) == 0 

@pytest.mark.asyncio
async def test_performance_metrics_recording(notification_manager):
    """Test performance metrics are recorded correctly."""
    # Test metric recording
    await notification_manager._record_metric(MetricTypes.LATENCY, 0.05)
    
    # Verify metric was recorded
    metrics = notification_manager.get_performance_metrics(MetricTypes.LATENCY)
    assert MetricTypes.LATENCY.value in metrics
    assert metrics[MetricTypes.LATENCY.value]['current'] == 0.05
    assert metrics[MetricTypes.LATENCY.value]['min'] == 0.05
    assert metrics[MetricTypes.LATENCY.value]['max'] == 0.05

@pytest.mark.asyncio
async def test_performance_alerts(notification_manager):
    """Test performance alerts are triggered when thresholds are exceeded."""
    with patch('src.dojopool.core.realtime.room_notifications.room_broadcaster') as mock_broadcaster:
        # Record metric exceeding threshold
        await notification_manager._record_metric(
            MetricTypes.LATENCY,
            0.2  # Above 0.1s threshold
        )
        
        # Verify alert was sent
        mock_broadcaster.broadcast_to_room.assert_called_once()
        alert_data = mock_broadcaster.broadcast_to_room.call_args[0][2]
        assert alert_data['metric_type'] == MetricTypes.LATENCY.value
        assert alert_data['current_value'] == 0.2

@pytest.mark.asyncio
async def test_metric_cleanup(notification_manager):
    """Test old metrics are cleaned up."""
    # Add metrics with old timestamps
    old_time = datetime.utcnow() - timedelta(minutes=10)
    notification_manager._performance_metrics[MetricTypes.LATENCY.value] = [
        (0.1, old_time),
        (0.2, datetime.utcnow())
    ]
    
    # Clean old metrics
    notification_manager._clean_old_metrics(MetricTypes.LATENCY.value)
    
    # Verify old metrics were removed
    metrics = notification_manager._performance_metrics[MetricTypes.LATENCY.value]
    assert len(metrics) == 1
    assert metrics[0][0] == 0.2

@pytest.mark.asyncio
async def test_error_rate_calculation(notification_manager):
    """Test error rate is calculated correctly."""
    # Record some successful and failed operations
    await notification_manager._record_metric(MetricTypes.ERROR_RATE, 0, error=False)
    await notification_manager._record_metric(MetricTypes.ERROR_RATE, 1, error=True)
    await notification_manager._record_metric(MetricTypes.ERROR_RATE, 0, error=False)
    
    # Verify error rate
    metrics = notification_manager.get_performance_metrics(MetricTypes.ERROR_RATE)
    assert metrics[MetricTypes.ERROR_RATE.value]['current'] == 1/3

@pytest.mark.asyncio
async def test_performance_decorator(notification_manager):
    """Test performance measurement decorator."""
    with patch.object(notification_manager, '_record_metric') as mock_record:
        # Call method with performance decorator
        await notification_manager.notify_room_event(
            "test_room",
            "test_event",
            {"message": "test"}
        )
        
        # Verify metric was recorded
        mock_record.assert_called()
        assert mock_record.call_args[0][0] == MetricTypes.MESSAGE_RATE

@pytest.mark.asyncio
async def test_metric_aggregation(notification_manager):
    """Test metric aggregation functions."""
    # Record multiple metrics
    values = [0.1, 0.2, 0.3]
    for value in values:
        await notification_manager._record_metric(MetricTypes.LATENCY, value)
    
    # Get aggregated metrics
    metrics = notification_manager.get_performance_metrics(MetricTypes.LATENCY)
    
    # Verify aggregations
    assert metrics[MetricTypes.LATENCY.value]['min'] == 0.1
    assert metrics[MetricTypes.LATENCY.value]['max'] == 0.3
    assert metrics[MetricTypes.LATENCY.value]['average'] == 0.2
    assert metrics[MetricTypes.LATENCY.value]['current'] == 0.3

@pytest.mark.asyncio
async def test_multiple_metric_types(notification_manager):
    """Test handling of multiple metric types."""
    # Record different types of metrics
    await notification_manager._record_metric(MetricTypes.LATENCY, 0.1)
    await notification_manager._record_metric(MetricTypes.MESSAGE_RATE, 100)
    await notification_manager._record_metric(MetricTypes.ERROR_RATE, 0.01)
    
    # Get all metrics
    all_metrics = notification_manager.get_performance_metrics()
    
    # Verify all metric types are present
    assert MetricTypes.LATENCY.value in all_metrics
    assert MetricTypes.MESSAGE_RATE.value in all_metrics
    assert MetricTypes.ERROR_RATE.value in all_metrics 