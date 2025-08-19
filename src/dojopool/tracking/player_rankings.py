"""Player rankings and performance tracking system."""

from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import numpy as np
from enum import Enum
import logging
from .game_tracker import Shot
from .shot_difficulty import ShotDifficultyCalculator
from .player_analytics import PlayerAnalytics

logger = logging.getLogger(__name__)


class SkillLevel(Enum):
    """Player skill levels."""

    NOVICE = 1
    BEGINNER = 2
    INTERMEDIATE = 3
    ADVANCED = 4
    EXPERT = 5
    MASTER = 6
    PROFESSIONAL = 7


@dataclass
class PlayerStats:
    """Player statistics."""

    total_games: int = 0
    games_won: int = 0
    total_matches: int = 0
    matches_won: int = 0
    total_shots: int = 0
    successful_shots: int = 0
    avg_shot_difficulty: float = 0.0
    highest_run: int = 0
    tournaments_played: int = 0
    tournaments_won: int = 0
    skill_level: SkillLevel = SkillLevel.NOVICE
    elo_rating: float = 1200.0
    ranking_points: float = 0.0
    last_active: datetime = field(default_factory=datetime.now)


@dataclass
class MatchResult:
    """Match result details."""

    match_id: str
    winner_id: str
    loser_id: str
    winner_score: int
    loser_score: int
    game_type: str
    timestamp: datetime
    shots: List[Shot]
    duration: timedelta
    tournament_id: Optional[str] = None


@dataclass
class RankingEntry:
    """Player ranking entry."""

    player_id: str
    rank: int
    points: float
    skill_level: SkillLevel
    trend: int  # Position change
    last_updated: datetime


