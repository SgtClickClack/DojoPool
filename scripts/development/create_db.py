"""Create database tables."""

import json
import os
from datetime import datetime, timedelta

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

from dojopool.models.tournament import Tournament

# Import models
from dojopool.models.venue import Venue


def create_tables():
    """Create all database tables."""
    with app.app_context():
        db.create_all()
        print(f"Created database tables at {db_path}")

        # Add sample data
        print("Adding sample data...")

        # Add venues
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
        ]

        for venue_data in venues:
            venue = Venue(**venue_data)
            db.session.add(venue)

        db.session.commit()
        print("Sample venues added!")

        # Add tournaments
        venues = Venue.query.all()
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
        print("Sample tournaments added!")


if __name__ == "__main__":
    create_tables()
