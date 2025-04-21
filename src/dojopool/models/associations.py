"""Association tables for many-to-many relationships."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table

from .base import db

# Game-Player association table (REMOVED in favor of full model in core/models/game.py)
# game_players = Table(
#     "game_players",
#     db.metadata,
#     Column("game_id", Integer, ForeignKey("games.id"), primary_key=True),
#     Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
#     Column("created_at", DateTime, default=datetime.utcnow),
# )

# Tournament-Player association table (REMOVED in favor of full model in core/models/tournament.py)
# tournament_players = Table(
#     "tournament_players",
#     db.metadata,
#     Column("tournament_id", Integer, ForeignKey("tournaments.id"), primary_key=True),
#     Column("player_id", Integer, ForeignKey("players.id"), primary_key=True),
#     Column("registration_time", DateTime, default=db.func.now()),
#     Column("status", String(20), default="registered"),
# )

# Removed tournament_matches association table to resolve table redefinition conflict
# tournament_matches = Table(
#     "tournament_matches",
#     db.metadata,
#     Column("tournament_id", Integer, ForeignKey("tournaments.id"), primary_key=True),
#     Column("match_id", Integer, ForeignKey("matches.id"), primary_key=True),
#     Column("created_at", DateTime, default=datetime.utcnow),
# )

# Removed user_achievements association table to resolve table redefinition conflict
# user_achievements = Table(
#     "user_achievements",
#     db.metadata,
#     Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
#     Column("achievement_id", Integer, ForeignKey("achievements.id"), primary_key=True),
#     Column("created_at", DateTime, default=datetime.utcnow),
# )

# User-Role association table
user_roles = Table(
    "user_roles",
    db.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow),
    extend_existing=True,
)

# Venue-Feature association table
venue_features = Table(
    "venue_features",
    db.metadata,
    Column("venue_id", Integer, ForeignKey("venues.id"), primary_key=True),
    Column("feature_id", Integer, ForeignKey("features.id"), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)

# REMOVED: Duplicate chat_participants Table definition to resolve table mapping conflict
# chat_participants = Table(
#     "chat_participants",
#     db.metadata,
#     Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
#     Column("room_id", Integer, ForeignKey("chat_rooms.id"), primary_key=True)
# )

# REMOVED: Conflicting chat_participants Table definition to resolve model/table mapping conflict
# chat_participants = Table(
#     "chat_participants",
#     db.metadata,
#     Column("chat_id", Integer, ForeignKey("chats.id"), primary_key=True),
#     Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
#     Column("created_at", DateTime, default=datetime.utcnow),
#     Column("last_read_at", DateTime, nullable=True),
# )

# Match-Player association table
match_players = Table(
    "match_players",
    db.metadata,
    Column("match_id", Integer, ForeignKey("matches.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)
