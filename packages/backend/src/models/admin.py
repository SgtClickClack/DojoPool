"""
Admin interface configuration for DojoPool models
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .player import Player
from .match import Match
from .venue import Venue
from .leaderboard import LeaderboardEntry
from .game_stats import GameStats

@admin.register(Player)
class PlayerAdmin(UserAdmin):
    """Admin interface for Player model"""
    list_display = ('nickname', 'email', 'skill_level', 'games_played', 'games_won', 'win_rate')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('nickname', 'email', 'first_name', 'last_name')
    ordering = ('-skill_level',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Pool Statistics', {
            'fields': (
                'nickname',
                'skill_level',
                'games_played',
                'games_won',
                'highest_break',
                'current_streak',
                'longest_streak',
                'preferred_venue',
                'achievements',
            )
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Pool Statistics', {
            'fields': ('nickname',)
        }),
    )

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    """Admin interface for Venue model"""
    list_display = ('name', 'city', 'state', 'number_of_tables', 'rating', 'is_active')
    list_filter = ('is_active', 'city', 'state')
    search_fields = ('name', 'city', 'state', 'country')
    ordering = ('-rating', 'name')
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'name',
                'description',
                'address',
                'city',
                'state',
                'country',
                'postal_code',
                ('latitude', 'longitude'),
            )
        }),
        ('Venue Details', {
            'fields': (
                'number_of_tables',
                'table_types',
                'hourly_rate',
                'features',
                'opening_hours',
                'contact_info',
            )
        }),
        ('Status & Metrics', {
            'fields': (
                'is_active',
                'rating',
                'total_matches',
                'current_occupancy',
            )
        }),
    )

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    """Admin interface for Match model"""
    list_display = ('__str__', 'match_type', 'status', 'scheduled_time', 'venue')
    list_filter = ('status', 'match_type', 'venue')
    search_fields = ('player1__nickname', 'player2__nickname', 'venue__name')
    ordering = ('-scheduled_time',)
    
    fieldsets = (
        ('Players', {
            'fields': (
                'player1',
                'player2',
                'winner',
            )
        }),
        ('Match Details', {
            'fields': (
                'venue',
                'match_type',
                'status',
                'scheduled_time',
                'start_time',
                'end_time',
            )
        }),
        ('Score & Statistics', {
            'fields': (
                'score',
                'stats',
                'highlights',
            )
        }),
    )

@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    """Admin interface for LeaderboardEntry model"""
    list_display = ('player', 'timeframe', 'rank', 'points', 'matches_won', 'win_rate')
    list_filter = ('timeframe', 'venue')
    search_fields = ('player__nickname', 'venue__name')
    ordering = ('timeframe', 'rank')
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'player',
                'venue',
                'timeframe',
                'rank',
                'points',
            )
        }),
        ('Statistics', {
            'fields': (
                'matches_played',
                'matches_won',
                'highest_break',
                'win_streak',
                'average_score',
                'shot_accuracy',
                'average_break',
            )
        }),
        ('Period', {
            'fields': (
                'period_start',
                'period_end',
            )
        }),
    )

@admin.register(GameStats)
class GameStatsAdmin(admin.ModelAdmin):
    """Admin interface for GameStats model"""
    list_display = ('match', 'total_shots', 'highest_break', 'shot_success_rate')
    list_filter = ('created_at',)
    search_fields = ('match__player1__nickname', 'match__player2__nickname')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Match Information', {
            'fields': ('match',)
        }),
        ('Shot Statistics', {
            'fields': (
                'total_shots',
                'successful_shots',
                'missed_shots',
                'difficult_shots_attempted',
                'difficult_shots_made',
            )
        }),
        ('Break Statistics', {
            'fields': (
                'highest_break',
                'average_break',
                'total_breaks',
                'breaks_over_50',
                'breaks_over_100',
            )
        }),
        ('Safety Play', {
            'fields': (
                'safety_shots_played',
                'successful_safety_shots',
                'snookers_escaped',
                'snookers_laid',
            )
        }),
        ('Positional Play', {
            'fields': (
                'position_success_rate',
                'position_difficulty',
            )
        }),
        ('Time Statistics', {
            'fields': (
                'average_shot_time',
                'total_time_at_table',
                'longest_frame_duration',
                'shortest_frame_duration',
            )
        }),
        ('Advanced Metrics', {
            'fields': (
                'consistency_rating',
                'pressure_handling',
                'tactical_rating',
            )
        }),
        ('Detailed Statistics', {
            'fields': (
                'shot_types',
                'positional_routes',
            )
        }),
    ) 