import time

from sqlalchemy import Index, event, text

from src.extensions import db


class IndexManager:
    """Manage database indexes for query optimization"""

    @staticmethod
    def create_index(table_name, column_names, index_name=None):
        """
        Create an index on specified columns
        :param table_name: Name of the table
        :param column_names: List of column names to index
        :param index_name: Optional custom index name
        """
        if not index_name:
            index_name = f"idx_{table_name}_{'_'.join(column_names)}"

        # Check if index already exists
        sql = text(
            """
            SELECT 1
            FROM pg_indexes
            WHERE indexname = :index_name
        """
        )
        result = db.session.execute(sql, {"index_name": index_name})

        if not result.fetchone():
            # Create the index if it doesn't exist
            columns = [text(col) for col in column_names]
            index = Index(index_name, *columns)
            index.create(db.engine)

    @staticmethod
    def analyze_slow_queries():
        """Analyze and log slow queries"""
        sql = text(
            """
            SELECT query, calls, total_time, mean_time
            FROM pg_stat_statements
            ORDER BY mean_time DESC
            LIMIT 10
        """
        )
        return db.session.execute(sql).fetchall()

    @staticmethod
    def optimize_table(table_name):
        """
        Perform VACUUM ANALYZE on a table
        :param table_name: Name of the table to optimize
        """
        sql = text(f"VACUUM ANALYZE {table_name}")
        db.session.execute(sql)
        db.session.commit()


# Event listeners for query optimization
@event.listens_for(db.engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log slow queries for analysis"""
    context._query_start_time = time.time()


@event.listens_for(db.engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log queries that take longer than 1 second"""
    total = time.time() - context._query_start_time
    if total > 1:
        # Log slow query for analysis
        print(f"Slow Query ({total:.2f}s): {statement}")


def optimize_query(query):
    """
    Add query optimization hints
    :param query: SQLAlchemy query object
    :return: Optimized query
    """
    return query.execution_options(postgresql_hint="SET enable_seqscan = off")


def create_common_indexes():
    """Create indexes for commonly queried columns"""
    IndexManager.create_index("users", ["email"])
    IndexManager.create_index("games", ["venue_id", "created_at"])
    IndexManager.create_index("game_players", ["game_id", "player_id"])
    IndexManager.create_index("venues", ["location"])
    IndexManager.create_index("tournaments", ["start_date", "status"])
