from flask_caching import Cache
from flask_caching import Cache
"""
Database seeding script for development environment.
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add the src directory to the Python path
src_path = str(Path(__file__).parent.parent)
sys.path.insert(0, src_path)

from app import create_app, db
from core.models import Game, Tournament, User, Venue


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
        user.set_os.getenv("PASSWORD_51")  # Development password
        db.session.add(user)
        created_users.append(user)

    db.session.commit()
    return created_users


def seed_venues():
    """Seed venues table with sample data."""
    venues = [
        {
            "name": "The Cue Club",
            "location": "123 Main St, Downtown",
            "description": "Premier pool venue with 12 professional tables",
            "contact_info": json.dumps(
                {
                    "phone": "555-0123",
                    "email": "info@cueclub.com",
                    "website": "www.cueclub.com",
                }
            ),
            "operating_hours": json.dumps(
                {
                    "monday": "12:00-23:00",
                    "tuesday": "12:00-23:00",
                    "wednesday": "12:00-23:00",
                    "thursday": "12:00-23:00",
                    "friday": "12:00-02:00",
                    "saturday": "12:00-02:00",
                    "sunday": "14:00-22:00",
                }
            ),
            "total_tables": 12,
            "available_tables": 8,
        },
        {
            "name": "Break & Run",
            "location": "456 Oak Ave, Midtown",
            "description": "Casual and competitive pool in a friendly atmosphere",
            "contact_info": json.dumps(
                {
                    "phone": "555-0456",
                    "email": "info@breakandrun.com",
                    "website": "www.breakandrun.com",
                }
            ),
            "operating_hours": json.dumps(
                {
                    "monday": "15:00-23:00",
                    "tuesday": "15:00-23:00",
                    "wednesday": "15:00-23:00",
                    "thursday": "15:00-23:00",
                    "friday": "15:00-02:00",
                    "saturday": "12:00-02:00",
                    "sunday": "12:00-22:00",
                }
            ),
            "total_tables": 8,
            "available_tables": 6,
        },
        {
            "name": "Elite Billiards",
            "location": "789 Pine St, Uptown",
            "description": "High-end pool hall with tournament facilities",
            "contact_info": json.dumps(
                {
                    "phone": "555-0789",
                    "email": "info@elitebilliards.com",
                    "website": "www.elitebilliards.com",
                }
            ),
            "operating_hours": json.dumps(
                {
                    "monday": "14:00-23:00",
                    "tuesday": "14:00-23:00",
                    "wednesday": "14:00-23:00",
                    "thursday": "14:00-23:00",
                    "friday": "14:00-01:00",
                    "saturday": "12:00-01:00",
                    "sunday": "12:00-22:00",
                }
            ),
            "total_tables": 15,
            "available_tables": 10,
        },
    ]

    for venue_data in venues:
        venue = Venue(**venue_data)
        db.session.add(venue)

    db.session.commit()
    print("Venues seeded successfully!")


def seed_tournaments():
    """Seed tournaments table with sample data."""
    venues = Venue.query.all()
    if not venues:
        print("No venues found. Please seed venues first.")
        return

    tournaments = [
        {
            "name": "Spring Championship",
            "description": "Annual spring tournament with cash prizes",
            "venue_id": venues[0].id,
            "start_date": datetime.utcnow() + timedelta(days=7),
            "end_date": datetime.utcnow() + timedelta(days=9),
            "max_participants": 32,
            "entry_fee": 50.00,
            "prize_pool": 1000.00,
            "status": "open",
        },
        {
            "name": "Weekly 8-Ball",
            "description": "Weekly 8-ball tournament for all skill levels",
            "venue_id": venues[1].id,
            "start_date": datetime.utcnow() + timedelta(days=2),
            "end_date": datetime.utcnow() + timedelta(days=2),
            "max_participants": 16,
            "entry_fee": 20.00,
            "prize_pool": 300.00,
            "status": "open",
        },
    ]

    for tournament_data in tournaments:
        tournament = Tournament(**tournament_data)
        db.session.add(tournament)

    db.session.commit()
    print("Tournaments seeded successfully!")


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


def main():
    """Main seeding function."""
    app = create_app()
    with app.app_context():
        print("Starting database seeding...")

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
        seed_venues()

        print("Seeding tournaments...")
        seed_tournaments()

        print("Seeding games...")
        venues = Venue.query.all()
        tournaments = Tournament.query.all()
        games = seed_games(users, venues, tournaments)

        print("Database seeding completed successfully!")


if __name__ == "__main__":
    main()
