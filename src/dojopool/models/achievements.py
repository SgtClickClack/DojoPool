
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class AchievementCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)  # Font awesome icon name

    def __str__(self):
        return self.name


class Achievement(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.ForeignKey(AchievementCategory, on_delete=models.CASCADE)
    icon = models.ImageField(upload_to="achievements/", null=True)
    points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    # Progress tracking
    has_progress = models.BooleanField(default=False)
    target_value = models.IntegerField(null=True, blank=True)
    progress_description = models.CharField(max_length=200, null=True, blank=True)

    # Social features
    is_secret = models.BooleanField(default=False)
    rarity = models.FloatField(default=0)  # Percentage of users who have this

    # Unlock conditions as JSON
    conditions = models.JSONField(default=dict)

    def __str__(self):
        return self.name

    def update_rarity(self):
        total_users = User.objects.count()
        if total_users > 0:
            unlocked_count = UserAchievement.objects.filter(
                achievement=self, is_unlocked=True
            ).count()
            self.rarity = (unlocked_count / total_users) * 100
            self.save()


class UserAchievement(models.Model):
    user = models.ForeignKey("social.UserProfile", on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    current_progress = models.IntegerField(default=0)
    is_unlocked = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(null=True, blank=True)

    # Social sharing
    shared_count = models.IntegerField(default=0)
    last_shared_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "achievement")

    def __str__(self):
        return f"{self.user.user.username} - {self.achievement.name}"

    def update_progress(self, new_value):
        """Update progress and check if achievement should be unlocked"""
        if self.is_unlocked:
            return False

        self.current_progress = new_value
        should_unlock = False

        if self.achievement.has_progress:
            if self.current_progress >= self.achievement.target_value:
                should_unlock = True
        else:
            should_unlock = True

        if should_unlock:
            self.unlock()
            return True

        self.save()
        return False

    def unlock(self):
        """Unlock the achievement and trigger notifications"""
        self.is_unlocked = True
        self.unlocked_at = timezone.now()
        self.save()

        # Update achievement rarity
        self.achievement.update_rarity()

        # Add points to user's profile
        self.user.skill_level += self.achievement.points
        self.user.save()

    def share(self):
        """Share achievement to social feed"""
        self.shared_count += 1
        self.last_shared_at = timezone.now()
        self.save()


class AchievementShare(models.Model):
    user_achievement = models.ForeignKey(UserAchievement, on_delete=models.CASCADE)
    shared_at = models.DateTimeField(auto_now_add=True)
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user_achievement} - Shared at {self.shared_at}"


@receiver(post_save, sender=UserAchievement)
def achievement_unlocked_notification(sender, instance, created, **kwargs):
    if not created and instance.is_unlocked and instance.unlocked_at == timezone.now():
        # Send WebSocket notification
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_group_{instance.user.user.id}",
            {
                "type": "achievement_unlocked",
                "achievement": {
                    "name": instance.achievement.name,
                    "description": instance.achievement.description,
                    "points": instance.achievement.points,
                    "icon": instance.achievement.icon.url if instance.achievement.icon else None,
                    "rarity": instance.achievement.rarity,
                },
            },
        )


def get_achievement_text(achievement: Achievement) -> str:
    """
    Returns a descriptive text for a given achievement.

    Args:
        achievement (Achievement): The achievement instance.
    
    Returns:
        str: A formatted achievement description.
    """
    # Ensure we return a string rather than Any.
    return f"Achievement: {achievement.name} - {achievement.description}"
