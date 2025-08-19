"""
Leaderboard Service Module

This module provides services for managing leaderboards and player rankings.
"""

from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import desc, func
from ..models import LeaderboardEntry, User, Region, Venue, Tournament
from ..extensions import db


class LeaderboardService:
    """Service for managing leaderboards."""

    @staticmethod
    def get_leaderboard(
        leaderboard_type: str,
        period: str = 'all_time',
        region_id: Optional[int] = None,
        venue_id: Optional[int] = None,
        tournament_id: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get leaderboard entries.
        
        Args:
            leaderboard_type: Type of leaderboard (global, regional, venue, tournament)
            period: Time period (all_time, monthly, weekly, daily)
            region_id: Region ID for regional leaderboard
            venue_id: Venue ID for venue leaderboard
            tournament_id: Tournament ID for tournament leaderboard
            limit: Maximum number of entries to return
            
        Returns:
            List of leaderboard entries
        """
        query = LeaderboardEntry.query.filter_by(
            leaderboard_type=leaderboard_type,
            period=period
        )

        if region_id:
            query = query.filter_by(region_id=region_id)
        if venue_id:
            query = query.filter_by(venue_id=venue_id)
        if tournament_id:
            query = query.filter_by(tournament_id=tournament_id)

        entries = query.order_by(desc(LeaderboardEntry.points)).limit(limit).all()
        return [entry.to_dict() for entry in entries]

    @staticmethod
    def update_leaderboard(
        user_id: int,
        won: bool,
        leaderboard_type: str,
        region_id: Optional[int] = None,
        venue_id: Optional[int] = None,
        tournament_id: Optional[int] = None
    ) -> Tuple[bool, Optional[str]]:
        """Update leaderboard entry after a game.
        
        Args:
            user_id: User ID
            won: Whether the user won the game
            leaderboard_type: Type of leaderboard
            region_id: Region ID for regional leaderboard
            venue_id: Venue ID for venue leaderboard
            tournament_id: Tournament ID for tournament leaderboard
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Get or create entry
            entry = LeaderboardEntry.query.filter_by(
                user_id=user_id,
                leaderboard_type=leaderboard_type,
                period='all_time',
                region_id=region_id,
                venue_id=venue_id,
                tournament_id=tournament_id
            ).first()

            if not entry:
                entry = LeaderboardEntry(
                    user_id=user_id,
                    leaderboard_type=leaderboard_type,
                    period='all_time',
                    region_id=region_id,
                    venue_id=venue_id,
                    tournament_id=tournament_id,
                    rank=0  # Will be updated after stats update
                )
                db.session.add(entry)

            # Update stats
            entry.update_stats(won)

            # Update ranks
            LeaderboardService._update_ranks(leaderboard_type, region_id, venue_id, tournament_id)

            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def _update_ranks(
        leaderboard_type: str,
        region_id: Optional[int] = None,
        venue_id: Optional[int] = None,
        tournament_id: Optional[int] = None
    ) -> None:
        """Update ranks for all entries in a leaderboard."""
        query = LeaderboardEntry.query.filter_by(
            leaderboard_type=leaderboard_type,
            period='all_time'
        )

        if region_id:
            query = query.filter_by(region_id=region_id)
        if venue_id:
            query = query.filter_by(venue_id=venue_id)
        if tournament_id:
            query = query.filter_by(tournament_id=tournament_id)

        # Get all entries ordered by points
        entries = query.order_by(desc(LeaderboardEntry.points)).all()

        # Update ranks
        for rank, entry in enumerate(entries, 1):
            entry.rank = rank

    @staticmethod
    def get_user_stats(
        user_id: int,
        leaderboard_type: str,
        region_id: Optional[int] = None,
        venue_id: Optional[int] = None,
        tournament_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get user's statistics across different periods.
        
        Args:
            user_id: User ID
            leaderboard_type: Type of leaderboard
            region_id: Region ID for regional leaderboard
            venue_id: Venue ID for venue leaderboard
            tournament_id: Tournament ID for tournament leaderboard
            
        Returns:
            Dictionary containing user's statistics
        """
        stats = {}
        periods = ['all_time', 'monthly', 'weekly', 'daily']

        for period in periods:
            entry = LeaderboardEntry.query.filter_by(
                user_id=user_id,
                leaderboard_type=leaderboard_type,
                period=period,
                region_id=region_id,
                venue_id=venue_id,
                tournament_id=tournament_id
            ).first()

            if entry:
                stats[period] = entry.to_dict()
            else:
                stats[period] = {
                    'rank': None,
                    'points': 0.0,
                    'wins': 0,
                    'losses': 0,
                    'games_played': 0,
                    'win_rate': 0.0
                }

        return stats

    @staticmethod
    def get_leaderboard_stats(
        leaderboard_type: str,
        region_id: Optional[int] = None,
        venue_id: Optional[int] = None,
        tournament_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get overall leaderboard statistics.
        
        Args:
            leaderboard_type: Type of leaderboard
            region_id: Region ID for regional leaderboard
            venue_id: Venue ID for venue leaderboard
            tournament_id: Tournament ID for tournament leaderboard
            
        Returns:
            Dictionary containing leaderboard statistics
        """
        query = LeaderboardEntry.query.filter_by(
            leaderboard_type=leaderboard_type,
            period='all_time'
        )

        if region_id:
            query = query.filter_by(region_id=region_id)
        if venue_id:
            query = query.filter_by(venue_id=venue_id)
        if tournament_id:
            query = query.filter_by(tournament_id=tournament_id)

        total_entries = query.count()
        total_games = db.session.query(func.sum(LeaderboardEntry.games_played)).scalar() or 0
        total_wins = db.session.query(func.sum(LeaderboardEntry.wins)).scalar() or 0
        total_losses = db.session.query(func.sum(LeaderboardEntry.losses)).scalar() or 0

        return {
            'total_entries': total_entries,
            'total_games': total_games,
            'total_wins': total_wins,
            'total_losses': total_losses,
            'average_win_rate': (total_wins / total_games) if total_games > 0 else 0.0
        } 