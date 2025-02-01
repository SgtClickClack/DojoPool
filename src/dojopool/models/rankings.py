from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from typing import Optional, Dict, Any


class PlayerRank(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    rating = models.IntegerField(default=1000)
    rank_tier = models.CharField(max_length=50)  # Bronze, Silver, Gold, etc.
    tier_progress = models.IntegerField(default=0)  # 0-100
    peak_rating = models.IntegerField(default=1000)
    games_played = models.IntegerField(default=0)
    win_streak = models.IntegerField(default=0)
    best_win_streak = models.IntegerField(default=0)
    season_wins = models.IntegerField(default=0)
    season_losses = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username}'s Rank"

    def update_rating(self, new_rating: int) -> None:
        """Update player's rating and related stats"""
        self.rating = new_rating
        if new_rating > self.peak_rating:
            self.peak_rating = new_rating
        self._update_tier()
        self.save()

    def _update_tier(self) -> None:
        """Update player's tier based on rating"""
        if self.rating < 1100:
            self.rank_tier = "Bronze"
            self.tier_progress = (self.rating - 1000) // 2
        elif self.rating < 1300:
            self.rank_tier = "Silver"
            self.tier_progress = (self.rating - 1100) // 4
        elif self.rating < 1600:
            self.rank_tier = "Gold"
            self.tier_progress = (self.rating - 1300) // 6
        elif self.rating < 2000:
            self.rank_tier = "Platinum"
            self.tier_progress = (self.rating - 1600) // 8
        else:
            self.rank_tier = "Diamond"
            self.tier_progress = min(100, (self.rating - 2000) // 10)


class SeasonStats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    season = models.IntegerField()
    games_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    peak_rating = models.IntegerField()
    final_rating = models.IntegerField()
    best_win_streak = models.IntegerField(default=0)
    achievements_earned = models.IntegerField(default=0)
    tournament_wins = models.IntegerField(default=0)
    perfect_games = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "season")

    def __str__(self) -> str:
        return f"{self.user.username}'s Season {self.season} Stats"

    def calculate_win_rate(self) -> float:
        """Calculate win rate percentage"""
        if self.games_played == 0:
            return 0.0
        return (self.wins / self.games_played) * 100


class LeaderboardSnapshot(models.Model):
    season = models.IntegerField()
    snapshot_type = models.CharField(max_length=50)  # daily, weekly, season_end
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.snapshot_type} Leaderboard - Season {self.season}"

    @classmethod
    def create_snapshot(cls, season: int, snapshot_type: str) -> "LeaderboardSnapshot":
        """Create a new leaderboard snapshot"""
        top_players = PlayerRank.objects.all().order_by("-rating")[:100]

        data = {
            "timestamp": timezone.now().isoformat(),
            "rankings": [
                {
                    "username": rank.user.username,
                    "rating": rank.rating,
                    "tier": rank.rank_tier,
                    "games_played": rank.games_played,
                    "win_streak": rank.win_streak,
                }
                for rank in top_players
            ],
        }

        return cls.objects.create(season=season, snapshot_type=snapshot_type, data=data)


class PlayerAnalytics(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avg_shot_accuracy = models.FloatField(default=0.0)
    avg_position_play = models.FloatField(default=0.0)
    avg_shot_difficulty = models.FloatField(default=0.0)
    favorite_game_type = models.CharField(max_length=50, null=True)
    peak_performance_time = models.TimeField(null=True)
    common_opponents = models.JSONField(default=list)
    performance_history = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user.username}'s Analytics"

    def update_stats(self, game_stats: Dict[str, Any]) -> None:
        """Update player's analytics with new game data"""
        # Update rolling averages
        games_played = self.user.playerrank.games_played
        weight = 1 / (games_played + 1)

        self.avg_shot_accuracy = (
            self.avg_shot_accuracy * (1 - weight) + game_stats["accuracy"] * weight
        )

        self.avg_position_play = (
            self.avg_position_play * (1 - weight) + game_stats["position_play"] * weight
        )

        self.avg_shot_difficulty = (
            self.avg_shot_difficulty * (1 - weight) + game_stats["shot_difficulty"] * weight
        )

        # Update performance history
        self.performance_history.append(
            {"timestamp": timezone.now().isoformat(), "stats": game_stats}
        )

        # Keep only last 100 games in history
        if len(self.performance_history) > 100:
            self.performance_history = self.performance_history[-100:]

        self.save()

    def get_performance_trends(self) -> Dict[str, Any]:
        """Calculate performance trends over time"""
        if not self.performance_history:
            return {}

        recent_games = self.performance_history[-10:]
        older_games = self.performance_history[-20:-10]

        if not older_games:
            return {}

        recent_avg = {
            "accuracy": sum(g["stats"]["accuracy"] for g in recent_games) / len(recent_games),
            "position_play": sum(g["stats"]["position_play"] for g in recent_games)
            / len(recent_games),
            "shot_difficulty": sum(g["stats"]["shot_difficulty"] for g in recent_games)
            / len(recent_games),
        }

        older_avg = {
            "accuracy": sum(g["stats"]["accuracy"] for g in older_games) / len(older_games),
            "position_play": sum(g["stats"]["position_play"] for g in older_games)
            / len(older_games),
            "shot_difficulty": sum(g["stats"]["shot_difficulty"] for g in older_games)
            / len(older_games),
        }

        return {
            "accuracy_trend": recent_avg["accuracy"] - older_avg["accuracy"],
            "position_trend": recent_avg["position_play"] - older_avg["position_play"],
            "difficulty_trend": recent_avg["shot_difficulty"] - older_avg["shot_difficulty"],
        }