class PlayerRankingSystem:
    """Track and manage player rankings."""

    def __init__(self) -> None:
        """Initialize ranking system."""
        self.difficulty_calculator = ShotDifficultyCalculator()
        self.player_analytics = PlayerAnalytics()

        # Rankings parameters
        self.k_factor = 32  # ELO K-factor
        self.decay_rate = 0.1  # Monthly rating decay
        self.inactivity_threshold = timedelta(days=30)
        self.provisional_games = 10  # Games needed for non-provisional rating

        # Skill level thresholds
        self.skill_thresholds = {
            SkillLevel.NOVICE: 0,
            SkillLevel.BEGINNER: 1200,
            SkillLevel.INTERMEDIATE: 1400,
            SkillLevel.ADVANCED: 1600,
            SkillLevel.EXPERT: 1800,
            SkillLevel.MASTER: 2000,
            SkillLevel.PROFESSIONAL: 2200,
        }

        # Storage
        self._player_stats: Dict[str, PlayerStats] = {}
        self._match_history: List[MatchResult] = []
        self._current_rankings: List[RankingEntry] = []
        self._provisional_players: Set[str] = set()

    def record_match(self, result: MatchResult) -> None:
        """Record a match result and update rankings."""
        # Initialize players if needed
        for player_id in (result.winner_id, result.loser_id):
            if player_id not in self._player_stats:
                self._player_stats[player_id] = PlayerStats()
                self._provisional_players.add(player_id)

        # Update match statistics
        winner_stats = self._player_stats[result.winner_id]
        loser_stats = self._player_stats[result.loser_id]

        winner_stats.total_matches += 1
        winner_stats.matches_won += 1
        winner_stats.total_games += result.winner_score
        winner_stats.games_won += result.winner_score
        winner_stats.last_active = result.timestamp

        loser_stats.total_matches += 1
        loser_stats.total_games += result.loser_score
        loser_stats.last_active = result.timestamp

        # Update shot statistics
        self._update_shot_stats(result)

        # Update ELO ratings
        self._update_elo_ratings(result)

        # Update ranking points
        self._update_ranking_points(result)

        # Check for skill level changes
        self._update_skill_levels(result.winner_id)
        self._update_skill_levels(result.loser_id)

        # Store match result
        self._match_history.append(result)

        # Update rankings
        self._update_rankings()

        # Check provisional status
        for player_id in (result.winner_id, result.loser_id):
            if (
                player_id in self._provisional_players
                and self._player_stats[player_id].total_matches >= self.provisional_games
            ):
                self._provisional_players.remove(player_id)

    def _update_shot_stats(self, result: MatchResult) -> None:
        """Update shot statistics from match."""
        # Group shots by player
        player_shots: Dict[str, List[Shot]] = {result.winner_id: [], result.loser_id: []}

        for shot in result.shots:
            # Determine shot owner (simplified)
            player_id = result.winner_id if shot.is_valid else result.loser_id
            player_shots[player_id].append(shot)

        # Update stats for each player
        for player_id, shots in player_shots.items():
            stats = self._player_stats[player_id]
            stats.total_shots += len(shots)
            stats.successful_shots += sum(1 for s in shots if s.pocketed_balls)

            # Calculate average difficulty
            difficulties = []
            for shot in shots:
                if score := self.difficulty_calculator.calculate_score(shot):
                    difficulties.append(score.total_score)

            if difficulties:
                stats.avg_shot_difficulty = np.mean(difficulties)

            # Update highest run
            current_run = 0
            max_run = 0
            for shot in shots:
                if shot.pocketed_balls:
                    current_run += 1
                    max_run = max(max_run, current_run)
                else:
                    current_run = 0
            stats.highest_run = max(stats.highest_run, max_run)

    def _update_elo_ratings(self, result: MatchResult) -> None:
        """Update ELO ratings based on match result."""
        winner_stats = self._player_stats[result.winner_id]
        loser_stats = self._player_stats[result.loser_id]

        # Calculate expected scores
        rating_diff = winner_stats.elo_rating - loser_stats.elo_rating
        expected_winner = 1 / (1 + 10 ** (-rating_diff / 400))
        expected_loser = 1 - expected_winner

        # Calculate actual scores (weighted by game score difference)
        score_diff = result.winner_score - result.loser_score
        total_games = result.winner_score + result.loser_score
        actual_winner = 0.5 + (score_diff / (2 * total_games))
        actual_loser = 1 - actual_winner

        # Calculate K-factor adjustments
        k_winner = self.k_factor
        k_loser = self.k_factor

        if result.winner_id in self._provisional_players:
            k_winner *= 2
        if result.loser_id in self._provisional_players:
            k_loser *= 2

        # Update ratings
        winner_stats.elo_rating += k_winner * (actual_winner - expected_winner)
        loser_stats.elo_rating += k_loser * (actual_loser - expected_loser)

    def _update_ranking_points(self, result: MatchResult) -> None:
        """Update ranking points based on match result."""
        winner_stats = self._player_stats[result.winner_id]
        loser_stats = self._player_stats[result.loser_id]

        # Base points for winning/losing
        base_points = 10

        # Adjust points based on opponent's skill level
        skill_diff = loser_stats.skill_level.value - winner_stats.skill_level.value
        skill_multiplier = 1 + (skill_diff * 0.1)  # 10% bonus per skill level difference

        # Adjust for game score
        score_multiplier = result.winner_score / (result.winner_score + result.loser_score)

        # Tournament bonus
        tournament_multiplier = 2.0 if result.tournament_id else 1.0

        # Calculate final points
        points = base_points * skill_multiplier * score_multiplier * tournament_multiplier

        # Update points
        winner_stats.ranking_points += points
        loser_stats.ranking_points = max(0, loser_stats.ranking_points - points * 0.5)

    def _update_skill_levels(self, player_id: str) -> None:
        """Update player skill level based on rating."""
        stats = self._player_stats[player_id]

        # Find appropriate skill level
        new_level = SkillLevel.NOVICE
        for level, threshold in self.skill_thresholds.items():
            if stats.elo_rating >= threshold:
                new_level = level

        stats.skill_level = new_level

    def _update_rankings(self) -> None:
        """Update global rankings."""
        # Sort players by ranking points
        ranked_players = sorted(
            self._player_stats.items(), key=lambda x: x[1].ranking_points, reverse=True
        )

        # Create new ranking entries
        new_rankings = []
        old_ranks = {entry.player_id: entry.rank for entry in self._current_rankings}

        for rank, (player_id, stats) in enumerate(ranked_players, 1):
            old_rank = old_ranks.get(player_id, rank)
            trend = old_rank - rank

            new_rankings.append(
                RankingEntry(
                    player_id=player_id,
                    rank=rank,
                    points=stats.ranking_points,
                    skill_level=stats.skill_level,
                    trend=trend,
                    last_updated=datetime.now(),
                )
            )

        self._current_rankings = new_rankings

    def apply_rating_decay(self) -> None:
        """Apply rating decay for inactive players."""
        now = datetime.now()

        for stats in self._player_stats.values():
            if now - stats.last_active > self.inactivity_threshold:
                # Calculate months of inactivity
                months_inactive = (now - stats.last_active).days / 30

                # Apply decay
                decay = self.decay_rate * months_inactive
                stats.elo_rating = max(
                    self.skill_thresholds[SkillLevel.NOVICE], stats.elo_rating * (1 - decay)
                )
                stats.ranking_points *= 1 - decay

                # Update skill level
                self._update_skill_levels(stats.player_id)

    def get_rankings(
        self, skill_level: Optional[SkillLevel] = None, top_n: Optional[int] = None
    ) -> List[RankingEntry]:
        """Get current rankings, optionally filtered."""
        rankings = self._current_rankings

        if skill_level:
            rankings = [entry for entry in rankings if entry.skill_level == skill_level]

        if top_n:
            rankings = rankings[:top_n]

        return rankings

    def get_player_stats(self, player_id: str) -> Optional[PlayerStats]:
        """Get statistics for a player."""
        return self._player_stats.get(player_id)

    def get_match_history(
        self,
        player_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[MatchResult]:
        """Get match history, optionally filtered."""
        matches = self._match_history

        if player_id:
            matches = [m for m in matches if player_id in (m.winner_id, m.loser_id)]

        if start_date:
            matches = [m for m in matches if m.timestamp >= start_date]

        if end_date:
            matches = [m for m in matches if m.timestamp <= end_date]

        return matches

    def get_head_to_head(self, player1_id: str, player2_id: str) -> Dict[str, Any]:
        """Get head-to-head statistics for two players."""
        matches = [
            m
            for m in self._match_history
            if (m.winner_id in (player1_id, player2_id) and m.loser_id in (player1_id, player2_id))
        ]

        player1_wins = sum(1 for m in matches if m.winner_id == player1_id)
        player2_wins = len(matches) - player1_wins

        return {
            "total_matches": len(matches),
            "player1_wins": player1_wins,
            "player2_wins": player2_wins,
            "matches": matches,
        }
