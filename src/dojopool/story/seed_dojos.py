"""Seed persistent dojo chat rooms on startup."""
from dojopool.models import db
from dojopool.models.chat import ChatRoom
from datetime import datetime

def seed_dojos():
    dojo_data = [
        {"name": "Beginner's Dojo", "is_dojo": True, "location_name": "Beginner's Dojo"},
        {"name": "Grandmaster's Hall", "is_dojo": True, "location_name": "Grandmaster's Hall"},
        {"name": "Tournament Arena", "is_dojo": True, "location_name": "Tournament Arena"},
    ]
    for dojo in dojo_data:
        existing = ChatRoom.query.filter_by(name=dojo["name"]).first()
        if not existing:
            room = ChatRoom(
                name=dojo["name"],
                is_dojo=True,
                location_name=dojo["location_name"],
                description=f"Welcome to the {dojo['location_name']}!",
                is_private=False,
                created_at=datetime.utcnow(),
            )
            db.session.add(room)
    db.session.commit()
