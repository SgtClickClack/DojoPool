from typing import Dict, Set, Optional, List, Any, cast, Union
from datetime import datetime
import json
import asyncio
import zlib
from fastapi import WebSocket
from ...extensions import cache_service
from .types import (
    WebSocketSet,
    UserID,
    Stats,
    RateLimits,
    BatchSettings,
    MessageQueue,
    UpdateTimes,
    ConnectionTokens,
    RankingEntry,
)
from .global_ranking import GlobalRankingService

class RealTimeRankingService:
    def __init__(self) -> None:
        self.active_connections: Dict[UserID, WebSocketSet] = {}
        self.ranking_service = GlobalRankingService()
        self.stats: Stats = {
            "total_connections": 0,
            "messages_sent": 0,
            "errors": 0,
            "last_update": None,
            "connected_users": set(),
            "peak_connections": 0,
            "rate_limited_attempts": 0,
            "last_error": None,
            "reconnection_attempts": 0,
            "successful_reconnections": 0,
            "failed_heartbeats": 0,
            "compression_stats": {
                "compressed_messages": 0,
                "total_bytes_raw": 0,
                "total_bytes_compressed": 0,
            },
            "batch_stats": {"batches_sent": 0, "messages_batched": 0, "avg_batch_size": 0.0},
        }
        self.rate_limits: RateLimits = {
            "max_connections_per_user": 5.0,
            "max_total_connections": 1000.0,
            "update_cooldown": 1.0,
            "broadcast_cooldown": 0.1,
            "heartbeat_interval": 30.0,
            "reconnect_timeout": 5.0,
        }
        self._last_update_time: UpdateTimes = {}
        self._last_broadcast_time: float = 0.0
        self._heartbeat_tasks: Dict[UserID, Set[asyncio.Task[None]]] = {}
        self._connection_tokens: ConnectionTokens = {}
        self.batch_settings: BatchSettings = {
            "max_batch_size": 100,
            "batch_timeout": 0.1,
            "compression_threshold": 1024,
        }
        self._message_queues: Dict[UserID, MessageQueue] = {}
        self._batch_tasks: Dict[UserID, asyncio.Task[None]] = {}

    def _get_stat(self, key: str, default: Any = 0) -> Any:
        """Safely get a stat value with proper type casting."""
        return self.stats.get(key, default)

    def _increment_stat(self, key: str, amount: int = 1) -> None:
        """Safely increment a numeric stat value."""
        current = cast(int, self._get_stat(key, 0))
        self.stats[key] = current + amount

    def _update_stat(self, key: str, value: Any) -> None:
        """Safely update a stat value."""
        self.stats[key] = value

    async def connect(
        self, websocket: WebSocket, user_id: UserID, reconnect_token: Optional[str] = None
    ) -> None:
        """Connect a new WebSocket client with reconnection support."""
        try:
            if reconnect_token and self._validate_reconnect_token(user_id, reconnect_token):
                self._increment_stat("successful_reconnections")
            else:
                if user_id in self.active_connections and len(
                    self.active_connections[user_id]
                ) >= int(self.rate_limits["max_connections_per_user"]):
                    self._increment_stat("rate_limited_attempts")
                    raise ValueError(f"Maximum connections reached for user {user_id}")

                total_connections = sum(len(conns) for conns in self.active_connections.values())
                if total_connections >= int(self.rate_limits["max_total_connections"]):
                    self._increment_stat("rate_limited_attempts")
                    raise ValueError("Maximum total connections reached")

            await websocket.accept()

            new_token = self._generate_reconnect_token(user_id)
            await websocket.send_json({"type": "connection_token", "token": new_token})

            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)

            self._start_heartbeat_monitor(websocket, user_id)
            self._start_batch_processor(user_id)

            await websocket.send_json(
                {
                    "type": "connection_info",
                    "features": {
                        "compression": True,
                        "batching": True,
                        "batch_size": self.batch_settings["max_batch_size"],
                    },
                }
            )

            self._increment_stat("total_connections")
            cast(Set[int], self.stats["connected_users"]).add(user_id)
            current_connections = sum(len(conns) for conns in self.active_connections.values())
            self._update_stat(
                "peak_connections",
                max(cast(int, self._get_stat("peak_connections")), current_connections),
            )

            self._last_update_time[user_id] = 0.0
            await self._cache_stats()

        except Exception as e:
            self._increment_stat("errors")
            self._update_stat("last_error", str(e))
            await self._cache_stats()
            raise

    async def disconnect(self, websocket: WebSocket, user_id: UserID) -> None:
        """Disconnect a WebSocket client."""
        try:
            if user_id in self._heartbeat_tasks:
                tasks = self._heartbeat_tasks[user_id]
                for task in tasks:
                    if not task.done():
                        task.cancel()
                tasks.clear()

            if user_id in self._batch_tasks and not self._batch_tasks[user_id].done():
                self._batch_tasks[user_id].cancel()

            if user_id in self._message_queues:
                self._message_queues[user_id].clear()

            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                    cast(Set[int], self.stats["connected_users"]).discard(user_id)
                    asyncio.create_task(self._cleanup_reconnect_token(user_id))

            await self._cache_stats()

        except Exception as e:
            self._increment_stat("errors")
            self._update_stat("last_error", f"Disconnect error: {str(e)}")
            await self._cache_stats()

    async def broadcast_ranking_update(self, user_id: UserID, ranking_data: Dict[str, Any]) -> None:
        """Broadcast ranking update with batching and rate limiting."""
        current_time = asyncio.get_event_loop().time()

        if self._check_rate_limits(user_id, current_time):
            return

        try:
            if user_id in self.active_connections:
                message = {
                    "type": "ranking_update",
                    "data": ranking_data,
                    "timestamp": datetime.now().isoformat(),
                }

                await self._queue_message(user_id, message)
                self._last_update_time[user_id] = current_time
                self._last_broadcast_time = current_time

        except Exception as e:
            self._increment_stat("errors")
            self._update_stat("last_error", str(e))
            await self._cache_stats()
            raise

    async def broadcast_global_update(self, start_rank: int, end_rank: int) -> None:
        """Broadcast global ranking updates with batching."""
        current_time = asyncio.get_event_loop().time()

        if current_time - self._last_broadcast_time < self.rate_limits["broadcast_cooldown"]:
            self._increment_stat("rate_limited_attempts")
            return

        try:
            rankings = await self.ranking_service.get_rankings_in_range(start_rank, end_rank)
            message = {
                "type": "global_update",
                "data": rankings,
                "timestamp": datetime.now().isoformat(),
            }

            for user_id in self.active_connections:
                await self._queue_message(user_id, message)

            self._last_broadcast_time = current_time
            self._update_stat("last_update", datetime.now().isoformat())
            await self._cache_stats()

        except Exception as e:
            self._increment_stat("errors")
            self._update_stat("last_error", str(e))
            await self._cache_stats()
            raise

    async def notify_significant_changes(
        self, user_id: UserID, old_rank: int, new_rank: int
    ) -> None:
        """Notify users of significant ranking changes with rate limiting."""
        current_time = asyncio.get_event_loop().time()

        if self._check_rate_limits(user_id, current_time):
            return

        try:
            if abs(old_rank - new_rank) >= 5 and user_id in self.active_connections:
                message = {
                    "type": "significant_change",
                    "data": {
                        "old_rank": old_rank,
                        "new_rank": new_rank,
                        "change": old_rank - new_rank,
                    },
                    "timestamp": datetime.now().isoformat(),
                }

                await self._queue_message(user_id, message)
                self._last_update_time[user_id] = current_time
                await self._cache_stats()

        except Exception as e:
            self._increment_stat("errors")
            self._update_stat("last_error", str(e))
            await self._cache_stats()
            raise

    async def start_periodic_updates(self) -> None:
        """Start periodic global ranking updates."""
        while True:
            try:
                await self.ranking_service.update_global_rankings()
                await asyncio.sleep(300)  # 5 minutes
            except Exception as e:
                self._increment_stat("errors")
                print(f"Error in periodic updates: {str(e)}")
                await asyncio.sleep(60)  # Wait before retrying

    async def _cache_stats(self) -> None:
        """Cache the current statistics."""
        await cache_service.set("ranking_stats", self.stats)

    async def get_stats(self) -> Stats:
        """Get the current statistics."""
        cached_stats = await cache_service.get("ranking_stats")
        return cached_stats if cached_stats is not None else self.stats

    def _generate_reconnect_token(self, user_id: UserID) -> str:
        """Generate a reconnection token for a user."""
        token = f"{user_id}_{datetime.now().timestamp()}"
        self._connection_tokens[user_id] = token
        return token

    def _validate_reconnect_token(self, user_id: UserID, token: str) -> bool:
        """Validate a reconnection token."""
        if user_id not in self._connection_tokens:
            return False
        return self._connection_tokens[user_id] == token

    async def _cleanup_reconnect_token(self, user_id: UserID) -> None:
        """Clean up a reconnection token after timeout."""
        await asyncio.sleep(self.rate_limits["reconnect_timeout"])
        self._connection_tokens.pop(user_id, None)

    async def _start_heartbeat_monitor(self, websocket: WebSocket, user_id: UserID) -> None:
        """Start heartbeat monitoring for a connection."""
        if user_id not in self._heartbeat_tasks:
            self._heartbeat_tasks[user_id] = set()

        task = asyncio.create_task(self._monitor_heartbeat(websocket, user_id))
        self._heartbeat_tasks[user_id].add(task)

    async def _monitor_heartbeat(self, websocket: WebSocket, user_id: UserID) -> None:
        """Monitor heartbeat for a connection."""
        while True:
            try:
                await websocket.send_json({"type": "ping", "timestamp": datetime.now().isoformat()})

                try:
                    response = await asyncio.wait_for(
                        websocket.receive_json(), timeout=self.rate_limits["heartbeat_interval"]
                    )

                    if response.get("type") != "pong":
                        continue
                except asyncio.TimeoutError:
                    self._increment_stat("failed_heartbeats")
                    raise ValueError("Heartbeat timeout")

            except Exception as e:
                self._increment_stat("errors")
                self._update_stat("last_error", f"Heartbeat error: {str(e)}")
                await self.disconnect(websocket, user_id)
                break

    async def _queue_message(self, user_id: UserID, message: Dict[str, Any]) -> None:
        """Queue a message for batched delivery."""
        if user_id not in self._message_queues:
            self._message_queues[user_id] = []
        self._message_queues[user_id].append(message)

    async def _start_batch_processor(self, user_id: UserID) -> None:
        """Start batch message processor for a user."""
        if user_id not in self._batch_tasks or self._batch_tasks[user_id].done():
            self._batch_tasks[user_id] = asyncio.create_task(self._process_message_batch(user_id))

    async def _process_message_batch(self, user_id: UserID) -> None:
        """Process batched messages for a user."""
        while user_id in self.active_connections:
            try:
                if user_id in self._message_queues and self._message_queues[user_id]:
                    messages = self._message_queues[user_id][
                        : self.batch_settings["max_batch_size"]
                    ]
                    self._message_queues[user_id] = self._message_queues[user_id][
                        self.batch_settings["max_batch_size"] :
                    ]

                    if messages:
                        batch_message = {
                            "type": "batch",
                            "messages": messages,
                            "timestamp": datetime.now().isoformat(),
                        }

                        # Update batch statistics
                        batch_size = len(messages)
                        self._increment_stat("batch_stats.batches_sent")
                        self._increment_stat("batch_stats.messages_batched", batch_size)
                        total_batches = cast(int, self._get_stat("batch_stats.batches_sent"))
                        total_messages = cast(int, self._get_stat("batch_stats.messages_batched"))
                        avg_batch_size = (
                            total_messages / total_batches if total_batches > 0 else 0.0
                        )
                        self._update_stat("batch_stats.avg_batch_size", avg_batch_size)

                        for connection in self.active_connections[user_id].copy():
                            try:
                                await self._send_message(connection, batch_message)
                            except Exception as e:
                                self._increment_stat("errors")
                                self._update_stat("last_error", str(e))
                                await self.disconnect(connection, user_id)

                await asyncio.sleep(cast(float, self.batch_settings["batch_timeout"]))
            except Exception as e:
                self._increment_stat("errors")
                self._update_stat("last_error", f"Batch processing error: {str(e)}")
                await asyncio.sleep(1)

    async def _send_message(self, websocket: WebSocket, message: Dict[str, Any]) -> None:
        """Send a message with optional compression."""
        try:
            message_data = json.dumps(message).encode("utf-8")
            raw_size = len(message_data)
            self._increment_stat("compression_stats.total_bytes_raw", raw_size)

            if raw_size >= cast(int, self.batch_settings["compression_threshold"]):
                compressed_data = zlib.compress(message_data)
                compressed_size = len(compressed_data)
                self._increment_stat("compression_stats.compressed_messages")
                self._increment_stat("compression_stats.total_bytes_compressed", compressed_size)
                await websocket.send_bytes(compressed_data)
            else:
                self._increment_stat("compression_stats.total_bytes_compressed", raw_size)
                await websocket.send_json(message)

            self._increment_stat("messages_sent")
            await self._cache_stats()

        except Exception as e:
            self._increment_stat("errors")
            self._update_stat("last_error", str(e))
            raise

    def _check_rate_limits(self, user_id: UserID, current_time: float) -> bool:
        """Check if the operation should be rate limited."""
        if (
            user_id in self._last_update_time
            and current_time - self._last_update_time[user_id] < self.rate_limits["update_cooldown"]
        ):
            self._increment_stat("rate_limited_attempts")
            return True
        return False


realtime_ranking_service = RealTimeRankingService()
