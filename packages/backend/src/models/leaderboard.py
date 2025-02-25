"""
Leaderboard Model for DojoPool
"""

from django.db import models
from django.core.validators import MinValueValidator
import uuid

class LeaderboardEntry(models.Model):
    """
    LeaderboardEntry model for tracking player rankings
    """
    TIMEFRAMES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('all_time', 'All Time'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    player = models.ForeignKey(
        'Player',
        on_delete=models.CASCADE,
        related_name='leaderboard_entries'
    )
    venue = models.ForeignKey(
        'Venue',
        on_delete=models.CASCADE,
        related_name='leaderboard_entries',
        null=True,
        blank=True
    )
    timeframe = models.CharField(max_length=20, choices=TIMEFRAMES)
    rank = models.IntegerField(validators=[MinValueValidator(1)])
    points = models.IntegerField(default=1000)
    matches_played = models.IntegerField(default=0)
    matches_won = models.IntegerField(default=0)
    highest_break = models.IntegerField(default=0)
    win_streak = models.IntegerField(default=0)
    
    # Performance metrics
    average_score = models.FloatField(default=0.0)
    shot_accuracy = models.FloatField(default=0.0)
    average_break = models.FloatField(default=0.0)
    
    # Timestamps
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['timeframe', 'rank']
        indexes = [
            models.Index(fields=['timeframe', 'rank']),
            models.Index(fields=['period_start', 'period_end']),
        ]
        unique_together = [
            ('player', 'venue', 'timeframe', 'period_start'),
        ]
    
    def __str__(self):
        venue_name = self.venue.name if self.venue else "Global"
        return f"#{self.rank} {self.player.nickname} - {venue_name} ({self.timeframe})"
    
    @property
    def win_rate(self):
        """Calculate win rate percentage"""
        if self.matches_played == 0:
            return 0
        return round((self.matches_won / self.matches_played) * 100, 2)
    
    def update_stats(self, match_result: dict):
        """
        Update entry statistics based on match result
        
        Args:
            match_result (dict): Match result data including:
                - won (bool): Whether the player won
                - points_change (int): Change in ranking points
                - break_score (int): Highest break in the match
                - shot_accuracy (float): Shot accuracy in the match
                - average_score (float): Average score in the match
        """
        # Update match counts
        self.matches_played += 1
        if match_result.get('won', False):
            self.matches_won += 1
            self.win_streak = max(0, self.win_streak + 1)
        else:
            self.win_streak = 0
        
        # Update points
        points_change = match_result.get('points_change', 0)
        self.points = max(0, self.points + points_change)
        
        # Update performance metrics
        self.highest_break = max(self.highest_break, match_result.get('break_score', 0))
        
        # Update rolling averages
        new_accuracy = match_result.get('shot_accuracy', 0)
        new_score = match_result.get('average_score', 0)
        
        self.shot_accuracy = (
            (self.shot_accuracy * (self.matches_played - 1) + new_accuracy)
            / self.matches_played
        )
        
        self.average_score = (
            (self.average_score * (self.matches_played - 1) + new_score)
            / self.matches_played
        )
        
        self.save()
    
    @classmethod
    def create_period(cls, timeframe: str, start_date: models.DateTimeField, end_date: models.DateTimeField):
        """
        Create new leaderboard entries for a new period
        
        Args:
            timeframe (str): Type of leaderboard period
            start_date (DateTimeField): Period start date
            end_date (DateTimeField): Period end date
        """
        from .player import Player
        
        # Get all active players
        players = Player.objects.filter(is_active=True)
        
        # Create entries for each player
        entries = []
        for rank, player in enumerate(players.order_by('-skill_level'), 1):
            entry = cls(
                player=player,
                timeframe=timeframe,
                rank=rank,
                points=player.skill_level,
                period_start=start_date,
                period_end=end_date
            )
            entries.append(entry)
        
        # Bulk create entries
        cls.objects.bulk_create(entries)
    
    @classmethod
    def update_rankings(cls, timeframe: str, venue=None):
        """
        Update rankings for a specific timeframe and venue
        
        Args:
            timeframe (str): Leaderboard timeframe
            venue (Venue, optional): Specific venue to update rankings for
        """
        # Get current entries
        entries = cls.objects.filter(
            timeframe=timeframe,
            venue=venue
        ).select_related('player').order_by('-points')
        
        # Update ranks
        for rank, entry in enumerate(entries, 1):
            if entry.rank != rank:
                entry.rank = rank
                entry.save() 