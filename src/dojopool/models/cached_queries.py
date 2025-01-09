"""Cached database queries for improved performance."""

from functools import wraps
from . import db
from .user import User
from .game import Game
from .match import Match
from .tournament import Tournament
from ..core.cache import cached_query, cached_user_data, cached_game_state, invalidate_user_cache, invalidate_game_cache

@cached_query(timeout=300)
def get_active_tournaments():
    """Get all active tournaments."""
    return Tournament.query.filter_by(status='active').all()

@cached_query(timeout=300)
def get_recent_games(limit=10):
    """Get recently played games."""
    return Game.query.filter_by(status='completed').order_by(Game.completed_at.desc()).limit(limit).all()

@cached_user_data(timeout=300)
def get_user_stats(user_id):
    """Get user's game statistics."""
    games_played = Game.query.filter_by(player_id=user_id).count()
    games_won = Game.query.filter_by(winner_id=user_id).count()
    win_rate = (games_won / games_played * 100) if games_played > 0 else 0
    
    return {
        'games_played': games_played,
        'games_won': games_won,
        'win_rate': round(win_rate, 2)
    }

@cached_user_data(timeout=300)
def get_user_recent_matches(user_id, limit=5):
    """Get user's recent matches."""
    return Match.query.filter_by(player_id=user_id).order_by(Match.created_at.desc()).limit(limit).all()

@cached_game_state(timeout=60)
def get_game_state(game_id):
    """Get current game state."""
    game = Game.query.get(game_id)
    if not game:
        return None
    return {
        'status': game.status,
        'score': game.score,
        'opponent_score': game.opponent_score,
        'stats': game.stats
    }

def update_game_state(game_id, **kwargs):
    """Update game state and invalidate cache."""
    game = Game.query.get(game_id)
    if not game:
        return False
        
    for key, value in kwargs.items():
        if hasattr(game, key):
            setattr(game, key, value)
    
    db.session.commit()
    invalidate_game_cache(game_id)
    return True

def update_user_stats(user_id):
    """Update user statistics and invalidate cache."""
    invalidate_user_cache(user_id)
    return get_user_stats(user_id)  # This will refresh the cache 