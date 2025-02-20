"""
Professional tournament statistics and analytics service.
"""

import statistics
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from .pro_tournament_config import ProTournamentTier


@dataclass
class PlayerStats:
    """Individual player statistics."""

    matches_played: int = 0
    matches_won: int = 0
    games_played: int = 0
    games_won: int = 0
    high_run: int = 0
    perfect_games: int = 0
    average_ppg: float = 0.0  # points per game
    win_percentage: float = 0.0
    tournament_wins: int = 0
    tournament_finals: int = 0
    head_to_head: Dict[str, Dict[str, int]] = None  # opponent_id -> {wins, losses}
    performance_by_tier: Dict[ProTournamentTier, Dict[str, float]] = (
        None  # tier -> stats
    )


@dataclass
class TournamentStats:
    """Tournament-wide statistics."""

    total_matches: int = 0
    total_games: int = 0
    average_games_per_match: float = 0.0
    longest_match: timedelta = timedelta()
    shortest_match: timedelta = timedelta()
    average_match_duration: timedelta = timedelta()
    high_run: int = 0
    high_run_player: str = ""
    perfect_games: int = 0
    participants: int = 0
    matches_by_round: Dict[int, int] = None  # round -> match count
    upsets: List[Dict] = None  # List of matches where lower seed won
    prize_distribution: Dict[str, float] = None  # player_id -> amount


