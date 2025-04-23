"""Tournament management system for DojoPool."""

from typing import Dict, List, Optional, Set, Tuple, cast, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging
import uuid
import math
from .player_rankings import PlayerRankingSystem, PlayerStats, MatchResult
from dojopool.story.progression import story_progression

logger = logging.getLogger(__name__)


class TournamentFormat(Enum):
    """Tournament format types."""

    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"


class TournamentStatus(Enum):
    """Tournament status states."""

    REGISTRATION = "registration"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class PrizeStructure:
    """Tournament prize structure."""

    total_prize_pool: float
    placement_percentages: Dict[int, float]  # Place -> Percentage
    special_prizes: Dict[str, float]  # Category -> Amount


@dataclass
class TournamentMatch:
    """Tournament match details."""

    match_id: str
    round_number: int
    match_number: int
    player1_id: Optional[str] = None
    player2_id: Optional[str] = None
    winner_id: Optional[str] = None
    loser_id: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    completed_time: Optional[datetime] = None
    result: Optional[MatchResult] = None


@dataclass
class Tournament:
    """Tournament details."""

    tournament_id: str
    name: str
    format: TournamentFormat
    start_date: datetime
    end_date: datetime
    venue_id: str
    min_players: int
    max_players: int
    entry_fee: float
    prize_structure: PrizeStructure
    game_type: str
    race_to: int
    status: TournamentStatus = TournamentStatus.REGISTRATION
    registered_players: Set[str] = field(default_factory=set)
    matches: List[TournamentMatch] = field(default_factory=list)
    current_round: int = 0
    rankings: Dict[str, int] = field(default_factory=dict)
    timestamps: Dict[str, Any] = field(
        default_factory=dict
    )  # Changed to Any to handle both datetime and int


