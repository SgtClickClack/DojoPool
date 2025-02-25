"""
Player Model for DojoPool
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
import uuid

class Player(AbstractUser):
    """
    Player model extending Django's AbstractUser to include pool-specific attributes
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nickname = models.CharField(max_length=50, unique=True)
    skill_level = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=1000  # Starting ELO rating
    )
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    highest_break = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    preferred_venue = models.ForeignKey(
        'Venue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='regular_players'
    )
    achievements = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-skill_level', '-games_won']
        indexes = [
            models.Index(fields=['-skill_level']),
            models.Index(fields=['-games_won']),
            models.Index(fields=['nickname']),
        ]
    
    def __str__(self):
        return f"{self.nickname} (Rating: {self.skill_level})"
    
    @property
    def win_rate(self):
        """Calculate win rate percentage"""
        if self.games_played == 0:
            return 0
        return round((self.games_won / self.games_played) * 100, 2)
    
    def update_stats(self, game_won: bool, break_score: int = 0):
        """
        Update player statistics after a game
        
        Args:
            game_won (bool): Whether the player won the game
            break_score (int): Highest break score in the game
        """
        self.games_played += 1
        if game_won:
            self.games_won += 1
            self.current_streak = max(0, self.current_streak + 1)
            self.longest_streak = max(self.longest_streak, self.current_streak)
        else:
            self.current_streak = min(0, self.current_streak - 1)
        
        self.highest_break = max(self.highest_break, break_score)
        self.save()
    
    def update_skill_level(self, points_change: int):
        """
        Update player's skill level (ELO rating)
        
        Args:
            points_change (int): Points to add/subtract from skill level
        """
        self.skill_level = max(0, self.skill_level + points_change)
        self.save()
    
    def add_achievement(self, achievement_id: str, achievement_data: dict):
        """
        Add a new achievement for the player
        
        Args:
            achievement_id (str): Unique identifier for the achievement
            achievement_data (dict): Achievement details including name, description, etc.
        """
        if not self.achievements:
            self.achievements = {}
        
        self.achievements[achievement_id] = {
            **achievement_data,
            'unlocked_at': str(models.DateTimeField(auto_now_add=True))
        }
        self.save() 