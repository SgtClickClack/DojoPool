from flask_caching import Cache
from multiprocessing import Pool
import gc
from flask_caching import Cache
from multiprocessing import Pool
import gc
from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models.social import (
    Achievement,
    Friendship,
    Message,
    UserAchievement,
    UserProfile,
)


class MessageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["content"]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by(
            "-created_at"
        )

    @action(detail=False, methods=["GET"])
    def search(self, request):
        """Search messages with advanced filters"""
        query = request.query_params.get("q", "")
        date_from = request.query_params.get("from")
        date_to = request.query_params.get("to")
        user = request.query_params.get("user")

        queryset = self.get_queryset()

        if query:
            queryset = queryset.filter(content__icontains=query)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        if user:
            queryset = queryset.filter(
                Q(sender__username=user) | Q(receiver__username=user)
            )

        return Response(
            {
                "results": [
                    {
                        "id": msg.id,
                        "content": msg.content,
                        "sender": msg.sender.username,
                        "receiver": msg.receiver.username,
                        "created_at": msg.created_at,
                        "is_read": msg.is_read,
                    }
                    for msg in queryset
                ]
            }
        )


class FriendshipViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friendship.objects.filter(Q(sender=user) | Q(receiver=user))

    @action(detail=False, methods=["GET"])
    def suggestions(self, request):
        """Get friend suggestions based on game history and mutual friends"""
        user = request.user

        # Get users with mutual friends
        mutual_friends = (
            User.objects.filter(
                Q(
                    friendship_requests_sent__receiver__in=user.friendship_requests_received.filter(
                        status="accepted"
                    ).values(
                        "sender"
                    )
                )
                | Q(
                    friendship_requests_received__sender__in=user.friendship_requests_sent.filter(
                        status="accepted"
                    ).values(
                        "receiver"
                    )
                )
            )
            .exclude(id=user.id)
            .annotate(mutual_count=Count("id"))
        )

        # Get users with similar achievements
        similar_achievements = (
            User.objects.filter(
                userprofile__userachievement__achievement__in=UserAchievement.objects.filter(
                    user__user=user
                ).values(
                    "achievement"
                )
            )
            .exclude(id=user.id)
            .annotate(achievement_count=Count("id"))
        )

        # Combine and sort suggestions
        suggestions = []
        seen_users = set()

        for u in mutual_friends:
            if u.id not in seen_users:
                suggestions.append(
                    {
                        "username": u.username,
                        "mutual_friends": u.mutual_count,
                        "shared_achievements": 0,
                        "score": u.mutual_count * 2,  # Weight mutual friends higher
                    }
                )
                seen_users.add(u.id)

        for u in similar_achievements:
            if u.id in seen_users:
                # Update existing suggestion
                for s in suggestions:
                    if s["username"] == u.username:
                        s["shared_achievements"] = u.achievement_count
                        s["score"] += u.achievement_count
                        break
            else:
                suggestions.append(
                    {
                        "username": u.username,
                        "mutual_friends": 0,
                        "shared_achievements": u.achievement_count,
                        "score": u.achievement_count,
                    }
                )
                seen_users.add(u.id)

        # Sort by score and return top 10
        suggestions.sort(key=lambda x: x["score"], reverse=True)
        return Response(suggestions[:10])
