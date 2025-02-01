from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from typing import List, Optional, Dict
from .social_groups import Team, Clan
import math


class Tournament(models.Model):
    TOURNAMENT_TYPES = [
        ("single_elimination", "Single Elimination"),
        ("double_elimination", "Double Elimination"),
        ("round_robin", "Round Robin"),
        ("swiss", "Swiss System"),
    ]

    STATUS_CHOICES = [
        ("registration", "Registration Open"),
        ("seeding", "Seeding"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    tournament_type = models.CharField(max_length=50, choices=TOURNAMENT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="registration")

    # Tournament settings
    max_participants = models.IntegerField()
    min_rating_requirement = models.IntegerField(default=0)
    is_team_based = models.BooleanField(default=False)
    is_clan_restricted = models.BooleanField(default=False)
    hosting_clan = models.ForeignKey(Clan, null=True, blank=True, on_delete=models.SET_NULL)

    # Scheduling
    registration_deadline = models.DateTimeField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)

    # Prize pool
    entry_fee = models.IntegerField(default=0)  # in Dojo Coins
    prize_pool = models.IntegerField(default=0)  # in Dojo Coins
    prize_distribution = models.JSONField(default=dict)  # e.g., {"1": 50, "2": 30, "3": 20}

    # Stats
    current_round = models.IntegerField(default=0)
    total_rounds = models.IntegerField(default=0)
    participant_count = models.IntegerField(default=0)
    spectator_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.get_tournament_type_display()})"

    def initialize_brackets(self) -> None:
        """Initialize tournament brackets based on participants"""
        if self.status != "seeding":
            return

        participants = self.participants.all().order_by("-seed")
        num_participants = participants.count()

        # Calculate number of rounds needed
        self.total_rounds = math.ceil(math.log2(num_participants))
        num_matches = 2**self.total_rounds - 1

        # Create matches for first round
        matches_needed = 2 ** (self.total_rounds - 1)
        byes = matches_needed * 2 - num_participants

        for i in range(matches_needed):
            match = TournamentMatch.objects.create(
                tournament=self, round_number=1, match_number=i + 1
            )

            # Assign players/teams to matches
            if i < byes:
                # This match gets a bye
                winner_idx = i * 2
                if winner_idx < num_participants:
                    match.participant1 = participants[winner_idx]
                    match.status = "bye"
                    match.save()
            else:
                # Regular match
                p1_idx = i * 2
                p2_idx = i * 2 + 1
                if p1_idx < num_participants:
                    match.participant1 = participants[p1_idx]
                if p2_idx < num_participants:
                    match.participant2 = participants[p2_idx]
                match.save()

        self.current_round = 1
        self.status = "in_progress"
        self.save()

    def advance_round(self) -> None:
        """Advance tournament to next round"""
        if self.current_round >= self.total_rounds:
            return

        current_matches = self.matches.filter(round_number=self.current_round, status="completed")

        next_round = self.current_round + 1
        matches_in_next_round = 2 ** (self.total_rounds - next_round)

        for i in range(matches_in_next_round):
            match = TournamentMatch.objects.create(
                tournament=self, round_number=next_round, match_number=i + 1
            )

            # Get winners from previous round
            prev_match1 = current_matches[i * 2]
            prev_match2 = current_matches[i * 2 + 1]

            match.participant1 = prev_match1.winner
            match.participant2 = prev_match2.winner
            match.save()

        self.current_round = next_round
        self.save()


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(
        Tournament, on_delete=models.CASCADE, related_name="participants"
    )
    player = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.SET_NULL)
    seed = models.IntegerField()
    registration_date = models.DateTimeField(auto_now_add=True)

    # Tournament progress
    matches_played = models.IntegerField(default=0)
    matches_won = models.IntegerField(default=0)
    is_eliminated = models.BooleanField(default=False)
    final_rank = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = [("tournament", "player"), ("tournament", "team")]

    def __str__(self) -> str:
        return f"{self.player.username if self.player else self.team.name} - Seed {self.seed}"


class TournamentMatch(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("bye", "Bye"),
        ("forfeit", "Forfeit"),
    ]

    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="matches")
    round_number = models.IntegerField()
    match_number = models.IntegerField()

    # Participants
    participant1 = models.ForeignKey(
        TournamentParticipant, related_name="matches_as_p1", null=True, on_delete=models.SET_NULL
    )
    participant2 = models.ForeignKey(
        TournamentParticipant, related_name="matches_as_p2", null=True, on_delete=models.SET_NULL
    )

    # Match details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    winner = models.ForeignKey(
        TournamentParticipant,
        related_name="matches_won",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    score = models.CharField(max_length=20, null=True, blank=True)  # e.g., "3-2"
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    # Spectator features
    current_spectators = models.IntegerField(default=0)
    peak_spectators = models.IntegerField(default=0)

    class Meta:
        unique_together = ("tournament", "round_number", "match_number")

    def __str__(self) -> str:
        return f"Match {self.match_number} - Round {self.round_number}"

    def start_match(self) -> None:
        """Start the tournament match"""
        self.status = "in_progress"
        self.start_time = timezone.now()
        self.save()

    def complete_match(self, winner: TournamentParticipant, score: str) -> None:
        """Complete the tournament match"""
        self.status = "completed"
        self.winner = winner
        self.score = score
        self.end_time = timezone.now()

        # Update participant stats
        winner.matches_won += 1
        loser = self.participant2 if winner == self.participant1 else self.participant1

        winner.matches_played += 1
        loser.matches_played += 1

        winner.save()
        loser.save()

        # Check if tournament should advance
        round_matches = self.tournament.matches.filter(round_number=self.round_number)
        if all(m.status == "completed" for m in round_matches):
            self.tournament.advance_round()

        self.save()


class TournamentSpectator(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    match = models.ForeignKey(TournamentMatch, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("user", "match")

    def __str__(self) -> str:
        return f"{self.user.username} watching {self.match}"
