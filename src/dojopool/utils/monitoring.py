from prometheus_client import Counter, Histogram, Info
from functools import wraps
import time
import platform
from flask import request

# Request metrics
REQUEST_COUNT = Counter(
    'app_request_count',
    'Application Request Count',
    ['method', 'endpoint', 'http_status']
)

REQUEST_LATENCY = Histogram(
    'app_request_latency_seconds',
    'Application Request Latency',
    ['method', 'endpoint']
)

# Database metrics
DB_QUERY_LATENCY = Histogram(
    'app_db_query_latency_seconds',
    'Database Query Latency',
    ['query_type']
)

# Custom metrics
GAME_COUNT = Counter(
    'app_game_count',
    'Number of Games Played',
    ['game_type']
)

# System info
APP_INFO = Info('app_version', 'Application Version')

def track_request_metrics():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()
            
            response = f(*args, **kwargs)
            
            # Record request latency
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.endpoint
            ).observe(time.time() - start_time)
            
            # Record request count
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint,
                http_status=response.status_code
            ).inc()
            
            return response
        return decorated_function
    return decorator

def track_db_query(query_type):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()
            
            result = f(*args, **kwargs)
            
            DB_QUERY_LATENCY.labels(
                query_type=query_type
            ).observe(time.time() - start_time)
            
            return result
        return decorated_function
    return decorator

def init_metrics(app):
    """Initialize application metrics"""
    APP_INFO.info({
        'version': app.config.get('VERSION', 'unknown'),
        'python_version': platform.python_version(),
        'environment': app.config.get('ENV', 'unknown')
    })
