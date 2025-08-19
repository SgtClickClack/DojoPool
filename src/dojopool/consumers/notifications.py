import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from ..models.social import Message, Friendship, UserAchievement


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        self.room_name = f"notifications_{self.user.id}"
        self.room_group_name = f"notifications_group_{self.user.id}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Send initial unread counts
        unread_counts = await self.get_unread_counts()
        await self.send(text_data=json.dumps(unread_counts))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """Handle incoming messages from the WebSocket"""
        data = json.loads(text_data)
        command = data.get("command")

        if command == "mark_read":
            message_id = data.get("message_id")
            await self.mark_message_read(message_id)
            await self.send_unread_counts()

    @database_sync_to_async
    def get_unread_counts(self):
        """Get counts of unread messages and pending requests"""
        unread_messages = Message.objects.filter(receiver=self.user, is_read=False).count()

        pending_requests = Friendship.objects.filter(receiver=self.user, status="pending").count()

        return {
            "type": "counts_update",
            "unread_messages": unread_messages,
            "pending_requests": pending_requests,
        }

    @database_sync_to_async
    def mark_message_read(self, message_id):
        """Mark a message as read"""
        try:
            message = Message.objects.get(id=message_id, receiver=self.user)
            message.is_read = True
            message.save()
        except Message.DoesNotExist:
            pass

    async def send_unread_counts(self):
        """Send updated unread counts to the client"""
        counts = await self.get_unread_counts()
        await self.send(text_data=json.dumps(counts))

    # Notification handlers
    async def new_message(self, event):
        """Handle new message notification"""
        await self.send(text_data=json.dumps({"type": "new_message", "message": event["message"]}))

    async def friend_request(self, event):
        """Handle new friend request notification"""
        await self.send(
            text_data=json.dumps({"type": "friend_request", "request": event["request"]})
        )

    async def achievement_unlocked(self, event):
        """Handle achievement unlock notification"""
        await self.send(
            text_data=json.dumps(
                {"type": "achievement_unlocked", "achievement": event["achievement"]}
            )
        )
