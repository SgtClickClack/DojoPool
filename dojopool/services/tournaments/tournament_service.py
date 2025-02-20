"""
Tournament management service for DojoPool.
Handles professional tournament organization, brackets, and scoring.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple


class TournamentType(Enum):
    """Types of tournament formats."""

    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"
    GROUP_STAGE = "group_stage"


class TournamentStatus(Enum):
    """Status of a tournament."""

    DRAFT = "draft"
    REGISTRATION_OPEN = "registration_open"
    REGISTRATION_CLOSED = "registration_closed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class TournamentRules:
    """Rules configuration for a tournament."""

    game_type: str  # '8-ball', '9-ball', etc.
    race_to: int  # number of games to win a match
    time_limit: Optional[int]  # minutes per match, if any
    shot_clock: Optional[int]  # seconds per shot, if any
    break_rules: str  # 'winner', 'alternate', 'lag'
    scoring_system: str  # 'standard', 'points', 'custom'
    handicap_system: Optional[str]  # handicap system if used
    dress_code: str  # dress code requirements
    referee_required: bool  # whether matches require referees


@dataclass
class PrizeMoney:
    """Prize money distribution."""

    total_pool: float
    distribution: Dict[int, float]  # position -> percentage
    currency: str = "USD"


@dataclass
class Participant:
    """Tournament participant information."""

    player_id: str
    name: str
    rank: Optional[int]
    seed: Optional[int]
    status: str  # 'active', 'eliminated', 'withdrawn'
    matches_played: int = 0
    matches_won: int = 0
    games_won: int = 0
    games_lost: int = 0


@dataclass
class Match:
    """Tournament match information."""

    match_id: str
    round_number: int
    player1_id: str
    player2_id: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    table_id: Optional[str]
    referee_id: Optional[str]
    score: Tuple[int, int]  # (player1_score, player2_score)
    status: str  # 'scheduled', 'in_progress', 'completed', 'postponed'
    winner_id: Optional[str]
    next_match_id: Optional[str]  # winner's next match
    stream_url: Optional[str]


class TournamentService:
    """Manages professional tournament operations."""

    def __init__(self):
        """Initialize tournament service."""
        self.tournaments: Dict[str, Dict] = {}
        self.matches: Dict[str, Match] = {}
        self.participants: Dict[str, Dict[str, Participant]] = (
            {}
        )  # tournament_id -> {player_id -> Participant}

    def create_tournament(
        self,
        name: str,
        venue_id: str,
        start_date: datetime,
        end_date: datetime,
        tournament_type: TournamentType,
        rules: TournamentRules,
        max_participants: int,
        prize_money: Optional[PrizeMoney] = None,
        qualification_criteria: Optional[Dict] = None,
    ) -> str:
        """Create a new tournament."""
        tournament_id = str(uuid.uuid4())

        tournament = {
            "tournament_id": tournament_id,
            "name": name,
            "venue_id": venue_id,
            "start_date": start_date,
            "end_date": end_date,
            "type": tournament_type,
            "rules": rules,
            "max_participants": max_participants,
            "prize_money": prize_money,
            "qualification_criteria": qualification_criteria,
            "status": TournamentStatus.DRAFT,
            "current_round": 0,
            "rounds_config": self._generate_rounds_config(
                tournament_type, max_participants
            ),
        }

        self.tournaments[tournament_id] = tournament
        self.participants[tournament_id] = {}

        return tournament_id

    def open_registration(
        self, tournament_id: str, registration_deadline: datetime
    ) :
        """Open tournament registration."""
        if tournament_id not in self.tournaments:
            raise ValueError(f"Tournament {tournament_id} not found")

        tournament = self.tournaments[tournament_id]
        if tournament["status"] != TournamentStatus.DRAFT:
            raise ValueError("Tournament must be in draft status to open registration")

        tournament["registration_deadline"] = registration_deadline
        tournament["status"] = TournamentStatus.REGISTRATION_OPEN
        return True

    def register_participant(
        self,
        tournament_id: str,
        player_id: str,
        player_name: str,
        player_rank: Optional[int] = None,
    ) :
        """Register a participant for the tournament."""
        if tournament_id not in self.tournaments:
            raise ValueError(f"Tournament {tournament_id} not found")

        tournament = self.tournaments[tournament_id]
        if tournament["status"] != TournamentStatus.REGISTRATION_OPEN:
            raise ValueError("Tournament registration is not open")

        if len(self.participants[tournament_id]) >= tournament["max_participants"]:
            raise ValueError("Tournament is full")

        participant = Participant(
            player_id=player_id,
            name=player_name,
            rank=player_rank,
            seed=None,
            status="active",
        )

        self.participants[tournament_id][player_id] = participant
        return True

    def generate_seeding(
        self,
        tournament_id: str,
        method: str = "ranking",  # 'ranking', 'random', 'manual'
    ) -> List[Participant]:
        """Generate tournament seeding."""
        if tournament_id not in self.tournaments:
            raise ValueError(f"Tournament {tournament_id} not found")

        participants = list(self.participants[tournament_id].values())

        if method == "ranking":
            # Sort by rank, handling None ranks
            ranked = [p for p in participants if p.rank is not None]
            unranked = [p for p in participants if p.rank is None]

            ranked.sort(key=lambda p: p.rank)
            participants = ranked + unranked
        elif method == "random":
            import random

            random.shuffle(participants)

        # Assign seeds
        for i, participant in enumerate(participants):
            participant.seed = i + 1

        return participants

    def start_tournament(self, tournament_id: str) :
        """Start the tournament and generate first round matches."""
        if tournament_id not in self.tournaments:
            raise ValueError(f"Tournament {tournament_id} not found")

        tournament = self.tournaments[tournament_id]
        if tournament["status"] != TournamentStatus.REGISTRATION_CLOSED:
            raise ValueError("Tournament registration must be closed before starting")

        # Generate first round matches
        matches = self._generate_round_matches(tournament_id, round_number=1)

        # Add matches to tournament
        for match in matches:
            self.matches[match.match_id] = match

        tournament["status"] = TournamentStatus.IN_PROGRESS
        tournament["current_round"] = 1

        return True

    def record_match_result(
        self, match_id: str, score: Tuple[int, int], stats: Optional[Dict] = None
    ) :
        """Record the result of a match."""
        if match_id not in self.matches:
            raise ValueError(f"Match {match_id} not found")

        match = self.matches[match_id]
        if match.status != "in_progress":
            raise ValueError("Match must be in progress to record result")

        # Update match
        match.score = score
        match.end_time = datetime.now()
        match.status = "completed"

        # Determine winner
        if score[0] > score[1]:
            match.winner_id = match.player1_id
        else:
            match.winner_id = match.player2_id

        # Update participant statistics
        tournament_id = self._get_tournament_id_for_match(match_id)
        p1 = self.participants[tournament_id][match.player1_id]
        p2 = self.participants[tournament_id][match.player2_id]

        p1.matches_played += 1
        p2.matches_played += 1

        if match.winner_id == match.player1_id:
            p1.matches_won += 1
        else:
            p2.matches_won += 1

        p1.games_won += score[0]
        p1.games_lost += score[1]
        p2.games_won += score[1]
        p2.games_lost += score[0]

        return True

    def advance_round(self, tournament_id: str) -> bool:
        """Advance tournament to next round."""
        if tournament_id not in self.tournaments:
            raise ValueError(f"Tournament {tournament_id} not found")

        tournament = self.tournaments[tournament_id]
        current_round = tournament["current_round"]

        # Check if all matches in current round are completed
        current_matches = self._get_matches_for_round(tournament_id, current_round)
        if not all(m.status == "completed" for m in current_matches):
            raise ValueError("All matches in current round must be completed")

        # Generate matches for next round
        next_round = current_round + 1
        if next_round <= len(tournament["rounds_config"]):
            matches = self._generate_round_matches(tournament_id, next_round)
            for match in matches:
                self.matches[match.match_id] = match

            tournament["current_round"] = next_round
            return True
        else:
            # Tournament is complete
            tournament["status"] = TournamentStatus.COMPLETED
            self._award_prizes(tournament_id)
            return False

    def get_standings(self, tournament_id: str) :
        """Get current tournament standings."""
        if tournament_id not in self.tournaments:
            raise ValueError(f"Tournament {tournament_id} not found")

        tournament = self.tournaments[tournament_id]
        participants = list(self.participants[tournament_id].values())

        if tournament["type"] == TournamentType.ROUND_ROBIN:
            # Sort by matches won, then games won
            standings = sorted(
                participants,
                key=lambda p: (p.matches_won, p.games_won - p.games_lost),
                reverse=True,
            )
        else:
            # For elimination formats, sort by stage eliminated and matches won
            standings = sorted(
                participants,
                key=lambda p: (0 if p.status == "active" else 1, p.matches_won),
                reverse=True,
            )

        return [
            {
                "player_id": p.player_id,
                "name": p.name,
                "rank": p.rank,
                "matches_won": p.matches_won,
                "matches_played": p.matches_played,
                "games_won": p.games_won,
                "games_lost": p.games_lost,
                "status": p.status,
            }
            for p in standings
        ]

    def _generate_rounds_config(
        self, tournament_type: TournamentType, max_participants: int
    ) -> List[Dict]:
        """Generate round configuration based on tournament type."""
        rounds_config = []

        if tournament_type == TournamentType.SINGLE_ELIMINATION:
            # Calculate number of rounds needed
            import math

            num_rounds = math.ceil(math.log2(max_participants))

            for round_num in range(1, num_rounds + 1):
                rounds_config.append(
                    {
                        "round_number": round_num,
                        "name": f"Round {round_num}",
                        "matches": 2 ** (num_rounds - round_num),
                    }
                )

            # Update names for final rounds
            if len(rounds_config) >= 2:
                rounds_config[-1]["name"] = "Final"
                rounds_config[-2]["name"] = "Semi-Finals"
                if len(rounds_config) >= 3:
                    rounds_config[-3]["name"] = "Quarter-Finals"

        elif tournament_type == TournamentType.ROUND_ROBIN:
            # Each participant plays against every other participant
            num_rounds = max_participants - 1
            matches_per_round = max_participants // 2

            for round_num in range(1, num_rounds + 1):
                rounds_config.append(
                    {
                        "round_number": round_num,
                        "name": f"Round {round_num}",
                        "matches": matches_per_round,
                    }
                )

        return rounds_config

    def _generate_round_matches(
        self, tournament_id: str, round_number: int
    ) -> List[Match]:
        """Generate matches for a tournament round."""
        tournament = self.tournaments[tournament_id]
        round_config = next(
            r for r in tournament["rounds_config"] if r["round_number"] == round_number
        )

        matches = []
        if round_number == 1:
            # First round - use seeding
            participants = sorted(
                self.participants[tournament_id].values(),
                key=lambda p: p.seed or float("inf"),
            )

            # Pair participants based on seeding
            for i in range(0, len(participants), 2):
                if i + 1 < len(participants):
                    match = Match(
                        match_id=str(uuid.uuid4()),
                        round_number=round_number,
                        player1_id=participants[i].player_id,
                        player2_id=participants[i + 1].player_id,
                        start_time=None,
                        end_time=None,
                        table_id=None,
                        referee_id=None,
                        score=(0, 0),
                        status="scheduled",
                        winner_id=None,
                        next_match_id=None,
                        stream_url=None,
                    )
                    matches.append(match)
        else:
            # Later rounds - pair winners from previous round
            prev_matches = self._get_matches_for_round(tournament_id, round_number - 1)

            for i in range(0, len(prev_matches), 2):
                if i + 1 < len(prev_matches):
                    match = Match(
                        match_id=str(uuid.uuid4()),
                        round_number=round_number,
                        player1_id=prev_matches[i].winner_id,
                        player2_id=prev_matches[i + 1].winner_id,
                        start_time=None,
                        end_time=None,
                        table_id=None,
                        referee_id=None,
                        score=(0, 0),
                        status="scheduled",
                        winner_id=None,
                        next_match_id=None,
                        stream_url=None,
                    )
                    matches.append(match)

        return matches

    def _get_matches_for_round(
        self, tournament_id: str, round_number: int
    ) -> List[Match]:
        """Get all matches for a specific round."""
        return [
            match
            for match in self.matches.values()
            if self._get_tournament_id_for_match(match.match_id) == tournament_id
            and match.round_number == round_number
        ]

    def _get_tournament_id_for_match(self, match_id: str) :
        """Get tournament ID for a match."""
        # In real implementation, would use database relationship
        # This is a placeholder implementation
        for tournament_id, tournament in self.tournaments.items():
            if any(
                match.match_id == match_id
                for match in self._get_matches_for_round(
                    tournament_id, tournament["current_round"]
                )
            ):
                return tournament_id
        return None

    def _award_prizes(self, tournament_id: str) :
        """Award prize money to winners."""
        tournament = self.tournaments[tournament_id]
        if not tournament["prize_money"]:
            return

        standings = self.get_standings(tournament_id)
        prize_money = tournament["prize_money"]

        for position, percentage in prize_money.distribution.items():
            if position <= len(standings):
                winner = standings[position - 1]
                amount = prize_money.total_pool * (percentage / 100)
                # In real implementation, would trigger payment process
                print(f"Awarded {amount} {prize_money.currency} to {winner['name']}")
