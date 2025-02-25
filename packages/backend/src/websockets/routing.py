"""
WebSocket Routing Configuration for DojoPool
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(
        r'ws/game/(?P<match_id>[0-9a-f-]+)/$',
        consumers.GameConsumer.as_asgi()
    ),
    re_path(
        r'ws/leaderboard/(?P<timeframe>\w+)/$',
        consumers.LeaderboardConsumer.as_asgi()
    ),
] 