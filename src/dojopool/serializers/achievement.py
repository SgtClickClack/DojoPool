"""
Achievement serializers for DojoPool API.

Provides serialization for achievements and user achievement data.
"""

from rest_framework import serializers
from ..models.achievements import Achievement, UserAchievement


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer for Achievement model."""

    class Meta:
        model = Achievement
        fields = [
            'id', 'name', 'description', 'icon', 'points', 'category',
            'criteria', 'rarity', 'isSecret', 'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class UserAchievementSerializer(serializers.ModelSerializer):
    """Serializer for UserAchievement model."""

    achievement = AchievementSerializer(read_only=True)
    achievement_name = serializers.CharField(source='achievement.name', read_only=True)
    achievement_description = serializers.CharField(source='achievement.description', read_only=True)
    achievement_icon = serializers.CharField(source='achievement.icon', read_only=True)
    achievement_points = serializers.IntegerField(source='achievement.points', read_only=True)

    class Meta:
        model = UserAchievement
        fields = [
            'id', 'playerId', 'achievementId', 'dateUnlocked', 'progress',
            'createdAt', 'updatedAt', 'achievement', 'achievement_name',
            'achievement_description', 'achievement_icon', 'achievement_points'
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AchievementProgressSerializer(serializers.Serializer):
    """Serializer for achievement progress updates."""

    user_id = serializers.CharField()
    achievement_id = serializers.CharField()
    progress = serializers.IntegerField(min_value=0)
    metadata = serializers.JSONField(required=False)


class AchievementCriteriaSerializer(serializers.Serializer):
    """Serializer for achievement criteria validation."""

    type = serializers.ChoiceField(choices=[
        'matches_won', 'tournaments_won', 'win_streak', 'perfect_game',
        'trick_shot', 'venue_control', 'clan_contribution', 'social_engagement'
    ])
    value = serializers.IntegerField(min_value=1)
    operator = serializers.ChoiceField(choices=['>=', '=', '>'], default='>=')
    metadata = serializers.JSONField(required=False)


class AchievementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new achievements."""

    criteria = AchievementCriteriaSerializer(many=True)

    class Meta:
        model = Achievement
        fields = [
            'name', 'description', 'icon', 'points', 'category',
            'criteria', 'isSecret'
        ]

    def validate_criteria(self, value):
        """Validate achievement criteria."""
        if not value:
            raise serializers.ValidationError("At least one criteria is required.")
        return value

    def create(self, validated_data):
        """Create achievement with criteria."""
        criteria_data = validated_data.pop('criteria')
        criteria_json = [c.data for c in criteria_data]

        validated_data['criteria'] = criteria_json
        return super().create(validated_data)
