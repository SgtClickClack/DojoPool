from datetime import datetime
from typing import List, Dict, Any
from src.models.leaderboard import Leaderboard
from src.models import db

class LeaderboardService:
    """Service for managing leaderboards."""
    
    @staticmethod
    def get_leaderboard(category: str = 'overall', period: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get leaderboard entries."""
        query = Leaderboard.query.filter_by(type=category)
        if period:
            query = query.filter_by(period=period)
        
        entries = query.order_by(Leaderboard.score.desc()).limit(limit).all()
        return [entry.to_dict() for entry in entries]
    
    @staticmethod
    def update_rankings(category: str = 'overall', period: str = None) -> None:
        """Update rankings for a leaderboard category."""
        query = Leaderboard.query.filter_by(type=category)
        if period:
            query = query.filter_by(period=period)
        
        entries = query.order_by(Leaderboard.score.desc()).all()
        
        # Update ranks
        for i, entry in enumerate(entries, 1):
            entry.rank = i
        
        db.session.commit()
    
    @staticmethod
    def update_user_score(user_id: int, category: str, score_change: float, period: str = None) -> None:
        """Update a user's score in a leaderboard category."""
        entry = Leaderboard.query.filter_by(
            user_id=user_id,
            type=category,
            period=period
        ).first()
        
        if not entry:
            entry = Leaderboard(
                user_id=user_id,
                type=category,
                period=period,
                score=0
            )
            db.session.add(entry)
        
        entry.score += score_change
        db.session.commit()
        
        # Update rankings after score change
        LeaderboardService.update_rankings(category, period)
    
    @staticmethod
    def get_user_rankings(user_id: int) -> Dict[str, Any]:
        """Get all rankings for a user."""
        entries = Leaderboard.query.filter_by(user_id=user_id).all()
        return {
            entry.type: {
                'rank': entry.rank,
                'score': entry.score,
                'period': entry.period
            }
            for entry in entries
        }