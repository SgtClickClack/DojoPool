"""Core models package."""

from .notification import Notification, NotificationType
from .notification_preference import NotificationPreference

__all__ = ["Notification", "NotificationType", "NotificationPreference"]
