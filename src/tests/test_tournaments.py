import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from ..models.tournaments import (
    Tournament,
    TournamentParticipant,
    TournamentMatch,
    TournamentSpectator,
)
from ..models.social_groups import Team, Clan
from datetime import timedelta


class TestTournament(TestCase):
    def setUp(self):
        # Create test users
        self.users = []
        for i in range(8):  # Create 8 users for a complete bracket
            user = User.objects.create_user(username=f"player{i+1}", password="test123")
            self.users.append(user)

        # Create test clan
        self.clan = Clan.objects.create(name="Test Clan", tag="TST", leader=self.users[0])

        # Create test teams
        self.team1 = Team.objects.create(name="Team Alpha", leader=self.users[0])
        self.team2 = Team.objects.create(name="Team Beta", leader=self.users[1])

        # Create test tournament
        self.tournament = Tournament.objects.create(
            name="Test Tournament",
            description="Test tournament description",
            tournament_type="single_elimination",
            max_participants=8,
            registration_deadline=timezone.now() + timedelta(days=1),
            start_date=timezone.now() + timedelta(days=2),
            prize_pool=1000,
            prize_distribution={"1": 60, "2": 30, "3": 10},
        )

    def test_tournament_creation(self):
        self.assertEqual(self.tournament.status, "registration")
        self.assertEqual(self.tournament.current_round, 0)
        self.assertEqual(self.tournament.participant_count, 0)
        self.assertTrue(isinstance(self.tournament.prize_distribution, dict))

    def test_participant_registration(self):
        # Register individual participants
        participants = []
        for i, user in enumerate(self.users):
            participant = TournamentParticipant.objects.create(
                tournament=self.tournament, player=user, seed=i + 1
            )
            participants.append(participant)

        self.assertEqual(self.tournament.participants.count(), 8)
        self.assertEqual(participants[0].seed, 1)
        self.assertFalse(participants[0].is_eliminated)

    def test_team_tournament(self):
        # Create team tournament
        team_tournament = Tournament.objects.create(
            name="Team Tournament",
            description="Test team tournament",
            tournament_type="single_elimination",
            max_participants=4,
            is_team_based=True,
            registration_deadline=timezone.now() + timedelta(days=1),
            start_date=timezone.now() + timedelta(days=2),
        )

        # Register teams
        team1_participant = TournamentParticipant.objects.create(
            tournament=team_tournament, team=self.team1, seed=1
        )
        team2_participant = TournamentParticipant.objects.create(
            tournament=team_tournament, team=self.team2, seed=2
        )

        self.assertTrue(team_tournament.is_team_based)
        self.assertEqual(team_tournament.participants.count(), 2)
        self.assertIsNotNone(team1_participant.team)
        self.assertIsNone(team1_participant.player)

    def test_bracket_initialization(self):
        # Register 8 participants
        for i, user in enumerate(self.users):
            TournamentParticipant.objects.create(
                tournament=self.tournament, player=user, seed=i + 1
            )

        self.tournament.status = "seeding"
        self.tournament.save()

        # Initialize brackets
        self.tournament.initialize_brackets()

        self.assertEqual(self.tournament.status, "in_progress")
        self.assertEqual(self.tournament.current_round, 1)
        self.assertEqual(self.tournament.total_rounds, 3)  # log2(8) = 3

        # Check first round matches
        first_round_matches = self.tournament.matches.filter(round_number=1)
        self.assertEqual(first_round_matches.count(), 4)

        # Verify seeding
        first_match = first_round_matches.first()
        self.assertEqual(first_match.participant1.seed, 1)
        self.assertEqual(first_match.participant2.seed, 8)

    def test_match_progression(self):
        # Set up tournament with participants and initialize brackets
        for i, user in enumerate(self.users):
            TournamentParticipant.objects.create(
                tournament=self.tournament, player=user, seed=i + 1
            )

        self.tournament.status = "seeding"
        self.tournament.save()
        self.tournament.initialize_brackets()

        # Complete first round matches
        first_round_matches = self.tournament.matches.filter(round_number=1)
        for match in first_round_matches:
            match.start_match()
            match.complete_match(winner=match.participant1, score="2-0")  # Higher seed wins

        # Check second round
        self.assertEqual(self.tournament.current_round, 2)
        second_round_matches = self.tournament.matches.filter(round_number=2)
        self.assertEqual(second_round_matches.count(), 2)

        # Verify winners advanced
        first_match_second_round = second_round_matches.first()
        self.assertEqual(first_match_second_round.participant1.seed, 1)
        self.assertEqual(first_match_second_round.participant2.seed, 4)

    def test_spectator_system(self):
        # Create a match
        match = TournamentMatch.objects.create(
            tournament=self.tournament,
            round_number=1,
            match_number=1,
            participant1=TournamentParticipant.objects.create(
                tournament=self.tournament, player=self.users[0], seed=1
            ),
            participant2=TournamentParticipant.objects.create(
                tournament=self.tournament, player=self.users[1], seed=2
            ),
        )

        # Add spectators
        spectator1 = TournamentSpectator.objects.create(user=self.users[2], match=match)
        spectator2 = TournamentSpectator.objects.create(user=self.users[3], match=match)

        self.assertEqual(TournamentSpectator.objects.filter(match=match).count(), 2)
        self.assertTrue(spectator1.is_active)

        # Test unique constraint
        with self.assertRaises(Exception):
            TournamentSpectator.objects.create(user=self.users[2], match=match)  # Same user

    def test_tournament_completion(self):
        # Set up tournament with participants and initialize brackets
        for i, user in enumerate(self.users):
            TournamentParticipant.objects.create(
                tournament=self.tournament, player=user, seed=i + 1
            )

        self.tournament.status = "seeding"
        self.tournament.save()
        self.tournament.initialize_brackets()

        # Complete all matches
        for round_num in range(1, self.tournament.total_rounds + 1):
            matches = self.tournament.matches.filter(round_number=round_num)
            for match in matches:
                match.start_match()
                match.complete_match(winner=match.participant1, score="2-0")  # Higher seed wins

        # Verify tournament completion
        final_match = self.tournament.matches.filter(
            round_number=self.tournament.total_rounds
        ).first()
        self.assertEqual(final_match.winner.seed, 1)  # Highest seed should win
        self.assertEqual(self.tournament.current_round, self.tournament.total_rounds)

    def test_edge_cases(self):
        # Test tournament with odd number of participants
        odd_tournament = Tournament.objects.create(
            name="Odd Tournament",
            tournament_type="single_elimination",
            max_participants=7,
            registration_deadline=timezone.now() + timedelta(days=1),
            start_date=timezone.now() + timedelta(days=2),
        )

        # Register 7 participants
        for i in range(7):
            TournamentParticipant.objects.create(
                tournament=odd_tournament, player=self.users[i], seed=i + 1
            )

        odd_tournament.status = "seeding"
        odd_tournament.save()
        odd_tournament.initialize_brackets()

        # Verify bye handling
        first_round_matches = odd_tournament.matches.filter(round_number=1)
        bye_match = first_round_matches.filter(status="bye").first()
        self.assertIsNotNone(bye_match)
        self.assertIsNotNone(bye_match.participant1)
        self.assertIsNone(bye_match.participant2)

        # Test cancelling tournament
        self.tournament.status = "cancelled"
        self.tournament.save()

        with self.assertRaises(Exception):
            self.tournament.initialize_brackets()

        # Test match with missing participant
        match = TournamentMatch.objects.create(
            tournament=self.tournament,
            round_number=1,
            match_number=1,
            participant1=None,
            participant2=None,
        )

        self.assertEqual(match.status, "pending")
        with self.assertRaises(Exception):
            match.complete_match(winner=None, score="0-0")
