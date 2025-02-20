"""
Database Module

This module provides a unified database connection and query interface.
"""

import logging
import sqlite3
from typing import Any, Optional, Tuple

logger = logging.getLogger(__name__)


class Database:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None

    def connect(self):
        """
        Establishes a connection to the database.
        """
        try:
            self.conn = sqlite3.connect(self.db_path)
            logger.info("Connected to database at %s", self.db_path)
        except sqlite3.Error as e:
            logger.error("Connection error: %s", e)

    def query(self, query_str: str, params: Tuple = ()):
        """
        Executes a database query.

        :param query_str: SQL query to execute.
        :param params: Parameters for the SQL query.
        :return: Query results if successful, None otherwise.
        """
        if not self.conn:
            self.connect()
        try:
            cur = self.conn.cursor()
            cur.execute(query_str, params)
            result = cur.fetchall()
            self.conn.commit()
            return result
        except sqlite3.Error as e:
            logger.error("Query error: %s", e)
            return None

    def close(self) -> None:
        """
        Closes the database connection.
        """
        if self.conn:
            self.conn.close()
            logger.info("Connection closed.")
