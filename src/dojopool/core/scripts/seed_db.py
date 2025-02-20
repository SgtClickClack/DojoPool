"""
Database seeding script for development environment.
"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from dojopool.core.database import get_db_session

# Add the src directory to the Python path
src_path = str(Path(__file__).parent.parent.parent)
sys.path.insert(0, src_path)

from src.app import create_app
from src.core.extensions import db
from src.core.models import Game, Tournament, User, Venue


def seed_users():
    """Seed user data."""
    users = [
        {"username": "admin", "email": "admin@dojo.pool", "is_admin": True},
        {"username": "player1", "email": "player1@dojo.pool", "is_admin": False},
        {"username": "player2", "email": "player2@dojo.pool", "is_admin": False},
    ]

    created_users = []
    for user_data in users:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            is_admin=user_data["is_admin"],
        )
        user.set_password(
            os.getenv("PASSWORD_41", "default_dev_password")
        )  # Development password
        db.session.add(user)
        created_users.append(user)

    db.session.commit()
    return created_users


def seed_venues(owners):
    """Seed venue data."""
    venues = [
        {
            "name": "Dragon's Den Pool Hall",
            "address": "123 Main St, City",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "description": "A traditional pool hall with a modern twist",
            "opening_hours": {"mon-fri": "10:00-22:00", "sat-sun": "12:00-00:00"},
            "contact_info": {"phone": "555-0123", "email": "dragons@dojo.pool"},
        },
        {
            "name": "Tiger's Cue Club",
            "address": "456 Oak Ave, Town",
            "latitude": 37.7750,
            "longitude": -122.4180,
            "description": "Premium pool tables and training facilities",
            "opening_hours": {"mon-sun": "11:00-23:00"},
            "contact_info": {"phone": "555-0124", "email": "tigers@dojo.pool"},
        },
    ]

    created_venues = []
    for idx, venue_data in enumerate(venues):
        venue = Venue(owner_id=owners[idx % len(owners)].id, **venue_data)
        db.session.add(venue)
        created_venues.append(venue)

    db.session.commit()
    return created_venues


def seed_tournaments(venues):
    """Seed tournament data."""
    tournaments = [
        {
            "name": "Dragon's Cup 2024",
            "description": "Annual championship tournament",
            "start_date": datetime.now() + timedelta(days=30),
            "end_date": datetime.now() + timedelta(days=32),
            "max_participants": 32,
            "entry_fee": 50.0,
            "prize_pool": 1000.0,
            "tournament_type": "single elimination",
            "rules": {"format": "8-ball", "race_to": 5},
        },
        {
            "name": "Weekly Challenge",
            "description": "Weekly tournament for all skill levels",
            "start_date": datetime.now() + timedelta(days=7),
            "end_date": datetime.now() + timedelta(days=7),
            "max_participants": 16,
            "entry_fee": 20.0,
            "prize_pool": 250.0,
            "tournament_type": "round robin",
            "rules": {"format": "9-ball", "race_to": 3},
        },
    ]

    created_tournaments = []
    for idx, tournament_data in enumerate(tournaments):
        tournament = Tournament(
            venue_id=venues[idx % len(venues)].id, **tournament_data
        )
        db.session.add(tournament)
        created_tournaments.append(tournament)

    db.session.commit()
    return created_tournaments


def seed_games(players, venues, tournaments):
    """Seed game data."""
    games = [
        {
            "game_type": "8-ball",
            "score": 5,
            "status": "completed",
            "start_time": datetime.now() - timedelta(days=1),
            "end_time": datetime.now() - timedelta(days=1, hours=1),
        },
        {
            "game_type": "9-ball",
            "score": 3,
            "status": "completed",
            "start_time": datetime.now() - timedelta(days=2),
            "end_time": datetime.now() - timedelta(days=2, hours=2),
        },
        {
            "game_type": "8-ball",
            "score": 0,
            "status": "active",
            "start_time": datetime.now(),
            "end_time": None,
        },
    ]

    created_games = []
    for idx, game_data in enumerate(games):
        game = Game(
            player_id=players[idx % len(players)].id,
            venue_id=venues[idx % len(venues)].id,
            tournament_id=tournaments[idx % len(tournaments)].id if idx < 2 else None,
            **game_data,
        )
        db.session.add(game)
        created_games.append(game)

    db.session.commit()
    return created_games


def seed_database() -> None:
    session = get_db_session()
    # Add seeding logic here (e.g., create default objects)
    session.commit()


def main():
    """Main seeding function."""
    app = create_app()
    with app.app_context():
        print("Starting database seeding...")

        # Create tables if they don't exist
        print("Creating database tables...")
        db.create_all()

        # Clear existing data
        print("Clearing existing data...")
        Game.query.delete()
        Tournament.query.delete()
        Venue.query.delete()
        User.query.delete()
        db.session.commit()

        # Seed new data
        print("Seeding users...")
        users = seed_users()

        print("Seeding venues...")
        venues = seed_venues(users)

        print("Seeding tournaments...")
        tournaments = seed_tournaments(venues)

        print("Seeding games...")
        games = seed_games(users, venues, tournaments)

        print("Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
