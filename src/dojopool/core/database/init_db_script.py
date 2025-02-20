"""Database initialization script with secure file permissions."""

import os
import sqlite3
from pathlib import Path
from typing import Optional

from dojopool.utils.file_permissions import (
    SECURE_DIR_MODE,
    SECURE_FILE_MODE,
    create_secure_directory,
    create_secure_file,
)


def init_db(instance_dir: Optional[str] = None, db_name: str = "dojopool.db") -> None:
    """Initialize the SQLite database with secure permissions.

    Args:
        instance_dir: Optional instance directory path (default: current directory)
        db_name: Database filename (default: dojopool.db)
    """
    # Set up instance directory
    if instance_dir is None:
        instance_dir = os.getcwd()
    instance_path = Path(instance_dir)

    # Create instance directory with secure permissions
    create_secure_directory(instance_path, mode=SECURE_DIR_MODE)

    # Create database file with secure permissions
    db_path = instance_path / db_name
    create_secure_file(db_path, mode=SECURE_FILE_MODE)

    # Initialize database schema
    with sqlite3.connect(db_path) as conn:
        # Enable foreign key support
        conn.execute("PRAGMA foreign_keys = ON")

        # Create tables
        conn.executescript(
            """
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Sessions table
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_id TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            -- Game records table
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player1_id INTEGER NOT NULL,
                player2_id INTEGER NOT NULL,
                winner_id INTEGER,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                game_type TEXT NOT NULL,
                venue_id INTEGER NOT NULL,
                FOREIGN KEY (player1_id) REFERENCES users (id),
                FOREIGN KEY (player2_id) REFERENCES users (id),
                FOREIGN KEY (winner_id) REFERENCES users (id),
                FOREIGN KEY (venue_id) REFERENCES venues (id)
            );
            
            -- Venues table
            CREATE TABLE IF NOT EXISTS venues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Player stats table
            CREATE TABLE IF NOT EXISTS player_stats (
                user_id INTEGER PRIMARY KEY,
                games_played INTEGER DEFAULT 0,
                games_won INTEGER DEFAULT 0,
                rating INTEGER DEFAULT 1500,
                last_game_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            -- Achievements table
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                points INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Player achievements table
            CREATE TABLE IF NOT EXISTS player_achievements (
                user_id INTEGER NOT NULL,
                achievement_id INTEGER NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, achievement_id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (achievement_id) REFERENCES achievements (id)
            );
        """
        )

        # Create indexes
        conn.executescript(
            """
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
            CREATE INDEX IF NOT EXISTS idx_games_players ON games(player1_id, player2_id);
            CREATE INDEX IF NOT EXISTS idx_games_venue ON games(venue_id);
            CREATE INDEX IF NOT EXISTS idx_player_stats_rating ON player_stats(rating DESC);
        """
        )


if __name__ == "__main__":
    init_db()
