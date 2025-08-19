"""Tournament management system for DojoPool."""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple
import uuid
from decimal import Decimal


class TournamentType(Enum):
    """Types of tournaments."""

    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"
    LEAGUE = "league"


class TournamentStatus(Enum):
    """Status of a tournament."""

    ANNOUNCED = "announced"
    REGISTRATION_OPEN = "registration_open"
    REGISTRATION_CLOSED = "registration_closed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MatchStatus(Enum):
    """Status of a tournament match."""

    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FORFEITED = "forfeited"


@dataclass
class TournamentMatch:
    """Tournament match details."""

    match_id: str
    tournament_id: str
    round_number: int
    player1_id: str
    player2_id: str
    table_id: Optional[str]
    scheduled_time: Optional[datetime]
    status: MatchStatus
    winner_id: Optional[str] = None
    score: Optional[str] = None
    duration: Optional[timedelta] = None
    stats: Dict[str, any] = field(default_factory=dict)


@dataclass
class TournamentRound:
    """Tournament round details."""

    round_number: int
    matches: List[TournamentMatch]
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    completed: bool = False


@dataclass
class TournamentStats:
    """Tournament statistics."""

    total_matches: int = 0
    matches_completed: int = 0
    total_players: int = 0
    total_prize_pool: Decimal = Decimal("0")
    average_match_duration: timedelta = timedelta()
    highest_break: int = 0
    longest_match: timedelta = timedelta()
    shortest_match: timedelta = timedelta()


@dataclass
class TournamentData:
    """Tournament details."""

    tournament_id: str
    name: str
    venue_id: str
    tournament_type: TournamentType
    start_date: datetime
    end_date: datetime
    status: TournamentStatus
    entry_fee: Decimal
    prize_pool: Dict[int, Decimal]  # position -> prize amount
    max_players: int
    min_skill_level: Optional[int] = None
    max_skill_level: Optional[int] = None
    description: str = ""
    rules: List[str] = field(default_factory=list)
    registered_players: Set[str] = field(default_factory=set)
    rounds: List[TournamentRound] = field(default_factory=list)
    stats: TournamentStats = field(default_factory=TournamentStats)
    sponsors: List[Dict] = field(default_factory=list)


