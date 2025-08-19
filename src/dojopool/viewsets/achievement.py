"""
Achievement ViewSet for DojoPool API.

Provides endpoints for managing achievements and player progress.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Count, Sum
from django.utils import timezone

from ..models.achievements import Achievement, UserAchievement
from ..serializers.achievement import (
    AchievementSerializer,
    UserAchievementSerializer,
    AchievementProgressSerializer
)
from ..services.achievement_service import achievement_service


class AchievementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing achievements.

    Provides CRUD operations for achievements and methods for
    checking and awarding player achievements.
    """

    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all achievement categories."""
        categories = Achievement.objects.values_list('category', flat=True).distinct()
        return Response({
            'categories': [cat for cat in categories if cat]
        })

    @action(detail=False, methods=['get'])
    def leaderboard(self, request):
        """Get achievement leaderboard."""
        limit = int(request.query_params.get('limit', 10))

        leaderboard = achievement_service.get_achievement_leaderboard(limit)
        return Response(leaderboard)

    @action(detail=True, methods=['post'])
    def check_progress(self, request, pk=None):
        """Check achievement progress for a specific user."""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            achievement = self.get_object()
            progress = achievement_service.track_achievement_progress(
                user_id, achievement.id, 0
            )
            return Response(progress)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def check_and_award(self, request):
        """Check and award achievements for a player."""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = achievement_service.check_and_award_achievements(user_id)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user achievements (read-only).

    Provides endpoints for viewing player achievement progress.
    """

    serializer_class = UserAchievementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter achievements by current user."""
        return UserAchievement.objects.filter(user_id=self.request.user.id)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get achievement statistics for current user."""
        try:
            stats = achievement_service.get_achievement_stats(request.user.id)
            return Response(stats)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently unlocked achievements."""
        limit = int(request.query_params.get('limit', 5))

        recent = (
            self.get_queryset()
            .filter(is_unlocked=True)
            .order_by('-unlocked_at')
            .select_related('achievement')[:limit]
        )

        serializer = self.get_serializer(recent, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share an achievement."""
        try:
            user_achievement = self.get_object()
            user_achievement.share()
            return Response({'message': 'Achievement shared successfully'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
