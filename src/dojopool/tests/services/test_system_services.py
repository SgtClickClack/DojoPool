import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from services.system_optimization import SystemOptimizationService
from services.auto_scaling import AutoScalingService

@pytest.fixture
def mock_metrics():
    return {
        'timestamp': datetime.now().isoformat(),
        'cpu': {
            'percent': 85.0,
            'count': 4,
            'frequency': {'current': 2400, 'min': 2200, 'max': 3000}
        },
        'memory': {
            'total': 16000000000,
            'available': 4000000000,
            'percent': 75.0,
            'used': 12000000000,
            'free': 4000000000
        },
        'disk': {
            'total': 500000000000,
            'used': 350000000000,
            'free': 150000000000,
            'percent': 70.0
        },
        'network': {
            'bytes_sent': 1000000,
            'bytes_recv': 2000000,
            'packets_sent': 1000,
            'packets_recv': 2000
        }
    }

@pytest.fixture
def system_optimization():
    return SystemOptimizationService()

@pytest.fixture
def auto_scaling():
    return AutoScalingService()

class TestSystemOptimizationService:
    def test_collect_system_metrics(self, system_optimization, mock_metrics):
        with patch('psutil.cpu_percent', return_value=85.0), \
             patch('psutil.virtual_memory', return_value=Mock(
                 total=16000000000,
                 available=4000000000,
                 percent=75.0,
                 used=12000000000,
                 free=4000000000
             )), \
             patch('psutil.disk_usage', return_value=Mock(
                 total=500000000000,
                 used=350000000000,
                 free=150000000000,
                 percent=70.0
             )), \
             patch('psutil.net_io_counters', return_value=Mock(
                 bytes_sent=1000000,
                 bytes_recv=2000000,
                 packets_sent=1000,
                 packets_recv=2000
             )):
            metrics = system_optimization.collect_system_metrics()
            assert 'cpu' in metrics
            assert 'memory' in metrics
            assert 'disk' in metrics
            assert 'network' in metrics
            
    def test_analyze_performance(self, system_optimization, mock_metrics):
        system_optimization.metrics_buffer.append(mock_metrics)
        analysis = system_optimization.analyze_performance()
        
        assert analysis['status'] == 'success'
        assert 'cpu' in analysis
        assert 'memory' in analysis
        assert 'disk' in analysis
        
    def test_get_optimization_recommendations(self, system_optimization, mock_metrics):
        system_optimization.metrics_buffer.append(mock_metrics)
        recommendations = system_optimization.get_optimization_recommendations()
        
        assert isinstance(recommendations, list)
        if recommendations:  # If there are recommendations
            assert all(isinstance(r, dict) for r in recommendations)
            assert all('component' in r for r in recommendations)
            assert all('suggestions' in r for r in recommendations)
            
    def test_detect_issues(self, system_optimization):
        cpu_usage = [85.0, 87.0, 90.0]  # High CPU usage
        issues = system_optimization._detect_cpu_issues(cpu_usage)
        
        assert 'high_average_usage' in issues
        assert 'peak_usage_critical' in issues
        
class TestAutoScalingService:
    def test_evaluate_scaling_needs(self, auto_scaling, mock_metrics):
        decision = auto_scaling.evaluate_scaling_needs(mock_metrics)
        assert isinstance(decision, dict)
        assert 'action' in decision
        assert 'reason' in decision
        
    def test_get_scaling_recommendations(self, auto_scaling, mock_metrics):
        auto_scaling.metrics_buffer.append(mock_metrics)
        recommendations = auto_scaling.get_scaling_recommendations()
        
        assert isinstance(recommendations, list)
        if recommendations:  # If there are recommendations
            assert all(isinstance(r, dict) for r in recommendations)
            assert all('resource' in r for r in recommendations)
            assert all('action' in r for r in recommendations)
            
    def test_scaling_cooldown(self, auto_scaling, mock_metrics):
        # Set last scale time to now
        auto_scaling.last_scale_time = datetime.now()
        
        # Should not scale during cooldown
        decision = auto_scaling.evaluate_scaling_needs(mock_metrics)
        assert decision['action'] == 'none'
        assert 'cooldown period' in decision['reason'].lower()
        
        # Set last scale time to past cooldown period
        auto_scaling.last_scale_time = datetime.now() - timedelta(seconds=auto_scaling.cooldown_period + 1)
        
        # Should allow scaling after cooldown
        decision = auto_scaling.evaluate_scaling_needs(mock_metrics)
        assert decision['action'] != 'none' or 'cooldown period' not in decision['reason'].lower()
        
    def test_get_scaling_history(self, auto_scaling, mock_metrics):
        auto_scaling.metrics_buffer.append(mock_metrics)
        history = auto_scaling.get_scaling_history()
        
        assert isinstance(history, list)
        if history:  # If there is history
            assert all(isinstance(entry, dict) for entry in history)
            assert all('timestamp' in entry for entry in history)
            assert all('cpu_usage' in entry for entry in history)
            assert all('memory_usage' in entry for entry in history)
            
    def test_resource_status(self, auto_scaling):
        assert auto_scaling._get_resource_status(85.0) == 'high'  # Above scale up threshold
        assert auto_scaling._get_resource_status(20.0) == 'low'   # Below scale down threshold
        assert auto_scaling._get_resource_status(50.0) == 'normal'  # Between thresholds 