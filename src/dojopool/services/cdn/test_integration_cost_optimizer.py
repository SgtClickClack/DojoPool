import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from ..cost_optimizer import CDNCostOptimizer
from ..analytics import CDNAnalyticsService
from ..health_monitor import CDNHealthMonitor
from ..cache_optimizer import CDNCacheOptimizer

@pytest.fixture
def cost_optimizer():
    return CDNCostOptimizer()

@pytest.fixture
def analytics_service():
    return CDNAnalyticsService()

@pytest.fixture
def health_monitor():
    return CDNHealthMonitor()

@pytest.fixture
def cache_optimizer():
    return CDNCacheOptimizer()

@pytest.fixture
def mock_aws_data():
    return {
        'costs': {
            'ResultsByTime': [{
                'TimePeriod': {'Start': '2024-01-01', 'End': '2024-01-01'},
                'Groups': [
                    {
                        'Keys': ['AWS-DataTransfer-Out-Bytes'],
                        'Metrics': {'UnblendedCost': {'Amount': '600.0'}}
                    },
                    {
                        'Keys': ['AWS-Requests-Tier1'],
                        'Metrics': {'UnblendedCost': {'Amount': '400.0'}}
                    }
                ]
            }]
        },
        'metrics': {
            'Datapoints': [
                {
                    'Timestamp': datetime.now(),
                    'Average': 100.0
                }
            ]
        },
        'health': {
            'HealthStatus': 'Healthy',
            'ResponseTime': 50
        },
        'cache': {
            'CacheHitRate': 95.5,
            'CacheMissRate': 4.5
        }
    }

def test_cost_optimization_with_analytics(cost_optimizer, analytics_service, mock_aws_data):
    with patch('boto3.client') as mock_boto3:
        mock_client = Mock()
        mock_boto3.return_value = mock_client
        
        # Mock AWS responses
        mock_client.get_cost_and_usage.return_value = mock_aws_data['costs']
        mock_client.get_metric_statistics.return_value = mock_aws_data['metrics']
        
        # Get analytics data
        analytics_data = analytics_service.get_analytics()
        
        # Optimize costs with analytics data
        result = cost_optimizer.optimize_costs(analytics_data=analytics_data)
        
        assert result['optimization']['optimized'] is True
        assert result['optimization']['costs']['total_cost'] == 1000.0
        assert 'analytics' in result
        assert result['analytics']['request_count'] > 0
        assert result['analytics']['bandwidth_usage'] > 0

def test_cost_optimization_with_health_monitor(cost_optimizer, health_monitor, mock_aws_data):
    with patch('boto3.client') as mock_boto3:
        mock_client = Mock()
        mock_boto3.return_value = mock_client
        
        # Mock AWS responses
        mock_client.get_cost_and_usage.return_value = mock_aws_data['costs']
        mock_client.get_health_check_status.return_value = mock_aws_data['health']
        
        # Get health status
        health_status = health_monitor.check_health()
        
        # Optimize costs with health status
        result = cost_optimizer.optimize_costs(health_status=health_status)
        
        assert result['optimization']['optimized'] is True
        assert result['optimization']['costs']['total_cost'] == 1000.0
        assert 'health' in result
        assert result['health']['status'] == 'Healthy'
        assert result['health']['response_time'] == 50

def test_cost_optimization_with_cache_optimizer(cost_optimizer, cache_optimizer, mock_aws_data):
    with patch('boto3.client') as mock_boto3:
        mock_client = Mock()
        mock_boto3.return_value = mock_client
        
        # Mock AWS responses
        mock_client.get_cost_and_usage.return_value = mock_aws_data['costs']
        mock_client.get_cache_statistics.return_value = mock_aws_data['cache']
        
        # Get cache statistics
        cache_stats = cache_optimizer.get_cache_statistics()
        
        # Optimize costs with cache statistics
        result = cost_optimizer.optimize_costs(cache_stats=cache_stats)
        
        assert result['optimization']['optimized'] is True
        assert result['optimization']['costs']['total_cost'] == 1000.0
        assert 'cache' in result
        assert result['cache']['hit_rate'] == 95.5
        assert result['cache']['miss_rate'] == 4.5

def test_full_integration_optimization(cost_optimizer, analytics_service, health_monitor, cache_optimizer, mock_aws_data):
    with patch('boto3.client') as mock_boto3:
        mock_client = Mock()
        mock_boto3.return_value = mock_client
        
        # Mock all AWS responses
        mock_client.get_cost_and_usage.return_value = mock_aws_data['costs']
        mock_client.get_metric_statistics.return_value = mock_aws_data['metrics']
        mock_client.get_health_check_status.return_value = mock_aws_data['health']
        mock_client.get_cache_statistics.return_value = mock_aws_data['cache']
        
        # Get all required data
        analytics_data = analytics_service.get_analytics()
        health_status = health_monitor.check_health()
        cache_stats = cache_optimizer.get_cache_statistics()
        
        # Perform full optimization
        result = cost_optimizer.optimize_costs(
            analytics_data=analytics_data,
            health_status=health_status,
            cache_stats=cache_stats
        )
        
        assert result['optimization']['optimized'] is True
        assert result['optimization']['costs']['total_cost'] == 1000.0
        assert 'analytics' in result
        assert 'health' in result
        assert 'cache' in result
        assert result['optimization']['savings'] > 0

def test_error_handling_integration(cost_optimizer, analytics_service, health_monitor, cache_optimizer):
    with patch('boto3.client', side_effect=Exception('AWS API Error')):
        # Attempt to get data from all services
        analytics_data = analytics_service.get_analytics()
        health_status = health_monitor.check_health()
        cache_stats = cache_optimizer.get_cache_statistics()
        
        # Attempt optimization with partial data
        result = cost_optimizer.optimize_costs(
            analytics_data=analytics_data,
            health_status=health_status,
            cache_stats=cache_stats
        )
        
        assert result['optimization']['optimized'] is False
        assert result['optimization']['costs']['total_cost'] == 0.0
        assert result['optimization']['savings'] == 0.0
        assert 'error' in result

def test_performance_metrics_integration(cost_optimizer, analytics_service, health_monitor, cache_optimizer, mock_aws_data):
    with patch('boto3.client') as mock_boto3:
        mock_client = Mock()
        mock_boto3.return_value = mock_client
        
        # Mock AWS responses
        mock_client.get_cost_and_usage.return_value = mock_aws_data['costs']
        mock_client.get_metric_statistics.return_value = mock_aws_data['metrics']
        mock_client.get_health_check_status.return_value = mock_aws_data['health']
        mock_client.get_cache_statistics.return_value = mock_aws_data['cache']
        
        # Get all required data
        analytics_data = analytics_service.get_analytics()
        health_status = health_monitor.check_health()
        cache_stats = cache_optimizer.get_cache_statistics()
        
        # Perform optimization and measure time
        start_time = datetime.now()
        result = cost_optimizer.optimize_costs(
            analytics_data=analytics_data,
            health_status=health_status,
            cache_stats=cache_stats
        )
        end_time = datetime.now()
        
        # Verify performance metrics
        optimization_time = (end_time - start_time).total_seconds()
        assert optimization_time < 5.0  # Should complete within 5 seconds
        assert result['optimization']['optimization_time'] < 5.0 