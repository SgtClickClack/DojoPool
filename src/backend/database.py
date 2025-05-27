"""
Database Module

This module provides a unified database connection and query interface for SQLite.
"""

import sqlite3
import logging
from typing import Any, List, Tuple, Optional, Union, Sequence

# It's good practice to configure the logger if this module might be used standalone
# or if you want to ensure its logs are formatted and outputted.
# For a library, usually, you just get the logger and let the application configure it.
logger = logging.getLogger(__name__)


class DatabaseError(Exception):
    """Custom exception for database operations."""
    pass


class Database:
    """
    A class to manage SQLite database connections and operations.

    Recommended usage:
    ```python
    with Database("my_app.db") as db:
        db.execute_script("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT);")
        db.execute("INSERT INTO users (name) VALUES (?);", ("Alice",))
        users = db.fetchall("SELECT * FROM users;")
        for user in users:
            print(user)
    ```
    """

    def __init__(self, db_path: str) -> None:
        """
        Initializes the Database object.

        :param db_path: The path to the SQLite database file.
        """
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None
        self.cursor: Optional[sqlite3.Cursor] = None

    def connect(self) -> None:
        """
        Establishes a connection to the database.
        Raises DatabaseError if connection fails.
        """
        if self.conn:
            logger.debug("Connection already established.")
            return
        try:
            # Consider adding detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
            # for automatic type conversion.
            # You might also want to set a timeout: self.conn = sqlite3.connect(self.db_path, timeout=10)
            self.conn = sqlite3.connect(self.db_path)
            # For better performance and to handle concurrent writes better in some scenarios (though still single writer):
            # self.conn.execute("PRAGMA journal_mode=WAL;")
            # self.conn.execute("PRAGMA foreign_keys = ON;") # Good practice to enable foreign key constraints
            logger.info("Successfully connected to database at %s", self.db_path)
        except sqlite3.Error as e:
            logger.error("Failed to connect to database at %s: %s", self.db_path, e)
            self.conn = None # Ensure conn is None on failure
            raise DatabaseError(f"Database connection error: {e}") from e

    def close(self) -> None:
        """
        Closes the database connection if it is open.
        """
        if self.conn:
            try:
                # If there's an open transaction, it's good to decide whether to commit or rollback.
                # For a generic close, rollback is often safer to avoid partial transactions.
                # However, if using the context manager, commits should be explicit.
                # self.conn.rollback() # Or decide based on application logic
                self.conn.close()
                logger.info("Database connection to %s closed.", self.db_path)
            except sqlite3.Error as e:
                logger.error("Error closing database connection %s: %s", self.db_path, e)
                raise DatabaseError(f"Error closing database connection: {e}") from e
            finally:
                self.conn = None
                self.cursor = None # Clear cursor as well

    def __enter__(self) -> 'Database':
        """
        Context manager entry point: establishes the database connection.
        """
        self.connect()
        return self

    def __exit__(self, exc_type: Optional[type], exc_val: Optional[BaseException], exc_tb: Optional[Any]) -> None:
        """
        Context manager exit point: closes the database connection.
        If an exception occurred within the 'with' block, this method can handle it.
        For simplicity, we'll just close the connection. A more robust implementation
        might rollback transactions if an exception occurred.
        """
        if self.conn: # Ensure connection exists before trying to interact
            if exc_type: # An exception occurred within the 'with' block
                logger.warning("An exception occurred within database context, rolling back pending transaction.")
                try:
                    self.conn.rollback()
                except sqlite3.Error as e:
                    logger.error("Failed to rollback transaction on exception: %s", e)
            else: # No exception, commit any pending changes if auto-commit isn't per-query
                  # This commit here is if you design methods not to auto-commit.
                  # Given the current structure, individual execute methods might handle commits.
                  # If you want transaction control, this is a place to ensure commit on successful exit.
                  # For now, let's assume execute methods handle their own commits or user calls commit().
                  pass # self.commit() # if needed
        self.close()


    def _get_cursor(self) -> sqlite3.Cursor:
        """
        Ensures connection is active and returns a cursor.
        Raises DatabaseError if not connected.
        """
        if not self.conn:
            logger.error("No active database connection.")
            raise DatabaseError("No active database connection.")
        return self.conn.cursor()


    def fetchone(self, query_str: str, params: Sequence[Any] = ()) -> Optional[Tuple[Any, ...]]:
        """
        Executes a SELECT query and fetches a single row.

        :param query_str: SQL query to execute.
        :param params: Parameters for the SQL query.
        :return: A single row as a tuple, or None if no row is found or an error occurs.
        """
        try:
            cur = self._get_cursor()
            cur.execute(query_str, params)
            row = cur.fetchone()
            logger.debug("Executed fetchone query: %s with params: %s. Row found: %s", query_str, params, bool(row))
            return row
        except sqlite3.Error as e:
            logger.error("Fetchone query error for '%s' with params %s: %s", query_str, params, e)
            raise DatabaseError(f"Fetchone query error: {e}") from e # Re-raise as custom error

    def fetchall(self, query_str: str, params: Sequence[Any] = ()) -> List[Tuple[Any, ...]]:
        """
        Executes a SELECT query and fetches all rows.

        :param query_str: SQL query to execute.
        :param params: Parameters for the SQL query.
        :return: A list of rows (tuples), or an empty list if no rows are found or an error occurs.
        """
        try:
            cur = self._get_cursor()
            cur.execute(query_str, params)
            rows = cur.fetchall()
            logger.debug("Executed fetchall query: %s with params: %s. Rows fetched: %d", query_str, params, len(rows))
            return rows
        except sqlite3.Error as e:
            logger.error("Fetchall query error for '%s' with params %s: %s", query_str, params, e)
            raise DatabaseError(f"Fetchall query error: {e}") from e # Re-raise


    def execute(self, statement: str, params: Sequence[Any] = (), *, commit: bool = True) -> int:
        """
        Executes a DML (INSERT, UPDATE, DELETE) or DDL statement.

        :param statement: SQL statement to execute.
        :param params: Parameters for the SQL statement.
        :param commit: Whether to commit the transaction after execution. Default is True.
        :return: The number of rows affected (for DML statements like UPDATE, DELETE).
                 For INSERT, this depends on the DB, but often 1 if successful.
                 For DDL or other statements, it might be 0 or -1.
        :raises DatabaseError: If an error occurs during execution.
        """
        try:
            cur = self._get_cursor()
            cur.execute(statement, params)
            rowcount = cur.rowcount
            if commit and self.conn: # Ensure conn is not None
                self.conn.commit()
            logger.debug("Executed statement: %s with params: %s. Rows affected: %d. Committed: %s",
                         statement, params, rowcount, commit)
            return rowcount
        except sqlite3.Error as e:
            logger.error("Execute statement error for '%s' with params %s: %s", statement, params, e)
            if self.conn: # Attempt to rollback if an error occurs during a transaction
                try:
                    self.conn.rollback()
                    logger.info("Transaction rolled back due to error.")
                except sqlite3.Error as rb_err:
                    logger.error("Failed to rollback transaction: %s", rb_err)
            raise DatabaseError(f"Execute statement error: {e}") from e

    def execute_script(self, script_str: str, *, commit: bool = True) -> None:
        """
        Executes a string containing multiple SQL statements.

        :param script_str: SQL script to execute.
        :param commit: Whether to commit the transaction after execution. Default is True.
        :raises DatabaseError: If an error occurs during execution.
        """
        try:
            cur = self._get_cursor()
            cur.executescript(script_str)
            if commit and self.conn:
                self.conn.commit()
            logger.debug("Executed script. Committed: %s", commit)
        except sqlite3.Error as e:
            logger.error("Script execution error: %s", e)
            if self.conn:
                try:
                    self.conn.rollback()
                    logger.info("Transaction rolled back due to script error.")
                except sqlite3.Error as rb_err:
                    logger.error("Failed to rollback transaction: %s", rb_err)
            raise DatabaseError(f"Script execution error: {e}") from e

    def commit(self) -> None:
        """Commits the current transaction."""
        if not self.conn:
            logger.warning("No active connection to commit.")
            raise DatabaseError("Cannot commit: No active database connection.")
        try:
            self.conn.commit()
            logger.info("Transaction committed.")
        except sqlite3.Error as e:
            logger.error("Failed to commit transaction: %s", e)
            raise DatabaseError(f"Commit error: {e}") from e

    def rollback(self) -> None:
        """Rolls back the current transaction."""
        if not self.conn:
            logger.warning("No active connection to rollback.")
            raise DatabaseError("Cannot rollback: No active database connection.")
        try:
            self.conn.rollback()
            logger.info("Transaction rolled back.")
        except sqlite3.Error as e:
            logger.error("Failed to rollback transaction: %s", e)
            raise DatabaseError(f"Rollback error: {e}") from e

    @property
    def last_row_id(self) -> Optional[int]:
        """
        Returns the rowid of the last inserted row from the current connection.
        Note: This is specific to the last INSERT operation on the *cursor* that
        performed the insert. If using a shared cursor or multiple cursors, care is needed.
        Best used immediately after an insert via `execute` on a cursor obtained from `_get_cursor`.
        """
        cursor = self.cursor
        if cursor is not None:
            return cursor.lastrowid
        # If not reusing self.cursor, this property is less reliable unless tied to the last cursor used internally.
        # For simplicity, if you always create fresh cursors in methods, this property might be misleading.
        # A better approach might be for `execute` to return it if it's an INSERT.
        logger.warning("last_row_id is most reliable if the cursor is managed consistently.")
        # To make it slightly more robust (but still dependent on last operation on *some* cursor of conn):
        if self.conn:
            try:
                # This is a bit of a hack; ideally, the cursor that did the insert would be used.
                temp_cur = self.conn.cursor()
                return temp_cur.lastrowid
            except Exception: # pylint: disable=broad-except
                return None # Or handle more gracefully
        return None