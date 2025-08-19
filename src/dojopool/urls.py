from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.social_views import (
    UserProfileViewSet,
    FriendshipViewSet,
    MessageViewSet,
)
from .viewsets.achievement import AchievementViewSet, UserAchievementViewSet

router = DefaultRouter()
router.register(r"profiles", UserProfileViewSet, basename="profile")
router.register(r"friendships", FriendshipViewSet, basename="friendship")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"achievements", AchievementViewSet, basename="achievement")
router.register(r"user-achievements", UserAchievementViewSet, basename="user-achievement")

urlpatterns = [
    path("api/", include(router.urls)),
]
