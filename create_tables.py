"""Create database tables."""

import json
import os
import traceback
from datetime import datetime, timedelta, timezone

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Use absolute path for database
db_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "data", "dojopool.db")
)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Import models
from dojopool.models.role import Role
from dojopool.models.user import User
from dojopool.models.venue import Venue
from dojopool.models.table import Table
from dojopool.models.game import Game, GameSession, Shot
from dojopool.models.tournament import Tournament, TournamentPrize
from dojopool.models.tournament_match import TournamentMatch
from dojopool.models.tournament_participant import TournamentParticipant
from dojopool.models.tournament_round import TournamentRound
from dojopool.models.venue_checkin import VenueCheckIn
from dojopool.models.venue_leaderboard import VenueLeaderboard
from dojopool.models.notification import Notification
from dojopool.models.notification_preference import NotificationPreference
from dojopool.models.achievements import (
    Achievement,
    AchievementCategory,
    UserAchievement,
)
from dojopool.models.analytics import UserMetrics
from dojopool.models.device import Device
from dojopool.models.event_participant import EventParticipant
from dojopool.models.friendship import Friendship
from dojopool.models.notification_settings import NotificationSettings
from dojopool.models.review import Review, ReviewVote
from dojopool.models.reward import UserReward
from dojopool.models.social import UserFollower, UserMessage, UserProfile


def create_tables():
    """Create all database tables."""
    try:
        with app.app_context():
            # Create database directory if it doesn't exist
            os.makedirs(os.path.dirname(db_path), exist_ok=True)

            # Create all tables
            db.create_all()
            print(f"Created database tables at {db_path}")

            # Add sample data
            print("Adding sample data...")

            # Add roles
            roles = [
                {
                    "name": "admin",
                    "description": "Administrator with full access",
                    "can_create_tournaments": True,
                    "can_edit_tournaments": True,
                    "can_delete_tournaments": True,
                    "can_manage_users": True,
                    "can_manage_roles": True,
                    "can_manage_venues": True,
                    "can_manage_games": True,
                    "can_manage_matches": True,
                },
                {
                    "name": "venue_manager",
                    "description": "Manager of venues",
                    "can_create_tournaments": True,
                    "can_edit_tournaments": True,
                    "can_delete_tournaments": False,
                    "can_manage_users": False,
                    "can_manage_roles": False,
                    "can_manage_venues": True,
                    "can_manage_games": True,
                    "can_manage_matches": True,
                },
                {
                    "name": "player",
                    "description": "Regular player",
                    "can_create_tournaments": False,
                    "can_edit_tournaments": False,
                    "can_delete_tournaments": False,
                    "can_manage_users": False,
                    "can_manage_roles": False,
                    "can_manage_venues": False,
                    "can_manage_games": False,
                    "can_manage_matches": False,
                },
            ]

            for role_data in roles:
                role = Role(**role_data)
                db.session.add(role)

            db.session.commit()
            print("Sample roles added!")

            # Add venues
            venues = [
                {
                    "name": "The Cue Club",
                    "location": "123 Main St, Downtown",
                    "description": "Premier pool venue with 12 professional tables",
                    "contact_info": {
                        "phone": "555-0123",
                        "email": "info@cueclub.com",
                        "website": "www.cueclub.com",
                    },
                    "operating_hours": {
                        "monday": "12:00-23:00",
                        "tuesday": "12:00-23:00",
                        "wednesday": "12:00-23:00",
                        "thursday": "12:00-23:00",
                        "friday": "12:00-02:00",
                        "saturday": "12:00-02:00",
                        "sunday": "14:00-22:00",
                    },
                    "total_tables": 12,
                    "available_tables": 8,
                },
                {
                    "name": "Break & Run",
                    "location": "456 Oak Ave, Midtown",
                    "description": "Casual and competitive pool in a friendly atmosphere",
                    "contact_info": {
                        "phone": "555-0456",
                        "email": "info@breakandrun.com",
                        "website": "www.breakandrun.com",
                    },
                    "operating_hours": {
                        "monday": "15:00-23:00",
                        "tuesday": "15:00-23:00",
                        "wednesday": "15:00-23:00",
                        "thursday": "15:00-23:00",
                        "friday": "15:00-02:00",
                        "saturday": "12:00-02:00",
                        "sunday": "12:00-22:00",
                    },
                    "total_tables": 8,
                    "available_tables": 6,
                },
            ]

            for venue_data in venues:
                venue = Venue(**venue_data)
                db.session.add(venue)

            db.session.commit()
            print("Sample venues added!")

            # Add users
            users = [
                {
                    "username": "admin",
                    "email": "admin@dojopool.com",
                    "password": "admin123",  # In production, use proper password hashing
                    "is_admin": True,
                    "is_verified": True,
                },
                {
                    "username": "player1",
                    "email": "player1@example.com",
                    "password": "player123",
                    "is_verified": True,
                },
            ]

            for user_data in users:
                user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    password=user_data["password"],
                )
                user.is_admin = user_data.get("is_admin", False)
                user.is_verified = user_data.get("is_verified", False)
                db.session.add(user)

            db.session.commit()
            print("Sample users added!")

            # Add tournaments
            venues = Venue.query.all()
            tournaments = [
                {
                    "name": "Spring Championship",
                    "description": "Annual spring tournament with cash prizes",
                    "venue_id": venues[0].id,
                    "start_date": datetime.now(timezone.utc) + timedelta(days=7),
                    "end_date": datetime.now(timezone.utc) + timedelta(days=9),
                    "max_participants": 32,
                    "entry_fee": 50.00,
                    "prize_pool": 1000.00,
                    "status": "open",
                },
                {
                    "name": "Weekly 8-Ball",
                    "description": "Weekly 8-ball tournament for all skill levels",
                    "venue_id": venues[1].id,
                    "start_date": datetime.now(timezone.utc) + timedelta(days=2),
                    "end_date": datetime.now(timezone.utc) + timedelta(days=2),
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
            print("Sample tournaments added!")

    except Exception as e:
        print(f"Error: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        raise


if __name__ == "__main__":
    create_tables()
