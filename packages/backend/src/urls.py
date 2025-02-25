"""
URL Configuration for DojoPool
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .api.viewsets import (
    PlayerViewSet, MatchViewSet, VenueViewSet,
    LeaderboardViewSet, GameStatsViewSet
)
from .auth.views import (
    RegisterView, LoginView, RefreshTokenView, LogoutView
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'players', PlayerViewSet)
router.register(r'matches', MatchViewSet)
router.register(r'venues', VenueViewSet)
router.register(r'leaderboard', LeaderboardViewSet)
router.register(r'game-stats', GameStatsViewSet)

# Authentication URLs
auth_urls = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
]

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API URLs
    path('api/', include([
        path('', include(router.urls)),
        path('auth/', include(auth_urls)),
    ])),
    
    # Authentication URLs
    path('api-auth/', include('rest_framework.urls')),
    
    # Redirect root URL to API root
    path('', RedirectView.as_view(url='/api/', permanent=False)),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 