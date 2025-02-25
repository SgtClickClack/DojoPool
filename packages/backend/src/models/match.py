"""
Match Model for DojoPool
"""

from django.db import models
import uuid

class Match(models.Model):
    """
    Match model representing a game between two players
    """
    MATCH_TYPES = [
        ('casual', 'Casual Match'),
        ('ranked', 'Ranked Match'),
        ('tournament', 'Tournament Match'),
        ('challenge', 'Challenge Match'),
    ]
    
    MATCH_STATUS = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Players
    player1 = models.ForeignKey(
        'Player',
        on_delete=models.PROTECT,
        related_name='matches_as_player1'
    )
    player2 = models.ForeignKey(
        'Player',
        on_delete=models.PROTECT,
        related_name='matches_as_player2'
    )
    winner = models.ForeignKey(
        'Player',
        on_delete=models.PROTECT,
        related_name='matches_won',
        null=True,
        blank=True
    )
    
    # Match details
    venue = models.ForeignKey(
        'Venue',
        on_delete=models.PROTECT,
        related_name='matches'
    )
    match_type = models.CharField(max_length=20, choices=MATCH_TYPES)
    status = models.CharField(
        max_length=20,
        choices=MATCH_STATUS,
        default='scheduled'
    )
    scheduled_time = models.DateTimeField()
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    # Score and statistics
    score = models.JSONField(default=dict)  # Detailed score information
    stats = models.JSONField(default=dict)  # Match statistics
    highlights = models.JSONField(default=list)  # Key moments/highlights
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_time']
        indexes = [
            models.Index(fields=['-scheduled_time']),
            models.Index(fields=['status']),
            models.Index(fields=['match_type']),
        ]
    
    def __str__(self):
        return f"{self.player1} vs {self.player2} ({self.scheduled_time.date()})"
    
    @property
    def duration(self):
        """Calculate match duration in minutes"""
        if self.start_time and self.end_time:
            duration = self.end_time - self.start_time
            return round(duration.total_seconds() / 60)
        return None
    
    def start_match(self):
        """Start the match"""
        from django.utils import timezone
        
        if self.status == 'scheduled':
            self.status = 'in_progress'
            self.start_time = timezone.now()
            self.save()
            
            # Initialize match statistics
            self.stats = {
                'player1': {
                    'breaks': [],
                    'shots_taken': 0,
                    'shots_made': 0,
                },
                'player2': {
                    'breaks': [],
                    'shots_taken': 0,
                    'shots_made': 0,
                }
            }
            self.save()
    
    def end_match(self, winner_id: uuid.UUID, final_score: dict):
        """
        End the match and update statistics
        
        Args:
            winner_id (UUID): ID of the winning player
            final_score (dict): Final score details
        """
        from django.utils import timezone
        
        if self.status == 'in_progress':
            self.status = 'completed'
            self.end_time = timezone.now()
            self.winner_id = winner_id
            self.score = final_score
            self.save()
            
            # Update player statistics
            winner = self.player1 if self.player1.id == winner_id else self.player2
            loser = self.player2 if self.player1.id == winner_id else self.player1
            
            # Calculate highest break
            winner_breaks = self.stats['player1' if winner == self.player1 else 'player2']['breaks']
            highest_break = max(winner_breaks) if winner_breaks else 0
            
            # Update player stats
            winner.update_stats(game_won=True, break_score=highest_break)
            loser.update_stats(game_won=False)
            
            # Update venue match count
            self.venue.total_matches += 1
            self.venue.save()
    
    def add_shot(self, player_id: uuid.UUID, made: bool):
        """
        Record a shot attempt
        
        Args:
            player_id (UUID): ID of the player making the shot
            made (bool): Whether the shot was successful
        """
        player_key = 'player1' if self.player1.id == player_id else 'player2'
        
        self.stats[player_key]['shots_taken'] += 1
        if made:
            self.stats[player_key]['shots_made'] += 1
        self.save()
    
    def add_break(self, player_id: uuid.UUID, break_score: int):
        """
        Record a break
        
        Args:
            player_id (UUID): ID of the player making the break
            break_score (int): Points scored in the break
        """
        player_key = 'player1' if self.player1.id == player_id else 'player2'
        self.stats[player_key]['breaks'].append(break_score)
        self.save()
    
    def add_highlight(self, description: str, timestamp: str = None):
        """
        Add a highlight/key moment
        
        Args:
            description (str): Description of the highlight
            timestamp (str, optional): Timestamp of the highlight
        """
        if not self.highlights:
            self.highlights = []
        
        highlight = {
            'description': description,
            'timestamp': timestamp or str(models.DateTimeField(auto_now_add=True))
        }
        self.highlights.append(highlight)
        self.save() 