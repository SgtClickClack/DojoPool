# Utility File Documentation: src\dojopool\core\db_optimization.py

Generated at: 2025-01-14T18:34:06.440787

## Overview

- Functions: 1
- Classes: 2
- Imports: 15

## Imports

- `cache.CacheManager`
- `contextlib.contextmanager`
- `functools.wraps`
- `logging`
- `psycopg2`
- `psycopg2.extras.DictCursor`
- `psycopg2.pool.ThreadedConnectionPool`
- `threading`
- `time`
- `typing.Any`
- `typing.Dict`
- `typing.List`
- `typing.Optional`
- `typing.Tuple`
- `typing.Union`

## Functions

### `with_profiling`

Decorator to profile database operations.

Args:
    func: Function to decorate

Returns:
    Decorated function

**Details:**
- Parameters: func
- Complexity: 5
- Lines: 22

## Classes

### `QueryProfiler`

Query profiling and optimization manager.

**Methods:**

#### `__init__`

Initialize query profiler.

**Details:**
- Parameters: self
- Complexity: 1
- Lines: 3

#### `record_query`

Record query execution statistics.

Args:
    query: SQL query string
    execution_time: Query execution time in seconds

**Details:**
- Parameters: self, query, execution_time
- Complexity: 2
- Lines: 22

#### `get_slow_queries`

Get list of slow queries.

Args:
    threshold: Threshold in seconds for slow query logging

Returns:
    List of slow query statistics

**Details:**
- Parameters: self, threshold
- Complexity: 2
- Lines: 11

#### `generate_optimization_report`

Generate optimization report.

Returns:
    Dict containing optimization report

**Details:**
- Parameters: self
- Complexity: 2
- Lines: 14

### `DatabaseManager`

Database connection and optimization manager.

**Methods:**

#### `__init__`

Initialize database manager.

Args:
    config: Database configuration

**Details:**
- Parameters: self, config
- Complexity: 1
- Lines: 16

#### `get_connection`

Get a database connection from the pool.

**Details:**
- Parameters: self
- Complexity: 2
- Lines: 3

#### `return_connection`

Return a database connection to the pool.

**Details:**
- Parameters: self, conn
- Complexity: 1
- Lines: 3

#### `execute_query`

Execute a query with optional caching.

**Details:**
- Parameters: self, query, params, use_cache, cache_ttl
- Returns: Any
- Complexity: 8
- Lines: 25

#### `analyze_table`

Analyze a table and provide optimization recommendations.

Args:
    table_name: Name of table to analyze

Returns:
    Dict containing table statistics

**Details:**
- Parameters: self, table_name
- Complexity: 6
- Lines: 42

#### `get_index_recommendations`

Generate index recommendations based on query patterns.

Args:
    table_name: Name of table to analyze

Returns:
    List of recommended indexes

**Details:**
- Parameters: self, table_name
- Complexity: 5
- Lines: 23

#### `vacuum_analyze`

Perform VACUUM ANALYZE on a table.

Args:
    table_name: Name of table to analyze

**Details:**
- Parameters: self, table_name
- Complexity: 2
- Lines: 13

#### `close`

Close the connection pool.

**Details:**
- Parameters: self
- Complexity: 1
- Lines: 3

## Recommendations

- No immediate improvements needed