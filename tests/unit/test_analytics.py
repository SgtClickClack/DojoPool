"""Tests for real-time analytics module."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from src.dojopool.core.realtime.analytics import (
    RealTimeAnalytics,
    AnalyticsPeriod,
    MetricSnapshot
)
from src.dojopool.core.realtime.constants import MetricTypes

@pytest.fixture
def mock_redis():
    """Mock Redis instance."""
    with patch('redis.Redis') as mock:
        mock.return_value.get.return_value = None
        mock.return_value.set.return_value = True
        mock.return_value.scan.return_value = (0, [])
        mock.return_value.pipeline.return_value.__enter__.return_value = mock.return_value
        mock.return_value.pipeline.return_value.__exit__.return_value = None
        yield mock.return_value

@pytest.fixture
def analytics_manager(mock_redis):
    """Analytics manager instance with mocked Redis."""
    return RealTimeAnalytics()

@pytest.mark.asyncio
async def test_record_metric(analytics_manager, mock_redis):
    """Test recording a metric."""
    metric_type = MetricTypes.LATENCY
    value = 0.1
    metadata = {'user_id': 'test_user'}
    
    await analytics_manager.record_metric(metric_type, value, metadata)
    
    # Verify raw metric storage
    mock_redis.set.assert_called()
    stored_data = mock_redis.set.call_args[0][1]
    assert str(value) in stored_data
    assert 'test_user' in stored_data

@pytest.mark.asyncio
async def test_update_aggregates(analytics_manager, mock_redis):
    """Test updating metric aggregates."""
    metric_type = MetricTypes.MESSAGE_RATE
    snapshot = MetricSnapshot(
        timestamp=datetime.utcnow(),
        value=100,
        metadata={'event_type': 'message'}
    )
    
    # Mock existing aggregate
    existing_aggregate = {
        'period_start': snapshot.timestamp.isoformat(),
        'count': 1,
        'sum': 50,
        'min': 50,
        'max': 50,
        'metadata': {'event_type': {'message': 1}}
    }
    mock_redis.get.return_value = json.dumps(existing_aggregate)
    
    await analytics_manager._update_aggregates(metric_type, snapshot)
    
    # Verify aggregate update
    mock_redis.set.assert_called()
    updated_data = json.dumps(json.loads(mock_redis.set.call_args[0][1]))
    updated_aggregate = json.loads(updated_data)
    assert updated_aggregate['count'] == 2
    assert updated_aggregate['sum'] == 150
    assert updated_aggregate['min'] == 50
    assert updated_aggregate['max'] == 100
    assert updated_aggregate['metadata']['event_type']['message'] == 2

@pytest.mark.asyncio
async def test_get_metric_stats(analytics_manager, mock_redis):
    """Test retrieving metric statistics."""
    metric_type = MetricTypes.LATENCY
    period = AnalyticsPeriod.HOUR
    
    # Mock aggregates
    aggregates = [
        {
            'period_start': datetime.utcnow().isoformat(),
            'count': 10,
            'sum': 1.0,
            'min': 0.05,
            'max': 0.15,
            'metadata': {'status': {'success': 8, 'error': 2}}
        },
        {
            'period_start': (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            'count': 5,
            'sum': 0.5,
            'min': 0.08,
            'max': 0.12,
            'metadata': {'status': {'success': 5}}
        }
    ]
    
    mock_redis.get.side_effect = [json.dumps(agg) for agg in aggregates]
    
    stats = await analytics_manager.get_metric_stats(
        metric_type,
        period,
        start_time=datetime.utcnow() - timedelta(hours=2)
    )
    
    assert stats['total_count'] == 15
    assert stats['average'] == 0.1
    assert stats['min'] == 0.05
    assert stats['max'] == 0.15
    assert stats['metadata_summary']['status']['success'] == 13
    assert stats['metadata_summary']['status']['error'] == 2

@pytest.mark.asyncio
async def test_cleanup_task(analytics_manager, mock_redis):
    """Test analytics data cleanup."""
    # Mock old keys
    old_keys = [
        f"analytics:raw:latency:{(datetime.utcnow() - timedelta(days=2)).timestamp()}",
        f"analytics:aggregate:message_rate:HOUR:{(datetime.utcnow() - timedelta(days=8)).timestamp()}"
    ]
    mock_redis.scan.return_value = (0, old_keys)
    
    await analytics_manager.start_cleanup_task()
    
    # Verify old keys were deleted
    mock_redis.delete.assert_called_with(*old_keys)

@pytest.mark.asyncio
async def test_period_aggregation(analytics_manager, mock_redis):
    """Test aggregation for different time periods."""
    metric_type = MetricTypes.MESSAGE_RATE
    now = datetime.utcnow()
    
    # Record metrics across different periods
    await analytics_manager.record_metric(metric_type, 100)
    await analytics_manager.record_metric(metric_type, 200)
    
    # Mock aggregate retrieval
    minute_aggregate = {
        'period_start': now.replace(second=0, microsecond=0).isoformat(),
        'count': 2,
        'sum': 300,
        'min': 100,
        'max': 200,
        'metadata': {}
    }
    mock_redis.get.return_value = json.dumps(minute_aggregate)
    
    # Test minute aggregation
    minute_stats = await analytics_manager.get_metric_stats(
        metric_type,
        AnalyticsPeriod.MINUTE
    )
    assert minute_stats['average'] == 150
    
    # Test hour aggregation
    hour_stats = await analytics_manager.get_metric_stats(
        metric_type,
        AnalyticsPeriod.HOUR
    )
    assert hour_stats['average'] == 150

@pytest.mark.asyncio
async def test_metadata_aggregation(analytics_manager, mock_redis):
    """Test metadata aggregation across metrics."""
    metric_type = MetricTypes.LATENCY
    
    # Record metrics with different metadata
    await analytics_manager.record_metric(
        metric_type,
        0.1,
        metadata={'status': 'success', 'user_type': 'premium'}
    )
    await analytics_manager.record_metric(
        metric_type,
        0.2,
        metadata={'status': 'error', 'user_type': 'basic'}
    )
    
    # Mock aggregate retrieval
    aggregate = {
        'period_start': datetime.utcnow().isoformat(),
        'count': 2,
        'sum': 0.3,
        'min': 0.1,
        'max': 0.2,
        'metadata': {
            'status': {'success': 1, 'error': 1},
            'user_type': {'premium': 1, 'basic': 1}
        }
    }
    mock_redis.get.return_value = json.dumps(aggregate)
    
    # Get stats and verify metadata summary
    stats = await analytics_manager.get_metric_stats(
        metric_type,
        AnalyticsPeriod.MINUTE
    )
    
    metadata_summary = stats['metadata_summary']
    assert metadata_summary['status']['success'] == 1
    assert metadata_summary['status']['error'] == 1
    assert metadata_summary['user_type']['premium'] == 1
    assert metadata_summary['user_type']['basic'] == 1 