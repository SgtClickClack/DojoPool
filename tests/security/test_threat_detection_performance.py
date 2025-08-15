"""
Performance tests for the threat detection system.
Tests the system's performance under various load conditions.
"""

import statistics
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Dict

import pytest
import redis

from dojopool.core.monitoring.security_monitor import (
    SecurityMonitor,
)
from dojopool.core.security import security_config as config
from dojopool.core.security.threat_detection import ThreatDetector
from .test_threat_detection_integration import MockRequest


@pytest.fixture
def redis_client():
    """Create Redis client for testing."""
    return redis.Redis(
        host=config.REDIS_HOST, port=config.REDIS_PORT, db=15  # Use separate DB for testing
    )


@pytest.fixture
def threat_detector(redis_client):
    """Create threat detector instance."""
    return ThreatDetector(redis_client=redis_client)


@pytest.fixture
def security_monitor():
    """Create security monitor instance."""
    return SecurityMonitor()


def generate_test_request(request_type: str = "normal") -> MockRequest:
    """Generate test request based on type."""
    if request_type == "sql_injection":
        return MockRequest(
            path="/api/users",
            method="POST",
            remote_addr="192.168.1.100",
            json_data={"query": "SELECT * FROM users;"},
        )
    elif request_type == "xss":
        return MockRequest(
            path="/api/comment",
            method="POST",
            remote_addr="192.168.1.101",
            json_data={"content": "<script>alert('xss')</script>"},
        )
    else:
        return MockRequest(path="/api/data", method="GET", remote_addr="192.168.1.102")


def measure_response_time(func, *args) -> float:
    """Measure response time of a function call."""
    start_time = time.time()
    func(*args)
    return time.time() - start_time


def test_threat_detection_latency(threat_detector, security_monitor):
    """Test threat detection latency under normal conditions."""
    latencies = []

    # Test with different types of requests
    request_types = ["normal", "sql_injection", "xss"]
    iterations = 100  # Number of requests per type

    for req_type in request_types:
        request = generate_test_request(req_type)
        type_latencies = []

        for _ in range(iterations):
            event = security_monitor.monitor_request(request)
            if event:
                latency = measure_response_time(threat_detector.detect_threats, event)
                type_latencies.append(latency)

        avg_latency = statistics.mean(type_latencies)
        p95_latency = statistics.quantiles(type_latencies, n=20)[18]  # 95th percentile

        print(f"\nRequest Type: {req_type}")
        print(f"Average Latency: {avg_latency:.4f}s")
        print(f"95th Percentile Latency: {p95_latency:.4f}s")

        # Assert performance requirements
        assert avg_latency < 0.1, f"Average latency too high: {avg_latency:.4f}s"
        assert p95_latency < 0.2, f"P95 latency too high: {p95_latency:.4f}s"

        latencies.extend(type_latencies)


def test_concurrent_threat_detection(threat_detector, security_monitor):
    """Test threat detection under concurrent load."""

    def process_request(req_type: str) -> Dict:
        request = generate_test_request(req_type)
        event = security_monitor.monitor_request(request)
        if event:
            start_time = time.time()
            threat = threat_detector.detect_threats(event)
            latency = time.time() - start_time
            return {"latency": latency, "threat_detected": threat is not None}
        return {"latency": 0, "threat_detected": False}

    concurrent_users = 50
    requests_per_user = 20

    with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
        futures = []
        for _ in range(concurrent_users):
            for _ in range(requests_per_user):
                req_type = "sql_injection" if _ % 5 == 0 else "normal"
                futures.append(executor.submit(process_request, req_type))

        results = [future.result() for future in futures]

    latencies = [r["latency"] for r in results if r["latency"] > 0]
    threats_detected = sum(1 for r in results if r["threat_detected"])

    avg_latency = statistics.mean(latencies)
    p95_latency = statistics.quantiles(latencies, n=20)[18]

    print("\nConcurrent Load Test Results:")
    print(f"Total Requests: {len(results)}")
    print(f"Threats Detected: {threats_detected}")
    print(f"Average Latency: {avg_latency:.4f}s")
    print(f"95th Percentile Latency: {p95_latency:.4f}s")

    # Assert performance requirements under load
    assert avg_latency < 0.2, f"Average latency under load too high: {avg_latency:.4f}s"
    assert p95_latency < 0.5, f"P95 latency under load too high: {p95_latency:.4f}s"


def test_memory_usage(threat_detector, security_monitor):
    """Test memory usage during threat detection."""
    import os

    import psutil

    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss / 1024 / 1024  # MB

    # Generate significant load
    requests = 1000
    for _ in range(requests):
        request = generate_test_request("sql_injection" if _ % 5 == 0 else "normal")
        event = security_monitor.monitor_request(request)
        if event:
            threat_detector.detect_threats(event)

    final_memory = process.memory_info().rss / 1024 / 1024  # MB
    memory_increase = final_memory - initial_memory

    print("\nMemory Usage Test Results:")
    print(f"Initial Memory: {initial_memory:.2f}MB")
    print(f"Final Memory: {final_memory:.2f}MB")
    print(f"Memory Increase: {memory_increase:.2f}MB")

    # Assert reasonable memory usage
    assert memory_increase < 100, f"Memory increase too high: {memory_increase:.2f}MB"


def test_redis_performance(threat_detector, redis_client):
    """Test Redis performance for threat detection operations."""
    operations = 1000
    redis_latencies = []

    # Test Redis operations
    for _ in range(operations):
        ip = f"192.168.1.{_ % 255}"

        # Measure set operation
        start_time = time.time()
        redis_client.setex(f"test_threat:{ip}", 3600, "test_data")
        redis_latencies.append(time.time() - start_time)

        # Measure get operation
        start_time = time.time()
        redis_client.get(f"test_threat:{ip}")
        redis_latencies.append(time.time() - start_time)

    avg_redis_latency = statistics.mean(redis_latencies)
    p95_redis_latency = statistics.quantiles(redis_latencies, n=20)[18]

    print("\nRedis Performance Test Results:")
    print(f"Average Redis Operation Latency: {avg_redis_latency:.4f}s")
    print(f"95th Percentile Redis Latency: {p95_redis_latency:.4f}s")

    # Assert Redis performance requirements
    assert avg_redis_latency < 0.005, f"Average Redis latency too high: {avg_redis_latency:.4f}s"
    assert p95_redis_latency < 0.01, f"P95 Redis latency too high: {p95_redis_latency:.4f}s"


def test_cleanup_after_performance_tests(redis_client):
    """Clean up test data after performance tests."""
    redis_client.flushdb()  # Clean test database
