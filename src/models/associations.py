"""Association tables for models."""
from src.core.database import db

# Association table for user roles
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_user_roles_user_id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id', use_alter=True, name='fk_user_roles_role_id'), primary_key=True),
    extend_existing=True
)

# Association table for tournament players
tournament_players = db.Table('tournament_players',
    db.Column('tournament_id', db.Integer, db.ForeignKey('tournaments.id', use_alter=True, name='fk_tournament_players_tournament_id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_tournament_players_user_id'), primary_key=True),
    extend_existing=True
)

# Association table for game players
game_players = db.Table('game_players',
    db.Column('game_id', db.Integer, db.ForeignKey('games.id', use_alter=True, name='fk_game_players_game_id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', use_alter=True, name='fk_game_players_user_id'), primary_key=True),
    extend_existing=True
) 