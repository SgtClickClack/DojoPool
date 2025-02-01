import pytest
from ...tests.scalability.load_generator import LoadGenerator
from ...tests.scalability.metrics_collector import MetricsCollector
from ...tests.scalability.test_scenarios import (
    load_test_config,
    stress_test_config,
    spike_test_config,
    endurance_test_config,
)


@pytest.fixture
def load_generator():
    return LoadGenerator()


@pytest.fixture
def metrics_collector():
    return MetricsCollector()


def test_load_test_scenario(load_generator, metrics_collector):
    # Run load test
    results = load_generator.run_scenario(load_test_config)
    metrics = metrics_collector.collect_metrics()

    # Verify response times
    assert metrics["avg_response_time"] < 200  # ms
    assert metrics["95th_percentile"] < 500  # ms
    assert metrics["error_rate"] < 0.01  # 1%

    # Verify throughput
    assert metrics["requests_per_second"] > 100

    # Verify resource utilization
    assert metrics["cpu_usage"] < 80  # %
    assert metrics["memory_usage"] < 80  # %
    assert metrics["network_usage"] < 80  # %


def test_stress_test_scenario(load_generator, metrics_collector):
    # Run stress test
    results = load_generator.run_scenario(stress_test_config)
    metrics = metrics_collector.collect_metrics()

    # Verify system stability
    assert metrics["error_rate"] < 0.05  # 5%
    assert metrics["system_crashes"] == 0

    # Verify recovery
    assert metrics["recovery_time"] < 60  # seconds

    # Verify resource limits
    assert metrics["max_cpu_usage"] < 95  # %
    assert metrics["max_memory_usage"] < 95  # %
    assert metrics["max_network_usage"] < 95  # %


def test_spike_test_scenario(load_generator, metrics_collector):
    # Run spike test
    results = load_generator.run_scenario(spike_test_config)
    metrics = metrics_collector.collect_metrics()

    # Verify spike handling
    assert metrics["max_response_time"] < 1000  # ms
    assert metrics["error_rate_during_spike"] < 0.10  # 10%

    # Verify recovery after spike
    assert metrics["recovery_time_after_spike"] < 30  # seconds
    assert metrics["post_spike_error_rate"] < 0.01  # 1%


def test_endurance_test_scenario(load_generator, metrics_collector):
    # Run endurance test
    results = load_generator.run_scenario(endurance_test_config)
    metrics = metrics_collector.collect_metrics()

    # Verify long-term stability
    assert metrics["uptime"] > 86400  # 24 hours
    assert metrics["memory_leak_detected"] == False
    assert metrics["error_rate_trend"] < 0.01  # 1%

    # Verify resource stability
    assert metrics["cpu_usage_variance"] < 10  # %
    assert metrics["memory_usage_trend"] < 5  # % growth
    assert metrics["connection_leak_detected"] == False


def test_concurrent_tournaments(load_generator, metrics_collector):
    # Test multiple tournaments running concurrently
    config = {
        "num_tournaments": 10,
        "players_per_tournament": 16,
        "concurrent_matches": 5,
        "duration": 3600,  # 1 hour
    }

    results = load_generator.run_tournament_load_test(config)
    metrics = metrics_collector.collect_metrics()

    # Verify tournament performance
    assert metrics["tournament_completion_rate"] > 0.95  # 95%
    assert metrics["avg_match_duration"] < 300  # seconds
    assert metrics["match_scheduling_delays"] < 10  # seconds

    # Verify system performance
    assert metrics["database_queries_per_second"] < 1000
    assert metrics["websocket_messages_per_second"] < 5000
    assert metrics["cache_hit_ratio"] > 0.90  # 90%


def test_game_analysis_performance(load_generator, metrics_collector):
    # Test AI game analysis performance under load
    config = {
        "num_concurrent_games": 100,
        "analysis_requests_per_second": 50,
        "duration": 600,  # 10 minutes
    }

    results = load_generator.run_game_analysis_load_test(config)
    metrics = metrics_collector.collect_metrics()

    # Verify analysis performance
    assert metrics["avg_analysis_time"] < 100  # ms
    assert metrics["analysis_success_rate"] > 0.99  # 99%
    assert metrics["analysis_queue_length"] < 100

    # Verify resource usage
    assert metrics["gpu_usage"] < 80  # %
    assert metrics["model_inference_time"] < 50  # ms
    assert metrics["batch_processing_efficiency"] > 0.90  # 90%
