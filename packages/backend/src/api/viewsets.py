"""
ViewSets for DojoPool API
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from backend.models import Player, Match, Venue, LeaderboardEntry, GameStats
from .serializers import (
    PlayerSerializer, MatchSerializer, VenueSerializer,
    LeaderboardEntrySerializer, GameStatsSerializer
)

class PlayerViewSet(viewsets.ModelViewSet):
    """ViewSet for Player model"""
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nickname', 'email']
    ordering_fields = ['skill_level', 'games_won', 'highest_break']
    ordering = ['-skill_level']

    @action(detail=True, methods=['post'])
    def update_achievements(self, request, pk=None):
        """Add new achievements to player"""
        player = self.get_object()
        achievements = request.data.get('achievements', {})
        
        for achievement_id, data in achievements.items():
            player.add_achievement(achievement_id, data)
        
        return Response(self.get_serializer(player).data)

class VenueViewSet(viewsets.ModelViewSet):
    """ViewSet for Venue model"""
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'city', 'state']
    ordering_fields = ['rating', 'name', 'total_matches']
    ordering = ['-rating']

    @action(detail=True, methods=['post'])
    def update_occupancy(self, request, pk=None):
        """Update venue occupancy"""
        venue = self.get_object()
        tables_in_use = request.data.get('tables_in_use', 0)
        venue.update_occupancy(tables_in_use)
        return Response(self.get_serializer(venue).data)

    @action(detail=True, methods=['get'])
    def active_matches(self, request, pk=None):
        """Get active matches at venue"""
        venue = self.get_object()
        matches = Match.objects.filter(
            venue=venue,
            status='in_progress'
        )
        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)

class MatchViewSet(viewsets.ModelViewSet):
    """ViewSet for Match model"""
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['player1__nickname', 'player2__nickname', 'venue__name']
    ordering_fields = ['scheduled_time', 'status']
    ordering = ['-scheduled_time']

    @action(detail=True, methods=['post'])
    def start_match(self, request, pk=None):
        """Start a match"""
        match = self.get_object()
        match.start_match()
        return Response(self.get_serializer(match).data)

    @action(detail=True, methods=['post'])
    def end_match(self, request, pk=None):
        """End a match"""
        match = self.get_object()
        winner_id = request.data.get('winner_id')
        final_score = request.data.get('final_score', {})
        
        match.end_match(winner_id, final_score)
        return Response(self.get_serializer(match).data)

    @action(detail=True, methods=['post'])
    def record_shot(self, request, pk=None):
        """Record a shot in the match"""
        match = self.get_object()
        player_id = request.data.get('player_id')
        made = request.data.get('made', False)
        
        match.add_shot(player_id, made)
        return Response(self.get_serializer(match).data)

class LeaderboardViewSet(viewsets.ModelViewSet):
    """ViewSet for LeaderboardEntry model"""
    queryset = LeaderboardEntry.objects.all()
    serializer_class = LeaderboardEntrySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['player__nickname', 'venue__name']
    ordering_fields = ['rank', 'points', 'matches_won']
    ordering = ['timeframe', 'rank']

    @action(detail=False, methods=['post'])
    def create_period(self, request):
        """Create new leaderboard period"""
        timeframe = request.data.get('timeframe')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        LeaderboardEntry.create_period(timeframe, start_date, end_date)
        return Response({'status': 'Leaderboard period created'})

    @action(detail=False, methods=['get'])
    def current_rankings(self, request):
        """Get current rankings"""
        timeframe = request.query_params.get('timeframe', 'weekly')
        venue_id = request.query_params.get('venue_id')
        
        queryset = self.get_queryset().filter(timeframe=timeframe)
        if venue_id:
            queryset = queryset.filter(venue_id=venue_id)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class GameStatsViewSet(viewsets.ModelViewSet):
    """ViewSet for GameStats model"""
    queryset = GameStats.objects.all()
    serializer_class = GameStatsSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['highest_break', 'consistency_rating']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def record_shot(self, request, pk=None):
        """Record a shot"""
        stats = self.get_object()
        shot_type = request.data.get('shot_type')
        successful = request.data.get('successful', False)
        difficulty = request.data.get('difficulty')
        
        stats.record_shot(shot_type, successful, difficulty)
        return Response(self.get_serializer(stats).data)

    @action(detail=True, methods=['post'])
    def record_break(self, request, pk=None):
        """Record a break"""
        stats = self.get_object()
        points = request.data.get('points', 0)
        
        stats.record_break(points)
        return Response(self.get_serializer(stats).data)

    @action(detail=True, methods=['post'])
    def update_metrics(self, request, pk=None):
        """Update advanced metrics"""
        stats = self.get_object()
        stats.update_advanced_metrics()
        return Response(self.get_serializer(stats).data) 