"""Tournament management service."""
from datetime import datetime
from typing import List, Dict, Any, Optional
import math
import random

from dojopool.models.tournament import (
    Tournament, TournamentParticipant, TournamentMatch,
    TournamentStatus, TournamentFormat, MatchStatus
)
from dojopool.core.database import db
from dojopool.services.match_stats_service import MatchStatsService

class TournamentService:
    """Service for managing tournaments and brackets."""
    
    def __init__(self):
        self.match_stats_service = MatchStatsService()
    
    @staticmethod
    def create_tournament(data: Dict[str, Any]) -> Tournament:
        """Create a new tournament."""
        tournament = Tournament(**data)
        db.session.add(tournament)
        db.session.commit()
        return tournament
    
    @staticmethod
    def update_tournament(tournament_id: int, data: Dict[str, Any]) -> Optional[Tournament]:
        """Update tournament details."""
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            return None
            
        for key, value in data.items():
            setattr(tournament, key, value)
        
        db.session.commit()
        return tournament
    
    @staticmethod
    def get_tournament(tournament_id: int) -> Optional[Tournament]:
        """Get tournament by ID."""
        return Tournament.query.get(tournament_id)
    
    @staticmethod
    def get_tournaments(
        limit: int = 10,
        offset: int = 0,
        filters: Dict[str, Any] = None
    ) -> List[Tournament]:
        """Get tournaments with optional filtering."""
        query = Tournament.query
        
        if filters:
            if 'venue_id' in filters:
                query = query.filter_by(venue_id=filters['venue_id'])
            if 'status' in filters:
                query = query.filter_by(status=filters['status'])
            if 'format' in filters:
                query = query.filter_by(format=filters['format'])
        
        return query.offset(offset).limit(limit).all()
    
    @staticmethod
    def register_participant(
        tournament_id: int,
        user_id: int
    ) -> TournamentParticipant:
        """Register a participant for a tournament."""
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")
            
        if tournament.status != TournamentStatus.REGISTRATION:
            raise ValueError("Tournament registration is not open")
            
        if tournament.registration_deadline and datetime.utcnow() > tournament.registration_deadline:
            raise ValueError("Registration deadline has passed")
            
        # Check if user is already registered
        existing = TournamentParticipant.query.filter_by(
            tournament_id=tournament_id,
            user_id=user_id
        ).first()
        
        if existing:
            raise ValueError("User is already registered for this tournament")
        
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=user_id,
            stats={
                'matches_played': 0,
                'matches_won': 0,
                'frames_played': 0,
                'frames_won': 0,
                'total_breaks': 0,
                'highest_break': 0,
                'average_break': 0,
                'total_fouls': 0
            }
        )
        
        db.session.add(participant)
        db.session.commit()
        return participant
    
    @staticmethod
    def update_match(
        match_id: int,
        data: Dict[str, Any]
    ) -> Optional[TournamentMatch]:
        """Update match details and progress tournament."""
        match = TournamentMatch.query.get(match_id)
        if not match:
            return None
            
        # Record score and stats
        if 'score' in data or 'stats' in data:
            match = MatchStatsService.record_score(match_id, data)
            if not match:
                return None
            
            # Check if tournament is completed
            tournament = match.tournament
            remaining_matches = TournamentMatch.query.filter_by(
                tournament_id=tournament.id,
                status=MatchStatus.PENDING
            ).count()
            
            if remaining_matches == 0:
                tournament.status = TournamentStatus.COMPLETED
                TournamentService._distribute_prizes(tournament)
        else:
            # Update other match details
            for key, value in data.items():
                if hasattr(match, key):
                    setattr(match, key, value)
            
            db.session.commit()
        
        return match
    
    @staticmethod
    def _distribute_prizes(tournament: Tournament) -> None:
        """Distribute prizes to tournament winners."""
        if not tournament.prize_pool:
            return
            
        # Get participants ordered by final rank
        participants = (TournamentParticipant.query
                       .filter_by(tournament_id=tournament.id)
                       .order_by(TournamentParticipant.final_rank)
                       .all())
        
        # Default prize distribution (can be customized)
        prize_distribution = {
            1: 0.5,  # 50% for 1st place
            2: 0.3,  # 30% for 2nd place
            3: 0.2   # 20% for 3rd place
        }
        
        for participant in participants:
            if participant.final_rank in prize_distribution:
                participant.prize_amount = (
                    tournament.prize_pool * prize_distribution[participant.final_rank]
                )
        
        db.session.commit()
    
    @staticmethod
    def get_tournament_stats(tournament_id: int) -> Dict[str, Any]:
        """Get tournament statistics."""
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")
            
        matches = tournament.matches
        participants = tournament.participants
        
        total_frames = sum(
            len(match.score.get('frames', []))
            for match in matches
            if match.score
        )
        
        total_breaks = sum(
            len(match.stats.get('breaks', []))
            for match in matches
            if match.stats
        )
        
        highest_break = max(
            [b['points'] for match in matches
             for b in match.stats.get('breaks', [])
             if match.stats],
            default=0
        )
        
        return {
            'total_matches': len(matches),
            'completed_matches': len([m for m in matches if m.status == MatchStatus.COMPLETED]),
            'total_participants': len(participants),
            'total_frames': total_frames,
            'total_breaks': total_breaks,
            'highest_break': highest_break,
            'total_prize_pool': tournament.prize_pool,
            'distributed_prizes': sum(p.prize_amount or 0 for p in participants)
        }
