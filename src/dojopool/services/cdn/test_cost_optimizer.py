import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from ..cost_optimizer import CDNCostOptimizer

@pytest.fixture
def cost_optimizer():
    return CDNCostOptimizer()

@pytest.fixture
def mock_cost_report():
    return {
        'optimization': {
            'optimized': True,
            'costs': {
                'total_cost': 1000.0,
                'bandwidth_cost': 600.0,
                'request_cost': 400.0
            },
            'savings': 200.0,
            'optimization_time': 1.5,
            'timestamp': datetime.now().isoformat()
        },
        'usage': {
            'hourly_usage': {i: 100 for i in range(24)},
            'daily_usage': {'2024-01-01': 2400},
            'weekly_usage': {'2024-W01': 16800}
        },
        'projections': {
            'daily': {'2024-01-02': 2500},
            'weekly': {'2024-W02': 17500},
            'monthly': {'2024-01': 70000}
        },
        'timestamp': datetime.now().isoformat()
    }

def test_optimize_costs(cost_optimizer, mock_cost_report):
    with patch.object(cost_optimizer, '_analyze_costs', return_value=mock_cost_report['optimization']['costs']), \
         patch.object(cost_optimizer, '_analyze_usage_patterns', return_value=mock_cost_report['usage']), \
         patch.object(cost_optimizer, '_generate_cost_projections', return_value=mock_cost_report['projections']):
        
        result = cost_optimizer.optimize_costs()
        
        assert result['optimization']['optimized'] is True
        assert result['optimization']['costs']['total_cost'] == 1000.0
        assert result['optimization']['savings'] == 200.0
        assert result['optimization']['optimization_time'] == 1.5
        assert 'timestamp' in result['optimization']

def test_generate_cost_report(cost_optimizer, mock_cost_report):
    with patch.object(cost_optimizer, '_analyze_costs', return_value=mock_cost_report['optimization']['costs']), \
         patch.object(cost_optimizer, '_analyze_usage_patterns', return_value=mock_cost_report['usage']), \
         patch.object(cost_optimizer, '_generate_cost_projections', return_value=mock_cost_report['projections']):
        
        result = cost_optimizer.generate_cost_report()
        
        assert result['optimization']['optimized'] is True
        assert result['optimization']['costs']['total_cost'] == 1000.0
        assert result['optimization']['savings'] == 200.0
        assert result['optimization']['optimization_time'] == 1.5
        assert 'timestamp' in result['optimization']
        assert 'hourly_usage' in result['usage']
        assert 'daily_usage' in result['usage']
        assert 'weekly_usage' in result['usage']
        assert 'daily' in result['projections']
        assert 'weekly' in result['projections']
        assert 'monthly' in result['projections']

def test_analyze_costs(cost_optimizer):
    with patch('boto3.client') as mock_boto3:
        mock_client = Mock()
        mock_boto3.return_value = mock_client
        
        mock_client.get_cost_and_usage.return_value = {
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
        }
        
        costs = cost_optimizer._analyze_costs()
        
        assert costs['total_cost'] == 1000.0
        assert costs['bandwidth_cost'] == 600.0
        assert costs['request_cost'] == 400.0

def test_analyze_usage_patterns(cost_optimizer):
    with patch('boto3.client') as mock_boto3:
        mock_client = Mock()
        mock_boto3.return_value = mock_client
        
        mock_client.get_metric_statistics.return_value = {
            'Datapoints': [
                {
                    'Timestamp': datetime.now(),
                    'Average': 100.0
                }
            ]
        }
        
        patterns = cost_optimizer._analyze_usage_patterns()
        
        assert 'hourly_usage' in patterns
        assert 'daily_usage' in patterns
        assert 'weekly_usage' in patterns
        assert len(patterns['hourly_usage']) == 24

def test_generate_cost_projections(cost_optimizer):
    with patch.object(cost_optimizer, '_analyze_costs', return_value={
        'total_cost': 1000.0,
        'bandwidth_cost': 600.0,
        'request_cost': 400.0
    }), \
         patch.object(cost_optimizer, '_analyze_usage_patterns', return_value={
        'hourly_usage': {i: 100 for i in range(24)},
        'daily_usage': {'2024-01-01': 2400},
        'weekly_usage': {'2024-W01': 16800}
    }):
        
        projections = cost_optimizer._generate_cost_projections()
        
        assert 'daily' in projections
        assert 'weekly' in projections
        assert 'monthly' in projections
        assert len(projections['daily']) > 0
        assert len(projections['weekly']) > 0
        assert len(projections['monthly']) > 0

def test_error_handling(cost_optimizer):
    with patch('boto3.client', side_effect=Exception('AWS API Error')):
        result = cost_optimizer.optimize_costs()
        
        assert result['optimization']['optimized'] is False
        assert result['optimization']['costs']['total_cost'] == 0.0
        assert result['optimization']['costs']['bandwidth_cost'] == 0.0
        assert result['optimization']['costs']['request_cost'] == 0.0
        assert result['optimization']['savings'] == 0.0
        assert result['optimization']['optimization_time'] == 0.0
        assert 'timestamp' in result['optimization']

def test_optimization_thresholds(cost_optimizer):
    with patch.object(cost_optimizer, '_analyze_costs', return_value={
        'total_cost': 1000.0,
        'bandwidth_cost': 600.0,
        'request_cost': 400.0
    }), \
         patch.object(cost_optimizer, '_analyze_usage_patterns', return_value={
        'hourly_usage': {i: 100 for i in range(24)},
        'daily_usage': {'2024-01-01': 2400},
        'weekly_usage': {'2024-W01': 16800}
    }):
        
        # Test with high threshold
        result_high = cost_optimizer.optimize_costs(cost_threshold=2000.0)
        assert result_high['optimization']['optimized'] is False
        
        # Test with low threshold
        result_low = cost_optimizer.optimize_costs(cost_threshold=500.0)
        assert result_low['optimization']['optimized'] is True 