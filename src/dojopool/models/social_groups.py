from flask_caching import Cache
from flask_caching import Cache
from typing import List, Optional

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Clan(models.Model):
    name = models.CharField(max_length=100, unique=True)
    tag = models.CharField(max_length=10, unique=True)
    description = models.TextField()
    logo = models.ImageField(upload_to="clan_logos/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    leader = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="led_clans"
    )
    members = models.ManyToManyField(User, through="ClanMembership")

    # Clan stats
    total_wins = models.IntegerField(default=0)
    total_tournaments = models.IntegerField(default=0)
    rating = models.IntegerField(default=1000)
    member_count = models.IntegerField(default=0)

    # Social features
    is_public = models.BooleanField(default=True)
    recruitment_open = models.BooleanField(default=True)
    min_rating_requirement = models.IntegerField(default=0)

    def __str__(self) -> str:
        return f"[{self.tag}] {self.name}"

    def add_member(self, user: User, role: str = "member"):
        """Add a new member to the clan"""
        membership = ClanMembership.objects.create(clan=self, user=user, role=role)
        self.member_count = self.members.count()
        self.save()
        return membership

    def remove_member(self, user: User):
        """Remove a member from the clan"""
        ClanMembership.objects.filter(clan=self, user=user).delete()
        self.member_count = self.members.count()
        self.save()

    def get_officers(self):
        """Get list of clan officers"""
        return [
            membership.user
            for membership in self.clanmembership_set.filter(role="officer")
        ]


class ClanMembership(models.Model):
    ROLE_CHOICES = [
        ("leader", "Leader"),
        ("officer", "Officer"),
        ("member", "Member"),
        ("recruit", "Recruit"),
    ]

    clan = models.ForeignKey(Clan, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)
    contribution_points = models.IntegerField(default=0)
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)

    class Meta:
        unique_together = ("clan", "user")

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role}) in {self.clan.name}"


class Team(models.Model):
    name = models.CharField(max_length=100)
    clan = models.ForeignKey(Clan, on_delete=models.CASCADE, related_name="teams")
    captain = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="led_teams"
    )
    members = models.ManyToManyField(User, through="TeamMembership")
    created_at = models.DateTimeField(auto_now_add=True)

    # Team stats
    rating = models.IntegerField(default=1000)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    tournaments_played = models.IntegerField(default=0)
    tournaments_won = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.clan.tag})"

    def add_member(self, user: User, position: str):
        """Add a new member to the team"""
        return TeamMembership.objects.create(team=self, user=user, position=position)


class TeamMembership(models.Model):
    POSITION_CHOICES = [
        ("captain", "Captain"),
        ("starter", "Starter"),
        ("substitute", "Substitute"),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    position = models.CharField(max_length=20, choices=POSITION_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)
    games_played = models.IntegerField(default=0)
    win_rate = models.FloatField(default=0.0)

    class Meta:
        unique_together = ("team", "user")

    def __str__(self):
        return f"{self.user.username} ({self.position}) in {self.team.name}"


class ClanChallenge(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    challenger = models.ForeignKey(
        Clan, on_delete=models.CASCADE, related_name="challenges_sent"
    )
    challenged = models.ForeignKey(
        Clan, on_delete=models.CASCADE, related_name="challenges_received"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_for = models.DateTimeField(null=True)

    # Challenge details
    team_size = models.IntegerField(default=5)
    format = models.CharField(max_length=50)  # e.g., "Best of 5"
    prize_pool = models.IntegerField(default=0)  # in Dojo Coins

    def __str__(self) -> str:
        return f"{self.challenger.tag} vs {self.challenged.tag} ({self.status})"

    def accept(self, scheduled_for: Optional[timezone.datetime] = None):
        """Accept the clan challenge"""
        self.status = "accepted"
        if scheduled_for:
            self.scheduled_for = scheduled_for
        self.save()

    def complete(self, winner: Clan):
        """Complete the clan challenge"""
        self.status = "completed"
        self.save()

        # Update clan stats
        winner.total_wins += 1
        winner.rating += 25
        winner.save()

        loser = self.challenged if winner == self.challenger else self.challenger
        loser.rating = max(1000, loser.rating - 25)
        loser.save()
