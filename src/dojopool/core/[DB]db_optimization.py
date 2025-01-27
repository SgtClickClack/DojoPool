"""Database optimization and monitoring module."""

import time
from contextlib import contextmanager
from functools import wraps
from typing import Any, Dict, List, Optional, Tuple, Union

import psycopg2
from psycopg2.extras import DictCursor
from psycopg2.pool import ThreadedConnectionPool

from .cache import CacheService
from .logging.database import db_logger

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
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            # Log query execution
            if hasattr(args[0], 'last_query'):
                db_logger.log_query(
                    query=args[0].last_query,
                    duration=duration,
                    rows_affected=getattr(args[0], 'last_rowcount', None)
                )
                
                # Log slow queries
                if duration > 1.0:  # 1 second threshold
                    db_logger.log_slow_query(
                        query=args[0].last_query,
                        duration=duration,
                        threshold=1.0
                    )
            
            return result
        except Exception as e:
            db_logger.error(
                'Database operation failed',
                error=e,
                function=func.__name__,
                args=args[1:],
                kwargs=kwargs
            )
            raise
    return wrapper

class QueryProfiler:
    """Query profiling and optimization manager."""

    def __init__(self):
        """Initialize query profiler."""
        self.query_stats = {}

    def record_query(self, query: str, execution_time: float) -> None:
        """Record query execution statistics.
        
        Args:
            query: SQL query string
            execution_time: Query execution time in seconds
        """
        if query not in self.query_stats:
            self.query_stats[query] = {
                'count': 0,
                'total_time': 0,
                'min_time': float('inf'),
                'max_time': 0
            }
        
        stats = self.query_stats[query]
        stats['count'] += 1
        stats['total_time'] += execution_time
        stats['min_time'] = min(stats['min_time'], execution_time)
        stats['max_time'] = max(stats['max_time'], execution_time)

        # Log query statistics
        db_logger.info(
            'Query statistics updated',
            query=query,
            execution_time=execution_time,
            stats=stats
        )

    def get_slow_queries(self, threshold: float = 1.0) -> List[Dict[str, Any]]:
        """Get list of slow queries.
        
        Args:
            threshold: Threshold in seconds for slow query logging
            
        Returns:
            List of slow query statistics
        """
        slow_queries = []
        for query, stats in self.query_stats.items():
            avg_time = stats['total_time'] / stats['count']
            if avg_time > threshold:
                slow_queries.append({
                    'query': query,
                    'avg_time': avg_time,
                    **stats
                })
        return slow_queries

    def generate_optimization_report(self) -> Dict[str, Any]:
        """Generate optimization report.
        
        Returns:
            Dict containing optimization report
        """
        report = {
            'total_queries': len(self.query_stats),
            'slow_queries': self.get_slow_queries(),
            'query_stats': self.query_stats
        }
        
        db_logger.info('Generated optimization report', report=report)
        return report

class DatabaseManager:
    """Database connection and optimization manager."""

    def __init__(self, config: Dict[str, Any]):
        """Initialize database manager.
        
        Args:
            config: Database configuration
        """
        self.config = config
        self.profiler = QueryProfiler()
        self.cache = CacheService()
        self.last_query = None
        self.last_rowcount = None
        
        # Initialize connection pool
        self.pool = ThreadedConnectionPool(
            minconn=config.get('min_connections', 1),
            maxconn=config.get('max_connections', 10),
            **config['connection']
        )
        
        db_logger.info(
            'Database manager initialized',
            config={k: v for k, v in config.items() if k != 'connection'}
        )

    def get_connection(self):
        """Get a database connection from the pool."""
        try:
            return self.pool.getconn()
        except Exception as e:
            db_logger.log_connection_error(error=e)
            raise

    def return_connection(self, conn):
        """Return a database connection to the pool."""
        self.pool.putconn(conn)

    @with_profiling
    def execute_query(
        self,
        query: str,
        params: Optional[Tuple] = None,
        use_cache: bool = False,
        cache_ttl: int = 300
    ) -> Any:
        """Execute a query with optional caching.
        
        Args:
            query: SQL query string
            params: Query parameters
            use_cache: Whether to use caching
            cache_ttl: Cache TTL in seconds
            
        Returns:
            Query results
        """
        self.last_query = query
        
        if use_cache:
            cache_key = f"{query}:{str(params)}"
            cached_result = self.cache.get(cache_key)
            if cached_result is not None:
                db_logger.info('Query result served from cache', query=query)
                return cached_result

        conn = self.get_connection()
        try:
            with conn.cursor(cursor_factory=DictCursor) as cur:
                cur.execute(query, params)
                self.last_rowcount = cur.rowcount
                result = cur.fetchall() if cur.description else None
                
                if use_cache and result is not None:
                    self.cache.set(cache_key, result, cache_ttl)
                
                return result
        finally:
            self.return_connection(conn)

    @with_profiling
    def analyze_table(self, table_name: str) -> Dict[str, Any]:
        """Analyze a table and provide optimization recommendations.
        
        Args:
            table_name: Name of table to analyze
            
        Returns:
            Dict containing table statistics
        """
        stats_query = """
            SELECT
                schemaname,
                relname,
                seq_scan,
                seq_tup_read,
                idx_scan,
                idx_tup_fetch,
                n_live_tup,
                n_dead_tup,
                last_vacuum,
                last_analyze
            FROM pg_stat_user_tables
            WHERE relname = %s
        """
        
        index_query = """
            SELECT
                indexrelname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            WHERE relname = %s
        """
        
        stats = self.execute_query(stats_query, (table_name,))
        indexes = self.execute_query(index_query, (table_name,))
        
        recommendations = []
        if stats:
            stat = stats[0]
            if stat['n_dead_tup'] > stat['n_live_tup'] * 0.1:
                recommendations.append('Consider running VACUUM')
            if stat['seq_scan'] > stat['idx_scan'] * 10:
                recommendations.append('Consider adding indexes')
        
        result = {
            'table_name': table_name,
            'statistics': stats[0] if stats else None,
            'indexes': indexes,
            'recommendations': recommendations
        }
        
        db_logger.info('Table analysis completed', analysis=result)
        return result

    @with_profiling
    def get_index_recommendations(self, table_name: str) -> List[str]:
        """Generate index recommendations based on query patterns.
        
        Args:
            table_name: Name of table to analyze
            
        Returns:
            List of recommended indexes
        """
        query = """
            SELECT
                schemaname,
                tablename,
                attname,
                null_frac,
                n_distinct,
                correlation
            FROM pg_stats
            WHERE tablename = %s
        """
        
        stats = self.execute_query(query, (table_name,))
        recommendations = []
        
        for stat in stats:
            if stat['correlation'] < 0.5 and stat['null_frac'] < 0.5:
                recommendations.append(
                    f"Consider index on {stat['attname']} "
                    f"(correlation: {stat['correlation']:.2f})"
                )
        
        db_logger.info(
            'Generated index recommendations',
            table=table_name,
            recommendations=recommendations
        )
        return recommendations

    @with_profiling
    def vacuum_analyze(self, table_name: str) -> None:
        """Perform VACUUM ANALYZE on a table.
        
        Args:
            table_name: Name of table to analyze
        """
        conn = self.get_connection()
        try:
            conn.set_isolation_level(0)
            with conn.cursor() as cur:
                cur.execute(f"VACUUM ANALYZE {table_name}")
                db_logger.info('VACUUM ANALYZE completed', table=table_name)
        finally:
            self.return_connection(conn)

    def close(self) -> None:
        """Close the connection pool."""
        if self.pool:
            self.pool.closeall()
            db_logger.info('Database connection pool closed')