class StatisticsService:
    """Manages tournament statistics and analytics."""

    def __init__(self):
        """Initialize statistics service."""
        self.player_stats: Dict[str, PlayerStats] = defaultdict(PlayerStats)
        self.tournament_stats: Dict[str, TournamentStats] = {}
        self.venue_stats: Dict[str, Dict] = defaultdict(lambda: defaultdict(float))

    def record_match_result(
        self,
        tournament_id: str,
        match_id: str,
        player1_id: str,
        player2_id: str,
        score: Tuple[int, int],
        duration: timedelta,
        stats: Optional[Dict] = None,
    ) -> None:
        """Record match result and update statistics."""
        # Initialize tournament stats if not exists
        if tournament_id not in self.tournament_stats:
            self.tournament_stats[tournament_id] = TournamentStats(
                matches_by_round={}, upsets=[], prize_distribution={}
            )

        tournament = self.tournament_stats[tournament_id]

        # Update tournament stats
        tournament.total_matches += 1
        tournament.total_games += sum(score)
        tournament.average_games_per_match = (
            tournament.total_games / tournament.total_matches
        )

        # Update match duration stats
        if not tournament.longest_match or duration > tournament.longest_match:
            tournament.longest_match = duration
        if not tournament.shortest_match or duration < tournament.shortest_match:
            tournament.shortest_match = duration

        # Calculate running average for match duration
        tournament.average_match_duration = (
            tournament.average_match_duration * (tournament.total_matches - 1)
            + duration
        ) / tournament.total_matches

        # Update player stats
        winner_id = player1_id if score[0] > score[1] else player2_id
        loser_id = player2_id if score[0] > score[1] else player1_id

        for player_id in (player1_id, player2_id):
            if player_id not in self.player_stats:
                self._initialize_player_stats(player_id)

            player = self.player_stats[player_id]
            player.matches_played += 1
            player.games_played += sum(score)

            if player_id == winner_id:
                player.matches_won += 1
                player.games_won += max(score)
            else:
                player.games_won += min(score)

            player.win_percentage = (
                player.matches_won / player.matches_played
                if player.matches_played > 0
                else 0.0
            )

            # Update head-to-head record
            opponent_id = player2_id if player_id == player1_id else player1_id
            if not player.head_to_head:
                player.head_to_head = defaultdict(lambda: {"wins": 0, "losses": 0})
            if player_id == winner_id:
                player.head_to_head[opponent_id]["wins"] += 1
            else:
                player.head_to_head[opponent_id]["losses"] += 1

        # Process additional stats if provided
        if stats:
            self._process_additional_stats(tournament_id, stats)

    def record_tournament_completion(
        self,
        tournament_id: str,
        winner_id: str,
        runner_up_id: str,
        prize_distribution: Dict[str, float],
        venue_id: str,
    ) -> None:
        """Record tournament completion statistics."""
        # Update tournament stats
        tournament = self.tournament_stats[tournament_id]
        tournament.prize_distribution = prize_distribution

        # Update winner stats
        winner = self.player_stats[winner_id]
        winner.tournament_wins += 1
        winner.tournament_finals += 1

        # Update runner-up stats
        runner_up = self.player_stats[runner_up_id]
        runner_up.tournament_finals += 1

        # Update venue stats
        self.venue_stats[venue_id]["tournaments_hosted"] += 1
        self.venue_stats[venue_id]["total_prize_money"] += sum(
            prize_distribution.values()
        )
        self.venue_stats[venue_id]["total_matches"] += tournament.total_matches
        self.venue_stats[venue_id]["total_games"] += tournament.total_games

    def get_player_stats(
        self,
        player_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Optional[PlayerStats]:
        """Get player statistics for a specific period."""
        return self.player_stats.get(player_id)

    def get_tournament_stats(self, tournament_id: str) :
        """Get tournament statistics."""
        return self.tournament_stats.get(tournament_id)

    def get_venue_stats(self, venue_id: str) :
        """Get venue statistics."""
        return dict(self.venue_stats[venue_id])

    def get_head_to_head_stats(self, player1_id: str, player2_id: str) :
        """Get head-to-head statistics between two players."""
        player1 = self.player_stats.get(player1_id)
        player2 = self.player_stats.get(player2_id)

        if not player1 or not player2:
            return {}

        return {
            "player1_wins": player1.head_to_head[player2_id]["wins"],
            "player2_wins": player2.head_to_head[player1_id]["wins"],
            "total_matches": (
                player1.head_to_head[player2_id]["wins"]
                + player1.head_to_head[player2_id]["losses"]
            ),
        }

    def get_performance_trends(self, player_id: str, period: timedelta) -> Dict:
        """Get player performance trends over a period."""
        player = self.player_stats.get(player_id)
        if not player:
            return {}

        return {
            "win_percentage": player.win_percentage,
            "tournament_success_rate": (
                player.tournament_wins / player.tournament_finals
                if player.tournament_finals > 0
                else 0.0
            ),
            "average_ppg": player.average_ppg,
            "high_run": player.high_run,
            "perfect_games": player.perfect_games,
        }

    def _initialize_player_stats(self, player_id: str) -> None:
        """Initialize statistics for a new player."""
        self.player_stats[player_id] = PlayerStats(
            head_to_head=defaultdict(lambda: {"wins": 0, "losses": 0}),
            performance_by_tier=defaultdict(lambda: defaultdict(float)),
        )

    def _process_additional_stats(self, tournament_id: str, stats: Dict) :
        """Process additional match statistics."""
        tournament = self.tournament_stats[tournament_id]

        # Update high runs
        if "high_run" in stats:
            high_run = stats["high_run"]
            player_id = stats["high_run_player"]

            if high_run > tournament.high_run:
                tournament.high_run = high_run
                tournament.high_run_player = player_id

            player = self.player_stats[player_id]
            if high_run > player.high_run:
                player.high_run = high_run

        # Update perfect games
        if "perfect_game" in stats and stats["perfect_game"]:
            tournament.perfect_games += 1
            player_id = stats["perfect_game_player"]
            self.player_stats[player_id].perfect_games += 1

        # Update points per game
        if "ppg" in stats:
            player_id = stats["player_id"]
            ppg = stats["ppg"]
            player = self.player_stats[player_id]

            # Calculate running average
            player.average_ppg = (
                player.average_ppg * (player.games_played - 1) + ppg
            ) / player.games_played

        # Record upsets
        if "upset" in stats and stats["upset"]:
            tournament.upsets.append(
                {
                    "round": stats["round"],
                    "winner_seed": stats["winner_seed"],
                    "loser_seed": stats["loser_seed"],
                    "score": stats["score"],
                }
            )
