import pytest
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from src.models import User, Game, Match, Location
from src.api.decorators import rate_limit

def test_database_query_performance(client, db_session, benchmark):
    """Test database query performance."""
    # Create test data
    users = [User(
        username=f'user{i}',
        email=f'user{i}@example.com',
        password='password123'
    ) for i in range(100)]
    db_session.bulk_save_objects(users)
    db_session.commit()
    
    def query_users():
        return User.query.all()
    
    # Benchmark query performance
    result = benchmark(query_users)
    assert len(result) == 100
    assert benchmark.stats.mean < 0.1  # Average query time should be under 100ms

def test_api_endpoint_response_time(client, auth_headers):
    """Test API endpoint response times."""
    endpoints = [
        ('/api/users/profile', 'GET'),
        ('/api/games', 'GET'),
        ('/api/matches', 'GET'),
        ('/api/locations', 'GET')
    ]
    
    for endpoint, method in endpoints:
        start_time = time.time()
        if method == 'GET':
            response = client.get(endpoint, headers=auth_headers)
        elif method == 'POST':
            response = client.post(endpoint, headers=auth_headers)
        
        response_time = time.time() - start_time
        
        assert response.status_code == 200
        assert response_time < 0.5  # Response time should be under 500ms

def test_concurrent_requests(client, auth_headers):
    """Test handling of concurrent requests."""
    num_requests = 50
    endpoint = '/api/locations'
    
    def make_request():
        return client.get(endpoint, headers=auth_headers)
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        responses = list(executor.map(lambda _: make_request(), range(num_requests)))
    
    # Check responses
    success_count = sum(1 for r in responses if r.status_code == 200)
    assert success_count >= num_requests * 0.95  # 95% success rate

def test_rate_limiting(client, auth_headers):
    """Test rate limiting performance."""
    endpoint = '/api/games'
    requests_per_minute = 100
    
    start_time = time.time()
    responses = []
    
    for _ in range(requests_per_minute):
        response = client.get(endpoint, headers=auth_headers)
        responses.append(response)
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Check rate limiting
    rate_limited = [r for r in responses if r.status_code == 429]
    assert len(rate_limited) > 0
    assert duration < 60  # Should complete within a minute

def test_database_connection_pool(db_session, benchmark):
    """Test database connection pool performance."""
    def db_operation():
        User.query.count()
        Game.query.count()
        Match.query.count()
        Location.query.count()
    
    # Benchmark multiple database operations
    result = benchmark.pedantic(
        db_operation,
        iterations=100,
        rounds=10
    )
    assert benchmark.stats.mean < 0.1  # Average operation time under 100ms

def test_memory_usage(client, db_session):
    """Test memory usage during operations."""
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss
    
    # Perform memory-intensive operations
    large_dataset = [User(
        username=f'user{i}',
        email=f'user{i}@example.com',
        password='password123'
    ) for i in range(1000)]
    db_session.bulk_save_objects(large_dataset)
    db_session.commit()
    
    # Query the data
    users = User.query.all()
    
    final_memory = process.memory_info().rss
    memory_increase = final_memory - initial_memory
    
    # Check memory usage
    assert memory_increase < 100 * 1024 * 1024  # Less than 100MB increase

def test_cache_performance(client, auth_headers, benchmark):
    """Test caching performance."""
    endpoint = '/api/locations'
    
    def cached_request():
        return client.get(endpoint, headers=auth_headers)
    
    # First request (uncached)
    first_response = cached_request()
    first_time = benchmark(cached_request)
    
    # Second request (should be cached)
    second_response = cached_request()
    second_time = benchmark(cached_request)
    
    assert second_time < first_time
    assert second_time < 0.01  # Cached response should be under 10ms

def test_database_index_performance(db_session, benchmark):
    """Test database index performance."""
    # Create test data
    num_records = 1000
    users = [User(
        username=f'user{i}',
        email=f'user{i}@example.com',
        password='password123'
    ) for i in range(num_records)]
    db_session.bulk_save_objects(users)
    db_session.commit()
    
    def indexed_query():
        return User.query.filter_by(email='user500@example.com').first()
    
    def non_indexed_query():
        return User.query.filter(User.username.like('%user500%')).first()
    
    # Benchmark queries
    indexed_time = benchmark(indexed_query)
    non_indexed_time = benchmark(non_indexed_query)
    
    assert indexed_time < non_indexed_time
    assert indexed_time < 0.01  # Indexed query should be under 10ms

def test_bulk_operations_performance(db_session, benchmark):
    """Test bulk operation performance."""
    num_records = 1000
    
    def bulk_insert():
        users = [User(
            username=f'bulk_user{i}',
            email=f'bulk_user{i}@example.com',
            password='password123'
        ) for i in range(num_records)]
        db_session.bulk_save_objects(users)
        db_session.commit()
    
    def individual_insert():
        for i in range(num_records):
            user = User(
                username=f'individual_user{i}',
                email=f'individual_user{i}@example.com',
                password='password123'
            )
            db_session.add(user)
            db_session.commit()
    
    bulk_time = benchmark(bulk_insert)
    individual_time = benchmark(individual_insert)
    
    assert bulk_time < individual_time
    assert bulk_time < individual_time / 10  # Bulk should be at least 10x faster

def test_api_pagination_performance(client, auth_headers, db_session):
    """Test pagination performance."""
    # Create test data
    num_records = 1000
    locations = [Location(
        name=f'Location {i}',
        address=f'Address {i}',
        city='Test City'
    ) for i in range(num_records)]
    db_session.bulk_save_objects(locations)
    db_session.commit()
    
    page_sizes = [10, 50, 100]
    for size in page_sizes:
        start_time = time.time()
        response = client.get(
            f'/api/locations?page=1&per_page={size}',
            headers=auth_headers
        )
        response_time = time.time() - start_time
        
        assert response.status_code == 200
        assert len(response.json['items']) == size
        assert response_time < 0.5  # Should be under 500ms regardless of page size

def test_search_performance(client, auth_headers, db_session):
    """Test search functionality performance."""
    # Create test data
    locations = [Location(
        name=f'Pool Hall {i}',
        address=f'Address {i}',
        city='Test City'
    ) for i in range(1000)]
    db_session.bulk_save_objects(locations)
    db_session.commit()
    
    search_terms = ['Pool', 'Hall', 'Test City', 'Address']
    
    for term in search_terms:
        start_time = time.time()
        response = client.get(
            f'/api/locations/search?q={term}',
            headers=auth_headers
        )
        search_time = time.time() - start_time
        
        assert response.status_code == 200
        assert search_time < 1.0  # Search should complete within 1 second

def test_background_task_performance():
    """Test background task performance."""
    from src.tasks import send_match_reminders
    
    start_time = time.time()
    send_match_reminders()
    execution_time = time.time() - start_time
    
    assert execution_time < 5.0  # Background task should complete within 5 seconds

def test_websocket_performance(client):
    """Test WebSocket performance."""
    import websockets
    import asyncio
    
    async def websocket_test():
        uri = "ws://localhost:5000/ws"
        async with websockets.connect(uri) as websocket:
            start_time = time.time()
            await websocket.send("ping")
            response = await websocket.recv()
            latency = time.time() - start_time
            
            assert response == "pong"
            assert latency < 0.1  # WebSocket latency should be under 100ms
    
    asyncio.run(websocket_test()) 