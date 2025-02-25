"""
Game Statistics Model for DojoPool
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class GameStats(models.Model):
    """
    GameStats model for tracking detailed game statistics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match = models.OneToOneField(
        'Match',
        on_delete=models.CASCADE,
        related_name='detailed_stats'
    )
    
    # Shot statistics
    total_shots = models.IntegerField(default=0)
    successful_shots = models.IntegerField(default=0)
    missed_shots = models.IntegerField(default=0)
    difficult_shots_attempted = models.IntegerField(default=0)
    difficult_shots_made = models.IntegerField(default=0)
    
    # Break statistics
    highest_break = models.IntegerField(default=0)
    average_break = models.FloatField(default=0.0)
    total_breaks = models.IntegerField(default=0)
    breaks_over_50 = models.IntegerField(default=0)
    breaks_over_100 = models.IntegerField(default=0)
    
    # Safety play
    safety_shots_played = models.IntegerField(default=0)
    successful_safety_shots = models.IntegerField(default=0)
    snookers_escaped = models.IntegerField(default=0)
    snookers_laid = models.IntegerField(default=0)
    
    # Positional play
    position_success_rate = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0
    )
    position_difficulty = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        default=5
    )
    
    # Time statistics
    average_shot_time = models.FloatField(default=0.0)  # in seconds
    total_time_at_table = models.IntegerField(default=0)  # in seconds
    longest_frame_duration = models.IntegerField(default=0)  # in seconds
    shortest_frame_duration = models.IntegerField(default=0)  # in seconds
    
    # Advanced metrics
    consistency_rating = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=50
    )
    pressure_handling = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=50
    )
    tactical_rating = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=50
    )
    
    # Shot types
    shot_types = models.JSONField(default=dict)  # Different types of shots played
    positional_routes = models.JSONField(default=dict)  # Positional patterns used
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Game Statistics"
        verbose_name_plural = "Game Statistics"
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['-highest_break']),
        ]
    
    def __str__(self):
        return f"Stats for {self.match}"
    
    @property
    def shot_success_rate(self):
        """Calculate shot success rate percentage"""
        if self.total_shots == 0:
            return 0
        return round((self.successful_shots / self.total_shots) * 100, 2)
    
    @property
    def difficult_shot_success_rate(self):
        """Calculate success rate for difficult shots"""
        if self.difficult_shots_attempted == 0:
            return 0
        return round((self.difficult_shots_made / self.difficult_shots_attempted) * 100, 2)
    
    @property
    def safety_success_rate(self):
        """Calculate safety play success rate"""
        if self.safety_shots_played == 0:
            return 0
        return round((self.successful_safety_shots / self.safety_shots_played) * 100, 2)
    
    def record_shot(self, shot_type: str, successful: bool, difficulty: float = None):
        """
        Record a shot attempt
        
        Args:
            shot_type (str): Type of shot attempted
            successful (bool): Whether the shot was successful
            difficulty (float, optional): Shot difficulty rating (0-10)
        """
        self.total_shots += 1
        if successful:
            self.successful_shots += 1
        else:
            self.missed_shots += 1
        
        # Track shot types
        if not self.shot_types:
            self.shot_types = {}
        
        if shot_type not in self.shot_types:
            self.shot_types[shot_type] = {
                'attempted': 0,
                'successful': 0,
                'total_difficulty': 0,
            }
        
        self.shot_types[shot_type]['attempted'] += 1
        if successful:
            self.shot_types[shot_type]['successful'] += 1
        
        if difficulty is not None:
            self.shot_types[shot_type]['total_difficulty'] += difficulty
            
            if difficulty >= 7:  # Consider shots with difficulty >= 7 as difficult
                self.difficult_shots_attempted += 1
                if successful:
                    self.difficult_shots_made += 1
        
        self.save()
    
    def record_break(self, points: int):
        """
        Record a break
        
        Args:
            points (int): Points scored in the break
        """
        self.total_breaks += 1
        self.highest_break = max(self.highest_break, points)
        
        # Update average break
        self.average_break = (
            (self.average_break * (self.total_breaks - 1) + points)
            / self.total_breaks
        )
        
        # Track break milestones
        if points >= 50:
            self.breaks_over_50 += 1
        if points >= 100:
            self.breaks_over_100 += 1
        
        self.save()
    
    def record_safety_shot(self, successful: bool, snooker_laid: bool = False):
        """
        Record a safety shot
        
        Args:
            successful (bool): Whether the safety shot was successful
            snooker_laid (bool): Whether a snooker was successfully laid
        """
        self.safety_shots_played += 1
        if successful:
            self.successful_safety_shots += 1
        if snooker_laid:
            self.snookers_laid += 1
        self.save()
    
    def record_position_play(self, success_rate: float, difficulty: float):
        """
        Record positional play statistics
        
        Args:
            success_rate (float): Success rate of positional play (0-100)
            difficulty (float): Difficulty of position attempted (0-10)
        """
        # Update rolling average of position success rate
        self.position_success_rate = (
            (self.position_success_rate + success_rate) / 2
        )
        
        # Update position difficulty as rolling average
        self.position_difficulty = (
            (self.position_difficulty + difficulty) / 2
        )
        
        self.save()
    
    def update_advanced_metrics(self):
        """Update advanced performance metrics"""
        # Calculate consistency rating
        shot_consistency = self.shot_success_rate
        position_consistency = self.position_success_rate
        safety_consistency = self.safety_success_rate
        
        self.consistency_rating = (
            shot_consistency * 0.4 +
            position_consistency * 0.4 +
            safety_consistency * 0.2
        )
        
        # Calculate pressure handling
        difficult_shots_rating = self.difficult_shot_success_rate
        break_building_rating = (self.breaks_over_50 * 2 + self.breaks_over_100 * 3) / max(self.total_breaks, 1) * 100
        snooker_escape_rate = (self.snookers_escaped / max(self.snookers_laid, 1)) * 100
        
        self.pressure_handling = (
            difficult_shots_rating * 0.4 +
            break_building_rating * 0.4 +
            snooker_escape_rate * 0.2
        )
        
        # Calculate tactical rating
        safety_rating = self.safety_success_rate
        snooker_efficiency = (self.snookers_laid / max(self.safety_shots_played, 1)) * 100
        shot_selection = self.shot_success_rate
        
        self.tactical_rating = (
            safety_rating * 0.4 +
            snooker_efficiency * 0.3 +
            shot_selection * 0.3
        )
        
        self.save() 