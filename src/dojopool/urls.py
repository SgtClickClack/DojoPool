from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api.social_views import (
    UserProfileViewSet,
    FriendshipViewSet,
    MessageViewSet,
    AchievementViewSet,
)

router = DefaultRouter()
router.register(r"profiles", UserProfileViewSet, basename="profile")
router.register(r"friendships", FriendshipViewSet, basename="friendship")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"achievements", AchievementViewSet, basename="achievement")

urlpatterns = [
    path("api/", include(router.urls)),
]
