"""
Venue Model for DojoPool
"""

from django.db import models
from django.core.validators import MinValueValidator
import uuid

class Venue(models.Model):
    """
    Venue model representing pool halls and locations
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    postal_code = models.CharField(max_length=20)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Venue details
    number_of_tables = models.IntegerField(validators=[MinValueValidator(1)])
    table_types = models.JSONField(default=list)  # List of table types and their counts
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2)
    features = models.JSONField(default=list)  # List of venue features/amenities
    opening_hours = models.JSONField(default=dict)  # Operating hours by day
    contact_info = models.JSONField(default=dict)  # Contact details
    
    # Venue status and metrics
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=5.00
    )
    total_matches = models.IntegerField(default=0)
    current_occupancy = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-rating', 'name']
        indexes = [
            models.Index(fields=['-rating']),
            models.Index(fields=['name']),
            models.Index(fields=['city', 'state']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.city}, {self.state})"
    
    @property
    def is_open(self):
        """Check if venue is currently open based on operating hours"""
        from datetime import datetime
        current_time = datetime.now()
        day_of_week = current_time.strftime('%A').lower()
        
        if day_of_week in self.opening_hours:
            hours = self.opening_hours[day_of_week]
            current_hour = current_time.hour
            return hours['open'] <= current_hour < hours['close']
        return False
    
    @property
    def occupancy_rate(self):
        """Calculate current occupancy rate as percentage"""
        if self.number_of_tables == 0:
            return 0
        return round((self.current_occupancy / self.number_of_tables) * 100, 2)
    
    def update_occupancy(self, tables_in_use: int):
        """
        Update current occupancy
        
        Args:
            tables_in_use (int): Number of tables currently in use
        """
        self.current_occupancy = min(tables_in_use, self.number_of_tables)
        self.save()
    
    def update_rating(self, new_rating: float):
        """
        Update venue rating
        
        Args:
            new_rating (float): New rating value (0-5)
        """
        self.rating = max(0, min(5, new_rating))
        self.save()
    
    def add_feature(self, feature: str):
        """
        Add a new feature to the venue
        
        Args:
            feature (str): Feature to add
        """
        if not self.features:
            self.features = []
        
        if feature not in self.features:
            self.features.append(feature)
            self.save()
    
    def update_table_types(self, table_type: str, count: int):
        """
        Update table type counts
        
        Args:
            table_type (str): Type of table
            count (int): Number of tables of this type
        """
        if not self.table_types:
            self.table_types = []
        
        # Update or add table type
        updated = False
        for table in self.table_types:
            if table['type'] == table_type:
                table['count'] = count
                updated = True
                break
        
        if not updated:
            self.table_types.append({
                'type': table_type,
                'count': count
            })
        
        # Update total number of tables
        self.number_of_tables = sum(table['count'] for table in self.table_types)
        self.save() 