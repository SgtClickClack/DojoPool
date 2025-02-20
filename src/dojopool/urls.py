from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api.social_views import (
    AchievementViewSet,
    FriendshipViewSet,
    MessageViewSet,
    UserProfileViewSet,
)

router = DefaultRouter()
router.register(r"profiles", UserProfileViewSet, basename="profile")
router.register(r"friendships", FriendshipViewSet, basename="friendship")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"achievements", AchievementViewSet, basename="achievement")

urlpatterns = [
    path("api/", include(router.urls)),
]