class TournamentManager:
    """Manage tournaments and brackets."""

    def __init__(self, ranking_system: PlayerRankingSystem) -> None:
        """Initialize tournament manager."""
        self.ranking_system = ranking_system
        self._tournaments: Dict[str, Tournament] = {}

    def create_tournament(
        self,
        name: str,
        format: TournamentFormat,
        start_date: datetime,
        end_date: datetime,
        venue_id: str,
        min_players: int,
        max_players: int,
        entry_fee: float,
        prize_structure: PrizeStructure,
        game_type: str,
        race_to: int,
    ) -> Tournament:
        """Create a new tournament."""
        tournament_id = str(uuid.uuid4())

        tournament = Tournament(
            tournament_id=tournament_id,
            name=name,
            format=format,
            start_date=start_date,
            end_date=end_date,
            venue_id=venue_id,
            min_players=min_players,
            max_players=max_players,
            entry_fee=entry_fee,
            prize_structure=prize_structure,
            game_type=game_type,
            race_to=race_to,
        )

        tournament.timestamps["created"] = datetime.now()
        self._tournaments[tournament_id] = tournament

        logger.info(f"Created tournament: {name} (ID: {tournament_id})")
        return tournament

    def register_player(self, tournament_id: str, player_id: str) -> bool:
        """Register a player for a tournament."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return False

        if tournament.status != TournamentStatus.REGISTRATION:
            logger.error(f"Tournament not open for registration: {tournament_id}")
            return False

        if len(tournament.registered_players) >= tournament.max_players:
            logger.error(f"Tournament full: {tournament_id}")
            return False

        tournament.registered_players.add(player_id)
        logger.info(f"Registered player {player_id} for tournament {tournament_id}")
        return True

    def unregister_player(self, tournament_id: str, player_id: str) -> bool:
        """Unregister a player from a tournament (before it starts)."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return False
        if tournament.status != TournamentStatus.REGISTRATION:
            logger.warning(f"Cannot unregister after registration: {tournament_id}")
            return False
        if player_id not in tournament.registered_players:
            logger.warning(f"Player not registered: {player_id}")
            return False
        tournament.registered_players.remove(player_id)
        logger.info(f"Player {player_id} unregistered from tournament {tournament_id}")
        return True

    def start_tournament(self, tournament_id: str) -> bool:
        """Start a tournament if minimum players reached."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return False

        if len(tournament.registered_players) < tournament.min_players:
            logger.error(f"Not enough players for tournament: {tournament_id}")
            return False

        tournament.status = TournamentStatus.IN_PROGRESS
        tournament.timestamps["started"] = datetime.now()

        # After starting, advance all players' story
        for player_id in tournament.registered_players:
            story_progression.advance_chapter(player_id, new_chapter="The Grand Tournament", quest="Win your matches!")

        # Generate initial bracket
        self._generate_bracket(tournament)

        logger.info(f"Started tournament: {tournament_id}")
        self.notify_tournament_status(tournament_id, "Tournament has started!")
        return True

    def _generate_bracket(self, tournament: Tournament) -> None:
        """Generate tournament bracket based on format."""
        if tournament.format == TournamentFormat.SINGLE_ELIMINATION:
            self._generate_single_elimination(tournament)
        elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION:
            self._generate_double_elimination(tournament)
        elif tournament.format == TournamentFormat.ROUND_ROBIN:
            self._generate_round_robin(tournament)
        elif tournament.format == TournamentFormat.SWISS:
            self._generate_swiss(tournament)

    def _generate_single_elimination(self, tournament: Tournament) -> None:
        """Generate single elimination bracket."""
        players = list(tournament.registered_players)
        num_players = len(players)

        # Calculate number of rounds needed
        num_rounds = math.ceil(math.log2(num_players))
        num_byes = (2**num_rounds) - num_players

        # Sort players by ranking for seeding
        def get_player_rating(player_id: str) -> float:
            stats = self.ranking_system.get_player_stats(player_id)
            return stats.elo_rating if stats is not None else 0.0

        players.sort(key=get_player_rating, reverse=True)

        # Generate first round matches
        matches: List[TournamentMatch] = []
        match_number = 1

        for i in range(0, num_players, 2):
            if i + 1 < num_players:
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    round_number=1,
                    match_number=match_number,
                    player1_id=players[i],
                    player2_id=players[i + 1],
                )
            else:
                # Bye match
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    round_number=1,
                    match_number=match_number,
                    player1_id=players[i],
                    player2_id=None,
                    winner_id=players[i],  # Automatic win for bye
                )
            matches.append(match)
            match_number += 1

        tournament.matches = matches
        tournament.current_round = 1

    def _generate_double_elimination(self, tournament: Tournament) -> None:
        """Generate double elimination bracket."""
        players = list(tournament.registered_players)
        num_players = len(players)

        # Calculate number of rounds needed
        num_rounds = math.ceil(math.log2(num_players))
        num_winners_rounds = num_rounds
        num_losers_rounds = num_rounds * 2 - 1  # Losers bracket needs more rounds

        # Sort players by ranking for seeding
        def get_player_rating(player_id: str) -> float:
            stats = self.ranking_system.get_player_stats(player_id)
            return stats.elo_rating if stats is not None else 0.0

        players.sort(key=get_player_rating, reverse=True)

        # Generate first round matches in winners bracket
        matches = []
        match_number = 1

        # Winners bracket first round
        winners_matches = []
        for i in range(0, num_players, 2):
            if i + 1 < num_players:
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    round_number=1,
                    match_number=match_number,
                    player1_id=players[i],
                    player2_id=players[i + 1],
                )
            else:
                # Bye match
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    round_number=1,
                    match_number=match_number,
                    player1_id=players[i],
                    player2_id=None,
                    winner_id=players[i],  # Automatic win for bye
                )
            winners_matches.append(match)
            matches.append(match)
            match_number += 1

        tournament.matches = matches
        tournament.current_round = 1

    def _generate_next_double_elimination_round(self, tournament: Tournament) -> None:
        """Generate next round for double elimination bracket."""
        current_matches = [
            m for m in tournament.matches if m.round_number == tournament.current_round
        ]

        # Separate winners and losers bracket matches
        def is_winners_bracket(match: TournamentMatch) -> bool:
            """Check if match is in winners bracket."""
            if match.player1_id is None or match.player2_id is None:
                return True  # Bye matches are in winners bracket
            return not any(
                prev_m.loser_id in (match.player1_id, match.player2_id)
                for prev_m in tournament.matches
                if prev_m.round_number < match.round_number
            )

        winners_matches = [m for m in current_matches if is_winners_bracket(m)]
        losers_matches = [m for m in current_matches if not is_winners_bracket(m)]

        # Get winners and losers from current round
        new_winners = [m.winner_id for m in winners_matches if m.winner_id is not None]
        new_losers = [m.loser_id for m in winners_matches if m.loser_id is not None]
        losers_winners = [m.winner_id for m in losers_matches if m.winner_id is not None]

        if len(new_winners) == 1 and len(losers_winners) == 1:
            # Finals match between winners bracket champion and losers bracket champion
            finals_match = TournamentMatch(
                match_id=str(uuid.uuid4()),
                round_number=tournament.current_round + 1,
                match_number=1,
                player1_id=new_winners[0],  # Winners bracket champion
                player2_id=losers_winners[0],  # Losers bracket champion
            )
            tournament.matches.append(finals_match)
            tournament.current_round += 1
            return

        new_matches = []
        match_number = 1

        # Generate next winners bracket matches
        if len(new_winners) > 1:
            for i in range(0, len(new_winners), 2):
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    round_number=tournament.current_round + 1,
                    match_number=match_number,
                    player1_id=new_winners[i],
                    player2_id=new_winners[i + 1] if i + 1 < len(new_winners) else None,
                )
                new_matches.append(match)
                match_number += 1

        # Generate next losers bracket matches
        if new_losers:
            # First round of losers matches pairs losers from winners bracket
            for i in range(0, len(new_losers), 2):
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    round_number=tournament.current_round + 1,
                    match_number=match_number,
                    player1_id=new_losers[i],
                    player2_id=new_losers[i + 1] if i + 1 < len(new_losers) else None,
                )
                new_matches.append(match)
                match_number += 1
        elif losers_winners:
            # Later rounds pair winners from previous losers matches
            for i in range(0, len(losers_winners), 2):
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    round_number=tournament.current_round + 1,
                    match_number=match_number,
                    player1_id=losers_winners[i],
                    player2_id=losers_winners[i + 1] if i + 1 < len(losers_winners) else None,
                )
                new_matches.append(match)
                match_number += 1

        tournament.matches.extend(new_matches)
        tournament.current_round += 1

    def record_match_result(self, tournament_id: str, match_result: MatchResult) -> bool:
        """Record a tournament match result."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return False

        # Find the tournament match
        match = next(
            (
                m
                for m in tournament.matches
                if m.player1_id in (match_result.winner_id, match_result.loser_id)
                and m.player2_id in (match_result.winner_id, match_result.loser_id)
                and not m.completed_time
            ),
            None,
        )

        if not match:
            logger.error(f"Match not found in tournament: {tournament_id}")
            return False

        # Update match details
        match.winner_id = match_result.winner_id
        match.loser_id = match_result.loser_id
        match.completed_time = match_result.timestamp
        match.result = match_result

        # Record match in ranking system
        self.ranking_system.record_match(match_result)

        # Advance winner's story, complete quest for both
        story_progression.complete_quest(match_result.winner_id, quest_name="Win a tournament match")
        story_progression.set_flag(match_result.loser_id, flag="lost_a_match")

        # Notify both players
        self.notify_match_result(tournament_id, match)

        # Check if round is complete
        self._check_round_completion(tournament)

        logger.info(f"Recorded match result in tournament {tournament_id}")
        return True

    def _check_round_completion(self, tournament: Tournament) -> None:
        """Check if current round is complete and generate next round if needed."""
        current_matches = [
            m for m in tournament.matches if m.round_number == tournament.current_round
        ]

        if all(m.completed_time for m in current_matches):
            if tournament.format == TournamentFormat.SINGLE_ELIMINATION:
                self._generate_next_elimination_round(tournament)
            elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION:
                self._generate_next_double_elimination_round(tournament)
            elif tournament.format == TournamentFormat.SWISS:
                self._generate_next_swiss_round(tournament)

    def _generate_next_elimination_round(self, tournament: Tournament) -> None:
        """Generate next round for elimination bracket."""
        current_matches = [
            m for m in tournament.matches if m.round_number == tournament.current_round
        ]

        # Get winners from current round
        winners = [m.winner_id for m in current_matches if m.winner_id]

        if len(winners) == 1:
            # Tournament complete
            tournament.status = TournamentStatus.COMPLETED
            tournament.timestamps["completed"] = datetime.now()
            self._distribute_prizes(tournament)
            return

        # Generate next round matches
        new_matches = []
        match_number = 1

        for i in range(0, len(winners), 2):
            match = TournamentMatch(
                match_id=str(uuid.uuid4()),
                round_number=tournament.current_round + 1,
                match_number=match_number,
                player1_id=winners[i],
                player2_id=winners[i + 1] if i + 1 < len(winners) else None,
            )
            new_matches.append(match)
            match_number += 1

        tournament.matches.extend(new_matches)
        tournament.current_round += 1

    def _distribute_prizes(self, tournament: Tournament) -> None:
        """Distribute tournament prizes."""
        if tournament.status != TournamentStatus.COMPLETED:
            return

        # Get final rankings
        final_matches = sorted(
            [m for m in tournament.matches],
            key=lambda m: (m.round_number, m.match_number),
            reverse=True,
        )

        # First place is the winner of the last match
        rankings = {final_matches[0].winner_id: 1, final_matches[0].loser_id: 2}

        # Calculate prize money
        total_pool = tournament.prize_structure.total_prize_pool
        for place, percentage in tournament.prize_structure.placement_percentages.items():
            player_id = next((pid for pid, rank in rankings.items() if rank == place), None)
            if player_id:
                prize_amount = total_pool * percentage
                logger.info(
                    f"Awarded ${prize_amount:.2f} to player {player_id} " f"for place {place}"
                )

        tournament.rankings = rankings

    def get_tournament(self, tournament_id: str) -> Optional[Tournament]:
        """Get tournament details."""
        return self._tournaments.get(tournament_id)

    def get_player_tournaments(
        self, player_id: str, status: Optional[TournamentStatus] = None
    ) -> List[Tournament]:
        """Get tournaments for a player."""
        tournaments = []
        for tournament in self._tournaments.values():
            if player_id in tournament.registered_players:
                if not status or tournament.status == status:
                    tournaments.append(tournament)
        return tournaments

    def get_venue_tournaments(
        self, venue_id: str, status: Optional[TournamentStatus] = None
    ) -> List[Tournament]:
        """Get tournaments at a venue."""
        tournaments = []
        for tournament in self._tournaments.values():
            if tournament.venue_id == venue_id:
                if not status or tournament.status == status:
                    tournaments.append(tournament)
        return tournaments

    def _generate_round_robin(self, tournament: Tournament) -> None:
        """Generate round robin tournament schedule.

        Uses circle method algorithm:
        1. Place players in two rows
        2. Keep one player fixed, rotate others clockwise
        3. Each rotation creates matches for one round
        """
        players = list(tournament.registered_players)
        num_players = len(players)

        # If odd number of players, add a bye
        if num_players % 2 != 0:
            players.append(None)  # None represents a bye
            num_players += 1

        # Sort players by ranking for initial seeding
        def get_player_rating(player_id: Optional[str]) -> float:
            if player_id is None:
                return 0.0
            stats = self.ranking_system.get_player_stats(player_id)
            return stats.elo_rating if stats is not None else 0.0

        players.sort(key=get_player_rating, reverse=True)

        # Number of rounds needed = num_players - 1
        num_rounds = num_players - 1
        matches: List[TournamentMatch] = []
        match_number = 1

        # Generate matches for each round
        for round_num in range(1, num_rounds + 1):
            # In each round, pair first half with second half
            for i in range(num_players // 2):
                player1 = players[i]
                player2 = players[num_players - 1 - i]

                # Skip matches involving bye
                if player1 is not None and player2 is not None:
                    match = TournamentMatch(
                        match_id=str(uuid.uuid4()),
                        round_number=round_num,
                        match_number=match_number,
                        player1_id=player1,
                        player2_id=player2,
                    )
                    matches.append(match)
                    match_number += 1

            # Rotate players (except first player)
            players = [players[0]] + [players[-1]] + players[1:-1]

        tournament.matches = matches
        tournament.current_round = 1

    def _check_round_robin_completion(self, tournament: Tournament) -> None:
        """Check if round robin tournament is complete and update rankings."""
        all_matches_complete = all(m.completed_time for m in tournament.matches)

        if all_matches_complete:
            # Calculate points for each player
            points: Dict[str, int] = {}
            for match in tournament.matches:
                if match.winner_id is not None and match.loser_id is not None:
                    # Record the pairing
                    pair = tuple(sorted([match.winner_id, match.loser_id]))
                    played_pairs.add(cast(Tuple[str, str], pair))

                    # Update scores
                    points[match.winner_id] = points.get(match.winner_id, 0) + 2
                    points[match.loser_id] = points.get(match.loser_id, 0) + 1

            # Sort players by points
            ranked_players = sorted(
                [
                    (pid, points.get(pid, 0))
                    for pid in tournament.registered_players
                    if pid is not None
                ],
                key=lambda x: x[1],
                reverse=True,
            )

            # Update rankings (handle ties by giving same rank)
            current_rank = 1
            current_points: Optional[int] = None
            rankings: Dict[str, int] = {}

            for player_id, player_points in ranked_players:
                if player_points != current_points:
                    current_rank = len(rankings) + 1
                    current_points = player_points
                rankings[player_id] = current_rank

            tournament.rankings = rankings
            tournament.status = TournamentStatus.COMPLETED
            tournament.timestamps["completed"] = datetime.now()

            # Distribute prizes
            self._distribute_prizes(tournament)

    def _generate_swiss(self, tournament: Tournament) -> None:
        """Generate first round of Swiss tournament."""
        players = list(tournament.registered_players)
        num_players = len(players)

        # Calculate number of rounds (log2 of players, rounded up)
        num_rounds = math.ceil(math.log2(num_players))
        tournament.timestamps["num_rounds"] = num_rounds  # Now valid since timestamps accepts Any

        # Sort players by rating for initial seeding
        def get_player_rating(player_id: str) -> float:
            stats = self.ranking_system.get_player_stats(player_id)
            return stats.elo_rating if stats is not None else 0.0

        players.sort(key=get_player_rating, reverse=True)

        # Generate first round matches
        matches: List[TournamentMatch] = []
        match_number = 1

        # Pair top half against bottom half
        for i in range(num_players // 2):
            player1 = players[i]
            player2 = players[num_players // 2 + i]

            # Skip matches involving bye
            if player1 is not None and player2 is not None:
                match = TournamentMatch(
                    match_id=str(uuid.uuid4()),
                    round_number=1,
                    match_number=match_number,
                    player1_id=player1,
                    player2_id=player2,
                )
                matches.append(match)
                match_number += 1

        # Handle odd number of players with bye
        if num_players % 2 != 0:
            match = TournamentMatch(
                match_id=str(uuid.uuid4()),
                round_number=1,
                match_number=match_number,
                player1_id=players[-1],
                player2_id=None,
                winner_id=players[-1],  # Automatic win for bye
            )
            matches.append(match)

        tournament.matches = matches
        tournament.current_round = 1

    def _generate_next_swiss_round(self, tournament: Tournament) -> None:
        """Generate next round of Swiss tournament."""
        # Get player scores
        scores: Dict[str, float] = {}
        played_pairs: Set[Tuple[str, str]] = set()

        for match in tournament.matches:
            if match.winner_id is not None and match.loser_id is not None:
                # Record the pairing
                pair = tuple(sorted([match.winner_id, match.loser_id]))
                played_pairs.add(cast(Tuple[str, str], pair))

                # Update scores
                scores[match.winner_id] = scores.get(match.winner_id, 0) + 1
                scores[match.loser_id] = scores.get(match.loser_id, 0)
            elif match.winner_id is not None:  # Bye
                scores[match.winner_id] = scores.get(match.winner_id, 0) + 1

        # Group players by score
        score_groups: Dict[float, List[str]] = {}
        for player_id in tournament.registered_players:
            if player_id is not None:  # Skip None players
                score = scores.get(player_id, 0)
                if score not in score_groups:
                    score_groups[score] = []
                score_groups[score].append(player_id)

        # Sort score groups by score
        sorted_scores = sorted(score_groups.keys(), reverse=True)

        # Generate matches for next round
        new_matches: List[TournamentMatch] = []
        match_number = 1
        paired_players: Set[str] = set()

        # Try to pair players within same score group first
        for score in sorted_scores:
            players = score_groups[score]

            # Sort players by rating within score group
            def get_player_rating(player_id: str) -> float:
                stats = self.ranking_system.get_player_stats(player_id)
                return stats.elo_rating if stats is not None else 0.0

            players.sort(key=get_player_rating, reverse=True)

            i = 0
            while i < len(players):
                if players[i] in paired_players:
                    i += 1
                    continue

                # Find opponent
                j = i + 1
                while j < len(players):
                    if players[j] not in paired_players:
                        pair = tuple(sorted([players[i], players[j]]))
                        if pair not in played_pairs:
                            # Valid pairing found
                            match = TournamentMatch(
                                match_id=str(uuid.uuid4()),
                                round_number=tournament.current_round + 1,
                                match_number=match_number,
                                player1_id=players[i],
                                player2_id=players[j],
                            )
                            new_matches.append(match)
                            match_number += 1
                            paired_players.add(players[i])
                            paired_players.add(players[j])
                            break
                    j += 1
                i += 1

        tournament.matches.extend(new_matches)
        tournament.current_round += 1

        # Check if tournament is complete
        if tournament.current_round >= tournament.timestamps["num_rounds"]:
            self._complete_swiss_tournament(tournament)

    def _complete_swiss_tournament(self, tournament: Tournament) -> None:
        """Complete Swiss tournament and calculate final rankings."""
        # Calculate final scores
        scores: Dict[str, float] = {}
        played_pairs: Set[Tuple[str, str]] = set()

        for match in tournament.matches:
            if match.winner_id is not None and match.loser_id is not None:
                # Record the pairing
                pair = tuple(sorted([match.winner_id, match.loser_id]))
                played_pairs.add(cast(Tuple[str, str], pair))

                # Update scores
                scores[match.winner_id] = scores.get(match.winner_id, 0) + 1
                scores[match.loser_id] = scores.get(match.loser_id, 0)
            elif match.winner_id is not None:  # Bye
                scores[match.winner_id] = scores.get(match.winner_id, 0) + 1

        # Sort players by score and rating for tiebreaks
        ranked_players = [p for p in tournament.registered_players if p is not None]
        ranked_players.sort(
            key=lambda p: (
                scores.get(p, 0),
                (
                    self.ranking_system.get_player_stats(p).elo_rating
                    if p is not None and self.ranking_system.get_player_stats(p) is not None
                    else 0
                ),
            ),
            reverse=True,
        )

        # Assign rankings
        rankings: Dict[str, int] = {p: i + 1 for i, p in enumerate(ranked_players)}

        tournament.rankings = rankings
        tournament.status = TournamentStatus.COMPLETED
        tournament.timestamps["completed"] = datetime.now()

        # Distribute prizes
        self._distribute_prizes(tournament)

    def get_bracket(self, tournament_id: str) -> list:
        """Return the current bracket (list of matches) for the tournament."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return []
        return [match for match in tournament.matches]

    def get_match_status(self, tournament_id: str, match_id: str) -> dict:
        """Return the status of a specific match in the tournament."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return {}
        match = next((m for m in tournament.matches if m.match_id == match_id), None)
        if not match:
            logger.error(f"Match not found: {match_id}")
            return {}
        return {
            'match_id': match.match_id,
            'round_number': match.round_number,
            'match_number': match.match_number,
            'player1_id': match.player1_id,
            'player2_id': match.player2_id,
            'winner_id': match.winner_id,
            'loser_id': match.loser_id,
            'scheduled_time': match.scheduled_time,
            'completed_time': match.completed_time,
            'result': match.result
        }

    def cancel_tournament(self, tournament_id: str, reason: str = "") -> bool:
        """Cancel a tournament (admin action)."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return False
        if tournament.status in [TournamentStatus.COMPLETED, TournamentStatus.CANCELLED]:
            logger.warning(f"Tournament already completed or cancelled: {tournament_id}")
            return False
        tournament.status = TournamentStatus.CANCELLED
        tournament.timestamps["cancelled"] = datetime.now()
        logger.info(f"Tournament {tournament_id} cancelled. Reason: {reason}")
        self.notify_tournament_status(tournament_id, f"Tournament cancelled. {reason}")
        return True

    def force_complete(self, tournament_id: str) -> bool:
        """Force-complete a tournament and assign current rankings (admin action)."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return False
        if tournament.status == TournamentStatus.COMPLETED:
            logger.warning(f"Tournament already completed: {tournament_id}")
            return False
        # Assign rankings based on current match results
        # (Simple: by number of wins, then rating)
        scores = {pid: 0 for pid in tournament.registered_players}
        for match in tournament.matches:
            if match.winner_id:
                scores[match.winner_id] = scores.get(match.winner_id, 0) + 1
        ranked_players = list(tournament.registered_players)
        ranked_players.sort(
            key=lambda p: (
                scores.get(p, 0),
                self.ranking_system.get_player_stats(p).elo_rating if self.ranking_system.get_player_stats(p) else 0
            ),
            reverse=True
        )
        tournament.rankings = {p: i + 1 for i, p in enumerate(ranked_players)}
        tournament.status = TournamentStatus.COMPLETED
        tournament.timestamps["completed"] = datetime.now()
        logger.info(f"Tournament {tournament_id} force-completed.")
        self.notify_tournament_status(tournament_id, "Tournament force-completed. Rankings assigned.")
        return True

    def admin_advance_round(self, tournament_id: str) -> bool:
        """Manually advance the tournament to the next round (admin action)."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return False
        if tournament.status != TournamentStatus.IN_PROGRESS:
            logger.warning(f"Tournament not in progress: {tournament_id}")
            return False
        # Use the internal bracket generator for the format
        self._generate_bracket(tournament)
        logger.info(f"Admin advanced tournament {tournament_id} to next round.")
        return True

    def _notify_players(self, user_ids, notif_type, title, message, data=None):
        """Send notifications to a list of users (helper)."""
        from dojopool.services.notification_service import NotificationService
        for uid in user_ids:
            NotificationService.send_notification(uid, notif_type, title, message, data)

    def notify_tournament_status(self, tournament_id: str, status_message: str):
        """Notify all registered players of a tournament status update."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament:
            logger.error(f"Tournament not found: {tournament_id}")
            return
        title = f"Tournament Update: {tournament.name}"
        data = {"tournament_id": tournament_id, "status": tournament.status}
        self._notify_players(
            tournament.registered_players,
            "tournament_update",
            title,
            status_message,
            data
        )

    def notify_match_result(self, tournament_id: str, match):
        """Notify both players of a match result."""
        tournament = self._tournaments.get(tournament_id)
        if not tournament or not match:
            logger.error(f"Tournament or match not found for notify_match_result")
            return
        title = f"Match Result: {tournament.name}"
        data = {"tournament_id": tournament_id, "match_id": match.match_id}
        msg = f"Match {match.match_number} completed. Winner: {match.winner_id}, Loser: {match.loser_id}"
        self._notify_players(
            [match.player1_id, match.player2_id],
            "match_result",
            title,
            msg,
            data
        )