class TournamentManager:
    """Manages pool tournaments in the system."""

    def __init__(self) -> None:
        """Initialize the tournament manager."""
        self._tournaments: Dict[str, TournamentData] = {}
        self._player_tournaments: Dict[str, Set[str]] = {}  # player_id -> tournament_ids
        self._venue_tournaments: Dict[str, Set[str]] = {}  # venue_id -> tournament_ids

    def create_tournament(
        self,
        name: str,
        venue_id: str,
        tournament_type: TournamentType,
        start_date: datetime,
        end_date: datetime,
        entry_fee: Decimal,
        prize_pool: Dict[int, Decimal],
        max_players: int,
        min_skill_level: Optional[int] = None,
        max_skill_level: Optional[int] = None,
        description: str = "",
        rules: List[str] = [],
    ) -> TournamentData:
        """Create a new tournament."""
        tournament_id = str(uuid.uuid4())
        tournament = TournamentData(
            tournament_id=tournament_id,
            name=name,
            venue_id=venue_id,
            tournament_type=tournament_type,
            start_date=start_date,
            end_date=end_date,
            status=TournamentStatus.ANNOUNCED,
            entry_fee=entry_fee,
            prize_pool=prize_pool,
            max_players=max_players,
            min_skill_level=min_skill_level,
            max_skill_level=max_skill_level,
            description=description,
            rules=rules,
        )

        self._tournaments[tournament_id] = tournament

        if venue_id not in self._venue_tournaments:
            self._venue_tournaments[venue_id] = set()
        self._venue_tournaments[venue_id].add(tournament_id)

        return tournament

    def register_player(self, tournament_id: str, player_id: str, skill_level: int) -> bool:
        """Register a player for a tournament."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            return False

        if tournament.status != TournamentStatus.REGISTRATION_OPEN:
            return False

        if len(tournament.registered_players) >= tournament.max_players:
            return False

        if (
            tournament.min_skill_level
            and skill_level < tournament.min_skill_level
            or tournament.max_skill_level
            and skill_level > tournament.max_skill_level
        ):
            return False

        tournament.registered_players.add(player_id)

        if player_id not in self._player_tournaments:
            self._player_tournaments[player_id] = set()
        self._player_tournaments[player_id].add(tournament_id)

        return True

    def start_tournament(self, tournament_id: str) -> bool:
        """Start a tournament and generate first round matches."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            return False

        if tournament.status != TournamentStatus.REGISTRATION_CLOSED:
            return False

        if len(tournament.registered_players) < 2:
            return False

        # Generate first round matches
        players = list(tournament.registered_players)
        matches = []

        for i in range(0, len(players), 2):
            if i + 1 < len(players):
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    tournament_id=tournament_id,
                    round_number=1,
                    player1_id=players[i],
                    player2_id=players[i + 1],
                    table_id=None,
                    scheduled_time=None,
                    status=MatchStatus.SCHEDULED,
                )
                matches.append(match)

        tournament.rounds.append(TournamentRound(round_number=1, matches=matches))

        tournament.status = TournamentStatus.IN_PROGRESS
        return True

    def record_match_result(
        self,
        tournament_id: str,
        match_id: str,
        winner_id: str,
        score: str,
        duration: timedelta,
        stats: Dict[str, any],
    ) -> bool:
        """Record the result of a tournament match."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            return False

        # Find and update match
        for round in tournament.rounds:
            for match in round.matches:
                if match.match_id == match_id:
                    if match.status != MatchStatus.IN_PROGRESS:
                        return False

                    match.winner_id = winner_id
                    match.score = score
                    match.duration = duration
                    match.stats = stats
                    match.status = MatchStatus.COMPLETED

                    # Update tournament stats
                    tournament.stats.matches_completed += 1
                    if duration > tournament.stats.longest_match:
                        tournament.stats.longest_match = duration
                    if (
                        tournament.stats.shortest_match == timedelta()
                        or duration < tournament.stats.shortest_match
                    ):
                        tournament.stats.shortest_match = duration

                    # Check if round is complete
                    round.completed = all(m.status == MatchStatus.COMPLETED for m in round.matches)

                    # Generate next round if needed
                    if round.completed and tournament.tournament_type in [
                        TournamentType.SINGLE_ELIMINATION,
                        TournamentType.DOUBLE_ELIMINATION,
                    ]:
                        self._generate_next_round(tournament, round)

                    return True

        return False

    def _generate_next_round(
        self, tournament: TournamentData, completed_round: TournamentRound
    ) -> None:
        """Generate matches for the next round."""
        winners = [match.winner_id for match in completed_round.matches if match.winner_id]

        if len(winners) < 2:
            tournament.status = TournamentStatus.COMPLETED
            return

        next_round = len(tournament.rounds) + 1
        matches = []

        for i in range(0, len(winners), 2):
            if i + 1 < len(winners):
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    tournament_id=tournament.tournament_id,
                    round_number=next_round,
                    player1_id=winners[i],
                    player2_id=winners[i + 1],
                    table_id=None,
                    scheduled_time=None,
                    status=MatchStatus.SCHEDULED,
                )
                matches.append(match)

        if matches:
            tournament.rounds.append(TournamentRound(round_number=next_round, matches=matches))
        else:
            tournament.status = TournamentStatus.COMPLETED

    def get_tournament(self, tournament_id: str) -> Optional[TournamentData]:
        """Get tournament by ID."""
        return self._tournaments.get(tournament_id)

    def get_player_tournaments(
        self, player_id: str, status: Optional[TournamentStatus] = None
    ) -> List[TournamentData]:
        """Get tournaments for a player."""
        tournament_ids = self._player_tournaments.get(player_id, set())
        tournaments = [self._tournaments[tid] for tid in tournament_ids if tid in self._tournaments]

        if status:
            tournaments = [t for t in tournaments if t.status == status]

        return sorted(tournaments, key=lambda t: t.start_date, reverse=True)

    def get_venue_tournaments(
        self, venue_id: str, status: Optional[TournamentStatus] = None
    ) -> List[TournamentData]:
        """Get tournaments at a venue."""
        tournament_ids = self._venue_tournaments.get(venue_id, set())
        tournaments = [self._tournaments[tid] for tid in tournament_ids if tid in self._tournaments]

        if status:
            tournaments = [t for t in tournaments if t.status == status]

        return sorted(tournaments, key=lambda t: t.start_date, reverse=True)

    def get_tournament_standings(self, tournament_id: str) -> List[Tuple[str, int]]:
        """Get current tournament standings (player_id, wins)."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            return []

        # Count wins for each player
        wins: Dict[str, int] = {}
        for round in tournament.rounds:
            for match in round.matches:
                if match.status == MatchStatus.COMPLETED and match.winner_id:
                    wins[match.winner_id] = wins.get(match.winner_id, 0) + 1

        # Sort by wins
        standings = sorted(wins.items(), key=lambda x: x[1], reverse=True)

        return standings

    def get_match_schedule(
        self, tournament_id: str, round_number: Optional[int] = None
    ) -> List[TournamentMatch]:
        """Get match schedule for a tournament."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            return []

        matches = []
        for r in tournament.rounds:
            if round_number is None or r.round_number == round_number:
                matches.extend(r.matches)

        return sorted(matches, key=lambda m: m.scheduled_time or datetime.max)
