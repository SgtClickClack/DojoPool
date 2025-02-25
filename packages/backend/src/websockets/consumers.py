"""
WebSocket Consumers for DojoPool
"""

import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from backend.models import Match, GameStats, LeaderboardEntry

User = get_user_model()

class GameConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for game-related real-time updates
    """
    async def connect(self):
        """
        Called when the websocket is handshaking
        """
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.match_group_name = f'match_{self.match_id}'
        
        # Join match group
        await self.channel_layer.group_add(
            self.match_group_name,
            self.channel_name
        )
        await self.accept()
        
        # Send initial match state
        match_data = await self.get_match_data()
        await self.send_json(match_data)

    async def disconnect(self, close_code):
        """
        Called when the WebSocket closes
        """
        # Leave match group
        await self.channel_layer.group_discard(
            self.match_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        """
        Called when we receive a text frame from the client
        """
        message_type = content.get('type')
        
        if message_type == 'shot':
            await self.handle_shot(content)
        elif message_type == 'break':
            await self.handle_break(content)
        elif message_type == 'match_end':
            await self.handle_match_end(content)
        elif message_type == 'stats_update':
            await self.handle_stats_update(content)

    async def match_update(self, event):
        """
        Called when something needs to be sent to the client
        """
        # Send match update to WebSocket
        await self.send_json(event['data'])

    @database_sync_to_async
    def get_match_data(self):
        """
        Get current match data
        """
        match = Match.objects.get(id=self.match_id)
        return {
            'type': 'match_state',
            'match': {
                'id': str(match.id),
                'status': match.status,
                'score': match.score,
                'stats': match.stats,
                'player1': {
                    'id': str(match.player1.id),
                    'nickname': match.player1.nickname
                },
                'player2': {
                    'id': str(match.player2.id),
                    'nickname': match.player2.nickname
                }
            }
        }

    async def handle_shot(self, content):
        """
        Handle shot event
        """
        player_id = content.get('player_id')
        made = content.get('made', False)
        
        # Update match stats
        await self.update_match_stats(player_id, made)
        
        # Broadcast shot to group
        await self.channel_layer.group_send(
            self.match_group_name,
            {
                'type': 'match_update',
                'data': {
                    'type': 'shot_update',
                    'player_id': player_id,
                    'made': made,
                    'timestamp': content.get('timestamp')
                }
            }
        )

    async def handle_break(self, content):
        """
        Handle break event
        """
        player_id = content.get('player_id')
        points = content.get('points', 0)
        
        # Update break statistics
        await self.update_break_stats(player_id, points)
        
        # Broadcast break to group
        await self.channel_layer.group_send(
            self.match_group_name,
            {
                'type': 'match_update',
                'data': {
                    'type': 'break_update',
                    'player_id': player_id,
                    'points': points,
                    'timestamp': content.get('timestamp')
                }
            }
        )

    @database_sync_to_async
    def update_match_stats(self, player_id, made):
        """
        Update match statistics for a shot
        """
        match = Match.objects.get(id=self.match_id)
        match.add_shot(player_id, made)
        
        # Update game stats
        stats = GameStats.objects.get(match=match)
        stats.record_shot(
            shot_type='standard',
            successful=made
        )

    @database_sync_to_async
    def update_break_stats(self, player_id, points):
        """
        Update break statistics
        """
        match = Match.objects.get(id=self.match_id)
        match.add_break(player_id, points)
        
        # Update game stats
        stats = GameStats.objects.get(match=match)
        stats.record_break(points)

class LeaderboardConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for leaderboard updates
    """
    async def connect(self):
        """
        Called when the websocket is handshaking
        """
        self.timeframe = self.scope['url_route']['kwargs'].get('timeframe', 'all_time')
        self.leaderboard_group = f'leaderboard_{self.timeframe}'
        
        await self.channel_layer.group_add(
            self.leaderboard_group,
            self.channel_name
        )
        await self.accept()
        
        # Send initial leaderboard data
        leaderboard_data = await self.get_leaderboard_data()
        await self.send_json(leaderboard_data)

    async def disconnect(self, close_code):
        """
        Called when the WebSocket closes
        """
        await self.channel_layer.group_discard(
            self.leaderboard_group,
            self.channel_name
        )

    async def leaderboard_update(self, event):
        """
        Called when leaderboard needs to be sent to the client
        """
        await self.send_json(event['data'])

    @database_sync_to_async
    def get_leaderboard_data(self):
        """
        Get current leaderboard data
        """
        entries = LeaderboardEntry.objects.filter(
            timeframe=self.timeframe
        ).select_related('player')[:10]
        
        return {
            'type': 'leaderboard_state',
            'timeframe': self.timeframe,
            'rankings': [
                {
                    'rank': entry.rank,
                    'player': {
                        'id': str(entry.player.id),
                        'nickname': entry.player.nickname
                    },
                    'points': entry.points,
                    'matches_won': entry.matches_won,
                    'win_rate': entry.win_rate
                }
                for entry in entries
            ]
        } 