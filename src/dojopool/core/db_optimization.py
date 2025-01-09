"""Database optimization module for DojoPool."""

import time
import logging
import threading
from typing import Any, Dict, List, Optional, Tuple, Union
from functools import wraps
from contextlib import contextmanager
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import DictCursor
from .cache import CacheManager

logger = logging.getLogger(__name__)

class QueryProfiler:
    """Query profiling and optimization manager."""
    
    def __init__(self):
        """Initialize query profiler."""
        self.query_stats: Dict[str, Dict[str, float]] = {}
    
    def record_query(self, query: str, execution_time: float):
        """Record query execution statistics.
        
        Args:
            query: SQL query string
            execution_time: Query execution time in seconds
        """
        if query not in self.query_stats:
            self.query_stats[query] = {
                'count': 0,
                'total_time': 0,
                'avg_time': 0,
                'min_time': float('inf'),
                'max_time': 0
            }
        
        stats = self.query_stats[query]
        stats['count'] += 1
        stats['total_time'] += execution_time
        stats['avg_time'] = stats['total_time'] / stats['count']
        stats['min_time'] = min(stats['min_time'], execution_time)
        stats['max_time'] = max(stats['max_time'], execution_time)
    
    def get_slow_queries(self, threshold: float = 1.0) -> List[Tuple[str, Dict[str, float]]]:
        """Get list of slow queries.
        
        Args:
            threshold: Threshold in seconds for slow query logging
        
        Returns:
            List of slow query statistics
        """
        return [(query, stats) for query, stats in self.query_stats.items() 
                if stats['avg_time'] > threshold]
    
    def generate_optimization_report(self) -> Dict[str, Any]:
        """Generate optimization report.
        
        Returns:
            Dict containing optimization report
        """
        return {
            'total_queries': sum(stats['count'] for stats in self.query_stats.values()),
            'total_time': sum(stats['total_time'] for stats in self.query_stats.values()),
            'avg_query_time': sum(stats['total_time'] for stats in self.query_stats.values()) / 
                            sum(stats['count'] for stats in self.query_stats.values()),
            'slow_queries': self.get_slow_queries(),
            'query_stats': self.query_stats
        }

class DatabaseManager:
    """Database connection and optimization manager."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize database manager.
        
        Args:
            config: Database configuration
        """
        self.config = config
        self.profiler = QueryProfiler()
        self.cache_manager = CacheManager()
        
        # Initialize connection pool
        self.pool = psycopg2.pool.SimpleConnectionPool(
            minconn=config.get('min_connections', 1),
            maxconn=config.get('max_connections', 10),
            **config.get('database', {})
        )
    
    def get_connection(self):
        """Get a database connection from the pool."""
        return self.pool.getconn()
    
    def return_connection(self, conn):
        """Return a database connection to the pool."""
        self.pool.putconn(conn)
    
    def execute_query(self, query: str, params: Optional[tuple] = None, 
                     use_cache: bool = False, cache_ttl: int = 300) -> Any:
        """Execute a query with optional caching."""
        if use_cache:
            cache_key = f"query:{query}:{str(params)}"
            cached_result = self.cache_manager.get(cache_key)
            if cached_result is not None:
                return cached_result
        
        conn = self.get_connection()
        try:
            start_time = time.time()
            cursor = conn.cursor()
            cursor.execute(query, params)
            result = cursor.fetchall() if cursor.description else None
            execution_time = time.time() - start_time
            
            self.profiler.record_query(query, execution_time)
            
            if use_cache and result is not None:
                self.cache_manager.set(cache_key, result, cache_ttl)
            
            return result
        finally:
            self.return_connection(conn)
    
    def analyze_table(self, table_name: str) -> Dict[str, Any]:
        """Analyze a table and provide optimization recommendations.
        
        Args:
            table_name: Name of table to analyze
        
        Returns:
            Dict containing table statistics
        """
        stats_query = """
            SELECT 
                pg_stat_user_tables.seq_scan,
                pg_stat_user_tables.idx_scan,
                pg_stat_user_tables.n_live_tup,
                pg_stat_user_tables.n_dead_tup
            FROM pg_stat_user_tables
            WHERE relname = %s
        """
        
        stats = self.execute_query(stats_query, (table_name,))
        if not stats:
            return {}
        
        seq_scan, idx_scan, live_tuples, dead_tuples = stats[0]
        recommendations = []
        
        # Check for table bloat
        if dead_tuples > live_tuples * 0.2:
            recommendations.append(f"Consider running VACUUM on {table_name}")
        
        # Check index usage
        if seq_scan > idx_scan * 10:
            recommendations.append(f"Consider adding indexes to {table_name}")
        
        return {
            'table_name': table_name,
            'sequential_scans': seq_scan,
            'index_scans': idx_scan,
            'live_tuples': live_tuples,
            'dead_tuples': dead_tuples,
            'recommendations': recommendations
        }
    
    def get_index_recommendations(self, table_name: str) -> List[str]:
        """Generate index recommendations based on query patterns.
        
        Args:
            table_name: Name of table to analyze
        
        Returns:
            List of recommended indexes
        """
        query = """
            SELECT schemaname, tablename, attname, n_distinct, null_frac
            FROM pg_stats
            WHERE tablename = %s
        """
        
        columns = self.execute_query(query, (table_name,))
        recommendations = []
        
        for _, _, column, n_distinct, null_frac in columns:
            if n_distinct > 100 and null_frac < 0.5:
                recommendations.append(f"Consider creating an index on {column}")
        
        return recommendations
    
    def vacuum_analyze(self, table_name: str):
        """Perform VACUUM ANALYZE on a table.
        
        Args:
            table_name: Name of table to analyze
        """
        conn = self.get_connection()
        try:
            conn.set_isolation_level(0)  # AUTOCOMMIT
            cursor = conn.cursor()
            cursor.execute(f"VACUUM ANALYZE {table_name}")
        finally:
            self.return_connection(conn)
    
    def close(self):
        """Close the connection pool."""
        self.pool.closeall()

def with_profiling(func):
    """Decorator to profile database operations.
    
    Args:
        func: Function to decorate
    
    Returns:
        Decorated function
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        # Get the DatabaseManager instance
        self = args[0] if isinstance(args[0], DatabaseManager) else None
        if self and hasattr(self, 'profiler'):
            self.profiler.record_query(func.__name__, execution_time)
        
        return result
    return wrapper
