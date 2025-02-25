"""
Serializers for DojoPool API
"""

from rest_framework import serializers
from backend.models import Player, Match, Venue, LeaderboardEntry, GameStats

class PlayerSerializer(serializers.ModelSerializer):
    """Serializer for Player model"""
    win_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Player
        fields = [
            'id', 'nickname', 'email', 'skill_level', 'games_played',
            'games_won', 'highest_break', 'current_streak', 'longest_streak',
            'preferred_venue', 'achievements', 'win_rate', 'date_joined'
        ]
        read_only_fields = ['id', 'games_played', 'games_won', 'win_rate']

class VenueSerializer(serializers.ModelSerializer):
    """Serializer for Venue model"""
    is_open = serializers.BooleanField(read_only=True)
    occupancy_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Venue
        fields = [
            'id', 'name', 'description', 'address', 'city', 'state',
            'country', 'postal_code', 'latitude', 'longitude',
            'number_of_tables', 'table_types', 'hourly_rate', 'features',
            'opening_hours', 'contact_info', 'is_active', 'rating',
            'total_matches', 'current_occupancy', 'is_open', 'occupancy_rate'
        ]
        read_only_fields = ['id', 'total_matches', 'rating']

class GameStatsSerializer(serializers.ModelSerializer):
    """Serializer for GameStats model"""
    shot_success_rate = serializers.FloatField(read_only=True)
    difficult_shot_success_rate = serializers.FloatField(read_only=True)
    safety_success_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = GameStats
        fields = [
            'id', 'match', 'total_shots', 'successful_shots', 'missed_shots',
            'difficult_shots_attempted', 'difficult_shots_made',
            'highest_break', 'average_break', 'total_breaks',
            'breaks_over_50', 'breaks_over_100', 'safety_shots_played',
            'successful_safety_shots', 'snookers_escaped', 'snookers_laid',
            'position_success_rate', 'position_difficulty',
            'average_shot_time', 'total_time_at_table',
            'longest_frame_duration', 'shortest_frame_duration',
            'consistency_rating', 'pressure_handling', 'tactical_rating',
            'shot_types', 'positional_routes', 'shot_success_rate',
            'difficult_shot_success_rate', 'safety_success_rate'
        ]
        read_only_fields = ['id']

class MatchSerializer(serializers.ModelSerializer):
    """Serializer for Match model"""
    duration = serializers.IntegerField(read_only=True)
    detailed_stats = GameStatsSerializer(read_only=True)
    player1_details = PlayerSerializer(source='player1', read_only=True)
    player2_details = PlayerSerializer(source='player2', read_only=True)
    winner_details = PlayerSerializer(source='winner', read_only=True)
    venue_details = VenueSerializer(source='venue', read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'player1', 'player2', 'winner', 'venue',
            'match_type', 'status', 'scheduled_time', 'start_time',
            'end_time', 'score', 'stats', 'highlights', 'duration',
            'detailed_stats', 'player1_details', 'player2_details',
            'winner_details', 'venue_details'
        ]
        read_only_fields = [
            'id', 'duration', 'detailed_stats', 'player1_details',
            'player2_details', 'winner_details', 'venue_details'
        ]

class LeaderboardEntrySerializer(serializers.ModelSerializer):
    """Serializer for LeaderboardEntry model"""
    win_rate = serializers.FloatField(read_only=True)
    player_details = PlayerSerializer(source='player', read_only=True)
    venue_details = VenueSerializer(source='venue', read_only=True)
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'player', 'venue', 'timeframe', 'rank', 'points',
            'matches_played', 'matches_won', 'highest_break',
            'win_streak', 'average_score', 'shot_accuracy',
            'average_break', 'period_start', 'period_end',
            'win_rate', 'player_details', 'venue_details'
        ]
        read_only_fields = [
            'id', 'rank', 'win_rate', 'player_details', 'venue_details'
        ] 