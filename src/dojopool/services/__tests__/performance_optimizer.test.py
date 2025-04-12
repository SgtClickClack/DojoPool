import pytest
import asyncio
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from src.dojopool.services.performance_optimizer import PerformanceOptimizer

@pytest.fixture
def mock_redis():
    redis = Mock()
    redis.get.return_value = None
    redis.set.return_value = True
    redis.flushdb.return_value = True
    return redis

@pytest.fixture
def mock_db():
    db = Mock()
    db.execute.return_value = [
        ("SELECT * FROM users WHERE id = 1", 1500),
        ("SELECT * FROM games WHERE status = 'active'", 800)
    ]
    return db

@pytest.fixture
def optimizer(mock_redis, mock_db):
    return PerformanceOptimizer(mock_redis, mock_db)

@pytest.mark.asyncio
async def test_optimize_memory(optimizer):
    with patch('psutil.virtual_memory') as mock_memory:
        # Test high memory usage
        mock_memory.return_value.percent = 95
        result = await optimizer.optimize_memory()
        assert result['status'] == 'optimized'
        assert result['optimizations']['triggered_gc'] is True
        assert result['optimizations']['cleared_cache'] is True
        assert result['optimizations']['reduced_chunk_size'] is True

        # Test moderate memory usage
        mock_memory.return_value.percent = 85
        result = await optimizer.optimize_memory()
        assert result['status'] == 'optimized'
        assert result['optimizations']['triggered_gc'] is False
        assert result['optimizations']['cleared_cache'] is True
        assert result['optimizations']['reduced_chunk_size'] is True

        # Test low memory usage
        mock_memory.return_value.percent = 70
        result = await optimizer.optimize_memory()
        assert result['status'] == 'no_optimization_needed'

@pytest.mark.asyncio
async def test_optimize_cpu(optimizer):
    with patch('psutil.cpu_percent') as mock_cpu:
        # Test high CPU usage
        mock_cpu.return_value = 95
        result = await optimizer.optimize_cpu()
        assert result['status'] == 'optimized'
        assert result['optimizations']['reduced_threads'] is True
        assert result['optimizations']['optimized_queries'] is True
        assert result['optimizations']['enabled_caching'] is True

        # Test moderate CPU usage
        mock_cpu.return_value = 85
        result = await optimizer.optimize_cpu()
        assert result['status'] == 'optimized'
        assert result['optimizations']['reduced_threads'] is False
        assert result['optimizations']['optimized_queries'] is True
        assert result['optimizations']['enabled_caching'] is True

        # Test low CPU usage
        mock_cpu.return_value = 70
        result = await optimizer.optimize_cpu()
        assert result['status'] == 'no_optimization_needed'

@pytest.mark.asyncio
async def test_optimize_network(optimizer):
    with patch('psutil.net_io_counters') as mock_net:
        # Test high network usage
        mock_net.return_value.bytes_sent = 2000000
        mock_net.return_value.bytes_recv = 2000000
        result = await optimizer.optimize_network()
        assert result['status'] == 'optimized'
        assert result['optimizations']['enabled_compression'] is True
        assert result['optimizations']['reduced_batch_size'] is True
        assert result['optimizations']['optimized_asset_delivery'] is True

        # Test moderate network usage
        mock_net.return_value.bytes_sent = 1500000
        mock_net.return_value.bytes_recv = 1500000
        result = await optimizer.optimize_network()
        assert result['status'] == 'optimized'
        assert result['optimizations']['enabled_compression'] is True
        assert result['optimizations']['reduced_batch_size'] is True
        assert result['optimizations']['optimized_asset_delivery'] is False

        # Test low network usage
        mock_net.return_value.bytes_sent = 500000
        mock_net.return_value.bytes_recv = 500000
        result = await optimizer.optimize_network()
        assert result['status'] == 'no_optimization_needed'

@pytest.mark.asyncio
async def test_get_optimization_recommendations(optimizer):
    with patch('psutil.virtual_memory') as mock_memory, \
         patch('psutil.cpu_percent') as mock_cpu, \
         patch('psutil.net_io_counters') as mock_net:

        # Test high resource usage
        mock_memory.return_value.percent = 90
        mock_cpu.return_value = 90
        mock_net.return_value.bytes_sent = 2000000
        mock_net.return_value.bytes_recv = 2000000

        recommendations = await optimizer.get_optimization_recommendations()
        assert len(recommendations) == 3
        assert any(rec['type'] == 'memory' for rec in recommendations)
        assert any(rec['type'] == 'cpu' for rec in recommendations)
        assert any(rec['type'] == 'network' for rec in recommendations)

        # Test low resource usage
        mock_memory.return_value.percent = 70
        mock_cpu.return_value = 70
        mock_net.return_value.bytes_sent = 500000
        mock_net.return_value.bytes_recv = 500000

        recommendations = await optimizer.get_optimization_recommendations()
        assert len(recommendations) == 0

@pytest.mark.asyncio
async def test_optimization_loop(optimizer):
    with patch('psutil.virtual_memory') as mock_memory, \
         patch('psutil.cpu_percent') as mock_cpu, \
         patch('psutil.net_io_counters') as mock_net, \
         patch('asyncio.sleep') as mock_sleep:

        # Configure mock values
        mock_memory.return_value.percent = 90
        mock_cpu.return_value = 90
        mock_net.return_value.bytes_sent = 2000000
        mock_net.return_value.bytes_recv = 2000000

        # Start optimization loop
        task = asyncio.create_task(optimizer.start_optimization_loop(interval=1))
        
        # Let it run for a few iterations
        await asyncio.sleep(0.1)
        
        # Check that optimizations were performed
        assert optimizer.last_optimization.get('timestamp') is not None
        assert 'memory' in optimizer.last_optimization.get('results', {})
        assert 'cpu' in optimizer.last_optimization.get('results', {})
        assert 'network' in optimizer.last_optimization.get('results', {})

        # Clean up
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

@pytest.mark.asyncio
async def test_optimization_cooldown(optimizer):
    with patch('psutil.virtual_memory') as mock_memory, \
         patch('psutil.cpu_percent') as mock_cpu, \
         patch('psutil.net_io_counters') as mock_net:

        # Configure mock values for high resource usage
        mock_memory.return_value.percent = 90
        mock_cpu.return_value = 90
        mock_net.return_value.bytes_sent = 2000000
        mock_net.return_value.bytes_recv = 2000000

        # First optimization
        await optimizer.optimize_memory()
        first_timestamp = optimizer.last_optimization.get('timestamp')

        # Second optimization within cooldown period
        await optimizer.optimize_memory()
        assert optimizer.last_optimization.get('timestamp') == first_timestamp

        # Move time forward past cooldown period
        optimizer.last_optimization['timestamp'] = datetime.now() - timedelta(seconds=optimizer.optimization_cooldown + 1)
        
        # Third optimization after cooldown
        await optimizer.optimize_memory()
        assert optimizer.last_optimization.get('timestamp') != first_timestamp

@pytest.mark.asyncio
async def test_error_handling(optimizer):
    with patch('psutil.virtual_memory', side_effect=Exception("Test error")):
        result = await optimizer.optimize_memory()
        assert result['status'] == 'error'
        assert 'error' in result

    with patch('psutil.cpu_percent', side_effect=Exception("Test error")):
        result = await optimizer.optimize_cpu()
        assert result['status'] == 'error'
        assert 'error' in result

    with patch('psutil.net_io_counters', side_effect=Exception("Test error")):
        result = await optimizer.optimize_network()
        assert result['status'] == 'error'
        assert 'error' in result 