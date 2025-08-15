import os
from typing import Any, Dict, List, Optional

import firebase_admin
from firebase_admin import credentials, messaging
from flask import current_app
from models.device import Device

# Lazy imports to avoid circular dependencies
User = None
Notification = None


class PushNotificationService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PushNotificationService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            # Initialize models
            global User, Notification
            if User is None:
                from models.user import User
            if Notification is None:
                from models.notification import Notification

            self._initialized = True

    def init_app(self, app):
        """Initialize the service with the Flask app."""
        if not firebase_admin._apps and app.config.get("FIREBASE_CREDENTIALS_PATH"):
            cred = credentials.Certificate(app.config["FIREBASE_CREDENTIALS_PATH"])
            firebase_admin.initialize_app(cred)

    def _ensure_firebase_initialized(self):
        """Ensure Firebase is initialized before using it."""
        if self.app is None:
            try:
                # Try to get existing app
                self.app = firebase_admin.get_app()
            except ValueError:
                # Initialize new app if none exists
                try:
                    cred_path = current_app.config.get(
                        "FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json"
                    )
                    if os.path.exists(cred_path):
                        cred = credentials.Certificate(cred_path)
                        self.app = firebase_admin.initialize_app(cred)
                    else:
                        current_app.logger.warning(
                            "Firebase credentials not found. Push notifications will be disabled."
                        )
                except RuntimeError:
                    # If we're outside application context, just log a warning
                    print("Warning: Firebase initialization skipped - no application context")

    def send_notification(
        self,
        user_id: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        priority: str = "normal",
    ) -> Dict[str, Any]:
        """
        Send push notification to a user's devices
        """
        # Ensure Firebase is initialized
        self._ensure_firebase_initialized()

        if self.app is None:
            return {"error": "Firebase not initialized"}

        # Get user's active devices with valid push tokens
        devices = Device.get_user_devices(user_id)
        if not devices:
            return {"error": "No active devices found"}

        # Create notification record
        notification = Notification.create(
            user_id=user_id, title=title, body=body, data=data, type="push"
        )

        # Send to all user devices
        results = []
        tokens = [d.push_token for d in devices if d.push_token]

        if not tokens:
            return {"error": "No valid push tokens found"}

        try:
            # Split tokens into batches
            for i in range(0, len(tokens), self.batch_size):
                batch_tokens = tokens[i : i + self.batch_size]

                # Create message
                message = messaging.MulticastMessage(
                    tokens=batch_tokens,
                    notification=messaging.Notification(title=title, body=body),
                    data=data if data else {},
                    android=messaging.AndroidConfig(
                        priority=priority,
                        notification=messaging.AndroidNotification(
                            icon="notification_icon", color="#4CAF50"
                        ),
                    ),
                    apns=messaging.APNSConfig(
                        payload=messaging.APNSPayload(aps=messaging.Aps(badge=1, sound="default"))
                    ),
                )

                # Send batch
                batch_response = messaging.send_multicast(message)
                results.append(batch_response)

                # Handle failed tokens
                if batch_response.failure_count > 0:
                    self._handle_failed_tokens(batch_response.responses, batch_tokens, devices)

            # Update notification status
            notification.update_status("sent")

            return {
                "status": "success",
                "notification_id": str(notification._id),
                "results": [
                    {"success_count": r.success_count, "failure_count": r.failure_count}
                    for r in results
                ],
            }

        except Exception as e:
            notification.update_status("failed", str(e))
            return {"error": str(e)}

    def send_topic_notification(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        priority: str = "normal",
    ) -> Dict[str, Any]:
        """
        Send notification to a topic
        """
        # Ensure Firebase is initialized
        self._ensure_firebase_initialized()

        if self.app is None:
            return {"error": "Firebase not initialized"}

        try:
            # Create message
            message = messaging.Message(
                topic=topic,
                notification=messaging.Notification(title=title, body=body),
                data=data if data else {},
                android=messaging.AndroidConfig(
                    priority=priority,
                    notification=messaging.AndroidNotification(
                        icon="notification_icon", color="#4CAF50"
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(aps=messaging.Aps(badge=1, sound="default"))
                ),
            )

            # Send message
            response = messaging.send(message)

            # Create notification record
            notification = Notification.create(
                topic=topic, title=title, body=body, data=data, type="topic", status="sent"
            )

            return {
                "status": "success",
                "notification_id": str(notification._id),
                "message_id": response,
            }

        except Exception as e:
            return {"error": str(e)}

    def subscribe_to_topic(self, user_id: str, topic: str) -> Dict[str, Any]:
        """
        Subscribe user's devices to a topic
        """
        # Ensure Firebase is initialized
        self._ensure_firebase_initialized()

        if self.app is None:
            return {"error": "Firebase not initialized"}

        devices = Device.get_user_devices(user_id)
        if not devices:
            return {"error": "No active devices found"}

        tokens = [d.push_token for d in devices if d.push_token]
        if not tokens:
            return {"error": "No valid push tokens found"}

        try:
            response = messaging.subscribe_to_topic(tokens, topic)
            return {
                "status": "success",
                "success_count": response.success_count,
                "failure_count": response.failure_count,
            }
        except Exception as e:
            return {"error": str(e)}

    def unsubscribe_from_topic(self, user_id: str, topic: str) -> Dict[str, Any]:
        """
        Unsubscribe user's devices from a topic
        """
        # Ensure Firebase is initialized
        self._ensure_firebase_initialized()

        if self.app is None:
            return {"error": "Firebase not initialized"}

        devices = Device.get_user_devices(user_id)
        if not devices:
            return {"error": "No active devices found"}

        tokens = [d.push_token for d in devices if d.push_token]
        if not tokens:
            return {"error": "No valid push tokens found"}

        try:
            response = messaging.unsubscribe_from_topic(tokens, topic)
            return {
                "status": "success",
                "success_count": response.success_count,
                "failure_count": response.failure_count,
            }
        except Exception as e:
            return {"error": str(e)}

    def _handle_failed_tokens(
        self, responses: List[messaging.SendResponse], tokens: List[str], devices: List[Device]
    ) -> None:
        """
        Handle failed tokens by removing or updating device records
        """
        for idx, response in enumerate(responses):
            if not response.success:
                token = tokens[idx]
                # Find device with this token
                device = next((d for d in devices if d.push_token == token), None)
                if device:
                    if response.exception and isinstance(
                        response.exception, messaging.UnregisteredError
                    ):
                        # Token is no longer valid, remove it
                        device.update({"push_token": None})
                    else:
                        # Other error, log it
                        print(f"Failed to send to token {token}: {response.exception}")

    def send_match_notification(
        self, match_id: str, event_type: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send match-related notification
        """
        templates = {
            "match_start": {
                "title": "Match Starting",
                "body": "Your match against {opponent} is starting at {venue}",
            },
            "match_end": {"title": "Match Complete", "body": "Match against {opponent} has ended"},
            "turn_change": {"title": "Your Turn", "body": "It's your turn to play"},
            "shot_recorded": {
                "title": "Shot Recorded",
                "body": "{player} has made a {result} shot",
            },
        }

        template = templates.get(event_type)
        if not template:
            return {"error": "Invalid event type"}

        return self.send_notification(
            user_id=data["user_id"],
            title=template["title"],
            body=template["body"].format(**data),
            data={"type": "match", "match_id": match_id, "event": event_type, **data},
        )

    def send_tournament_notification(
        self, tournament_id: str, event_type: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send tournament-related notification
        """
        templates = {
            "tournament_start": {
                "title": "Tournament Starting",
                "body": "Tournament {name} is starting soon",
            },
            "match_scheduled": {
                "title": "Match Scheduled",
                "body": "Your next match is scheduled against {opponent}",
            },
            "round_complete": {
                "title": "Round Complete",
                "body": "Round {round} of {tournament} is complete",
            },
            "tournament_end": {
                "title": "Tournament Complete",
                "body": "Tournament {name} has ended",
            },
        }

        template = templates.get(event_type)
        if not template:
            return {"error": "Invalid event type"}

        return self.send_notification(
            user_id=data["user_id"],
            title=template["title"],
            body=template["body"].format(**data),
            data={
                "type": "tournament",
                "tournament_id": tournament_id,
                "event": event_type,
                **data,
            },
        )

    def send_venue_notification(
        self, venue_id: str, event_type: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send venue-related notification
        """
        templates = {
            "event_created": {"title": "New Event", "body": "New event {name} at {venue}"},
            "occupancy_update": {"title": "Venue Update", "body": "{venue} is {status}"},
            "tournament_announced": {
                "title": "Tournament Announced",
                "body": "New tournament at {venue}",
            },
        }

        template = templates.get(event_type)
        if not template:
            return {"error": "Invalid event type"}

        # Send to venue topic
        return self.send_topic_notification(
            topic=f"venue_{venue_id}",
            title=template["title"],
            body=template["body"].format(**data),
            data={"type": "venue", "venue_id": venue_id, "event": event_type, **data},
        )
