import json
from datetime import timedelta
from typing import Any, Dict, List, Optional

from django.conf import settings
from django.core.cache import cache

from ..models.tournaments import Tournament, TournamentMatch, TournamentParticipant


class TournamentCache:
    """Cache layer for tournament-related data using Redis"""

    # Cache keys
    TOURNAMENT_KEY = "tournament:{}"
    MATCHES_KEY = "tournament:{}:matches"
    PARTICIPANTS_KEY = "tournament:{}:participants"
    SPECTATORS_KEY = "tournament:{}:match:{}:spectators"
    ACTIVE_TOURNAMENTS_KEY = "tournaments:active"

    # Cache timeouts (in seconds)
    TOURNAMENT_TIMEOUT = 3600  # 1 hour
    MATCHES_TIMEOUT = 1800  # 30 minutes
    PARTICIPANTS_TIMEOUT = 1800
    SPECTATORS_TIMEOUT = 300  # 5 minutes
    ACTIVE_TIMEOUT = 600  # 10 minutes

    @classmethod
    def get_tournament(cls, tournament_id: str) -> Optional[Dict[str, Any]]:
        """Get tournament data from cache"""
        key = cls.TOURNAMENT_KEY.format(tournament_id)
        data = cache.get(key)
        return json.loads(data) if data else None

    @classmethod
    def set_tournament(cls, tournament: Tournament):
        """Cache tournament data"""
        key = cls.TOURNAMENT_KEY.format(tournament.id)
        data = {
            "id": tournament.id,
            "name": tournament.name,
            "status": tournament.status,
            "tournament_type": tournament.tournament_type,
            "current_round": tournament.current_round,
            "total_rounds": tournament.total_rounds,
            "participant_count": tournament.participant_count,
            "spectator_count": tournament.spectator_count,
            "prize_pool": tournament.prize_pool,
            "start_date": tournament.start_date.isoformat(),
            "end_date": (
                tournament.end_date.isoformat() if tournament.end_date else None
            ),
        }
        cache.set(key, json.dumps(data), cls.TOURNAMENT_TIMEOUT)

        # Update active tournaments list if tournament is in progress
        if tournament.status == "in_progress":
            cls.add_active_tournament(tournament.id)

    @classmethod
    def get_matches(cls, tournament_id: str):
        """Get tournament matches from cache"""
        key = cls.MATCHES_KEY.format(tournament_id)
        data = cache.get(key)
        return json.loads(data) if data else None

    @classmethod
    def set_matches(cls, tournament_id: str, matches: List[TournamentMatch]):
        """Cache tournament matches"""
        key = cls.MATCHES_KEY.format(tournament_id)
        data = [
            {
                "id": match.id,
                "round_number": match.round_number,
                "match_number": match.match_number,
                "status": match.status,
                "participant1_id": (
                    match.participant1.id if match.participant1 else None
                ),
                "participant2_id": (
                    match.participant2.id if match.participant2 else None
                ),
                "winner_id": match.winner.id if match.winner else None,
                "score": match.score,
                "current_spectators": match.current_spectators,
            }
            for match in matches
        ]
        cache.set(key, json.dumps(data), cls.MATCHES_TIMEOUT)

    @classmethod
    def get_participants(cls, tournament_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get tournament participants from cache"""
        key = cls.PARTICIPANTS_KEY.format(tournament_id)
        data = cache.get(key)
        return json.loads(data) if data else None

    @classmethod
    def set_participants(
        cls, tournament_id: str, participants: List[TournamentParticipant]
    ):
        """Cache tournament participants"""
        key = cls.PARTICIPANTS_KEY.format(tournament_id)
        data = [
            {
                "id": participant.id,
                "player_id": participant.player.id if participant.player else None,
                "team_id": participant.team.id if participant.team else None,
                "seed": participant.seed,
                "matches_played": participant.matches_played,
                "matches_won": participant.matches_won,
                "is_eliminated": participant.is_eliminated,
                "final_rank": participant.final_rank,
            }
            for participant in participants
        ]
        cache.set(key, json.dumps(data), cls.PARTICIPANTS_TIMEOUT)

    @classmethod
    def get_match_spectators(cls, tournament_id: str, match_id: str):
        """Get match spectator count from cache"""
        key = cls.SPECTATORS_KEY.format(tournament_id, match_id)
        return cache.get(key)

    @classmethod
    def set_match_spectators(cls, tournament_id: str, match_id: str, count: int):
        """Cache match spectator count"""
        key = cls.SPECTATORS_KEY.format(tournament_id, match_id)
        cache.set(key, count, cls.SPECTATORS_TIMEOUT)

    @classmethod
    def increment_spectators(cls, tournament_id: str, match_id: str) -> int:
        """Increment match spectator count"""
        key = cls.SPECTATORS_KEY.format(tournament_id, match_id)
        return cache.incr(key, 1)

    @classmethod
    def decrement_spectators(cls, tournament_id: str, match_id: str):
        """Decrement match spectator count"""
        key = cls.SPECTATORS_KEY.format(tournament_id, match_id)
        return cache.decr(key, 1)

    @classmethod
    def get_active_tournaments(cls):
        """Get list of active tournament IDs"""
        data = cache.get(cls.ACTIVE_TOURNAMENTS_KEY)
        return json.loads(data) if data else []

    @classmethod
    def add_active_tournament(cls, tournament_id: str):
        """Add tournament to active tournaments list"""
        active = cls.get_active_tournaments()
        if tournament_id not in active:
            active.append(tournament_id)
            cache.set(
                cls.ACTIVE_TOURNAMENTS_KEY, json.dumps(active), cls.ACTIVE_TIMEOUT
            )

    @classmethod
    def remove_active_tournament(cls, tournament_id: str) -> None:
        """Remove tournament from active tournaments list"""
        active = cls.get_active_tournaments()
        if tournament_id in active:
            active.remove(tournament_id)
            cache.set(
                cls.ACTIVE_TOURNAMENTS_KEY, json.dumps(active), cls.ACTIVE_TIMEOUT
            )

    @classmethod
    def invalidate_tournament(cls, tournament_id: str):
        """Invalidate all cache entries for a tournament"""
        keys = [
            cls.TOURNAMENT_KEY.format(tournament_id),
            cls.MATCHES_KEY.format(tournament_id),
            cls.PARTICIPANTS_KEY.format(tournament_id),
        ]
        cache.delete_many(keys)
        cls.remove_active_tournament(tournament_id)

    @classmethod
    def update_match(cls, tournament_id: str, match: TournamentMatch):
        """Update a single match in the cache"""
        matches = cls.get_matches(tournament_id)
        if matches:
            for i, m in enumerate(matches):
                if m["id"] == match.id:
                    matches[i] = {
                        "id": match.id,
                        "round_number": match.round_number,
                        "match_number": match.match_number,
                        "status": match.status,
                        "participant1_id": (
                            match.participant1.id if match.participant1 else None
                        ),
                        "participant2_id": (
                            match.participant2.id if match.participant2 else None
                        ),
                        "winner_id": match.winner.id if match.winner else None,
                        "score": match.score,
                        "current_spectators": match.current_spectators,
                    }
                    break
            cache.set(
                cls.MATCHES_KEY.format(tournament_id),
                json.dumps(matches),
                cls.MATCHES_TIMEOUT,
            )

    @classmethod
    def update_participant(cls, tournament_id: str, participant: TournamentParticipant):
        """Update a single participant in the cache"""
        participants = cls.get_participants(tournament_id)
        if participants:
            for i, p in enumerate(participants):
                if p["id"] == participant.id:
                    participants[i] = {
                        "id": participant.id,
                        "player_id": (
                            participant.player.id if participant.player else None
                        ),
                        "team_id": participant.team.id if participant.team else None,
                        "seed": participant.seed,
                        "matches_played": participant.matches_played,
                        "matches_won": participant.matches_won,
                        "is_eliminated": participant.is_eliminated,
                        "final_rank": participant.final_rank,
                    }
                    break
            cache.set(
                cls.PARTICIPANTS_KEY.format(tournament_id),
                json.dumps(participants),
                cls.PARTICIPANTS_TIMEOUT,
            )
