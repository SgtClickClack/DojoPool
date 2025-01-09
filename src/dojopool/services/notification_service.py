"""Notification service."""

from flask_socketio import emit
from dojopool.models import Notification, NotificationType
from dojopool.extensions import db


class NotificationService:
    """Service for managing notifications."""

    @staticmethod
    def send_notification(user_id, type, title, message, data=None):
        """Send a notification to a user."""
        # Create notification in database
        notification = Notification.create(
            user_id=user_id, type=type, title=title, message=message, data=data
        )

        # Emit real-time notification
        emit("new_notification", notification.to_dict(), room=f"user_{user_id}")

        return notification

    @staticmethod
    def send_game_invite(from_user, to_user, game_id):
        """Send a game invitation notification."""
        return NotificationService.send_notification(
            user_id=to_user.id,
            type=NotificationType.GAME_INVITE,
            title=f"Game Invitation from {from_user.username}",
            message=f"{from_user.username} has invited you to a game!",
            data={"game_id": game_id, "from_user_id": from_user.id},
        )

    @staticmethod
    def send_tournament_invite(tournament, to_user):
        """Send a tournament invitation notification."""
        return NotificationService.send_notification(
            user_id=to_user.id,
            type=NotificationType.TOURNAMENT_INVITE,
            title=f"Tournament Invitation: {tournament.name}",
            message=f"You have been invited to join the tournament: {tournament.name}",
            data={"tournament_id": tournament.id},
        )

    @staticmethod
    def send_game_start(game, user_id):
        """Send a game start notification."""
        return NotificationService.send_notification(
            user_id=user_id,
            type=NotificationType.GAME_START,
            title="Game Starting",
            message="Your game is about to begin!",
            data={"game_id": game.id},
        )

    @staticmethod
    def send_game_end(game, user_id, is_winner):
        """Send a game end notification."""
        message = (
            "Congratulations! You won the game!"
            if is_winner
            else "Game Over. Better luck next time!"
        )
        return NotificationService.send_notification(
            user_id=user_id,
            type=NotificationType.GAME_END,
            title="Game Ended",
            message=message,
            data={"game_id": game.id, "is_winner": is_winner},
        )

    @staticmethod
    def send_achievement_notification(user_id, achievement):
        """Send an achievement notification."""
        return NotificationService.send_notification(
            user_id=user_id,
            type=NotificationType.ACHIEVEMENT,
            title="Achievement Unlocked!",
            message=f"Congratulations! You earned the achievement: {achievement.name}",
            data={"achievement_id": achievement.id},
        )

    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user."""
        notifications = Notification.query.filter_by(
            user_id=user_id, status="unread"
        ).all()

        for notification in notifications:
            notification.mark_as_read()

        db.session.commit()
