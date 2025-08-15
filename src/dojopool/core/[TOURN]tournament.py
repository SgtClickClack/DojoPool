"""Tournament service module for managing tournaments and brackets."""

import math
import random
from typing import Dict, List

from ..models import Tournament, TournamentMatch, db
from ..models.tournament import TournamentFormat, TournamentStatus


class TournamentService:
    """Service class for tournament management."""

    @staticmethod
    def create_tournament(data: Dict) -> Tournament:
        """Create a new tournament."""
        tournament = Tournament(**data)
        db.session.add(tournament)
        db.session.commit()
        return tournament

    @staticmethod
    def start_tournament(tournament_id: int) -> Tournament:
        """Start a tournament and generate initial brackets."""
        tournament = Tournament.query.get_or_404(tournament_id)

        if tournament.status != TournamentStatus.REGISTRATION:
            raise ValueError("Tournament must be in registration status to start")

        if tournament.current_participants_count < 2:
            raise ValueError("Tournament needs at least 2 participants to start")

        # Generate brackets based on tournament format
        if tournament.format == TournamentFormat.SINGLE_ELIMINATION:
            TournamentService._generate_single_elimination_brackets(tournament)
        elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION:
            TournamentService._generate_double_elimination_brackets(tournament)
        elif tournament.format == TournamentFormat.ROUND_ROBIN:
            TournamentService._generate_round_robin_brackets(tournament)
        elif tournament.format == TournamentFormat.SWISS:
            TournamentService._generate_swiss_brackets(tournament)

        tournament.status = TournamentStatus.IN_PROGRESS
        db.session.commit()

        return tournament

    @staticmethod
    def _generate_single_elimination_brackets(tournament: Tournament):
        """Generate single elimination tournament brackets."""
        participants = tournament.participants.all()
        random.shuffle(participants)  # Randomize seeding if not pre-seeded

        # Calculate number of rounds needed
        num_participants = len(participants)
        num_rounds = math.ceil(math.log2(num_participants))

        # Calculate number of byes needed
        total_slots = 2**num_rounds
        num_byes = total_slots - num_participants

        # Create first round matches
        matches = []
        match_number = 1

        for i in range(0, num_participants - num_byes, 2):
            match = TournamentMatch(
                tournament_id=tournament.id,
                round_number=1,
                match_number=match_number,
                player1_id=participants[i].id,
                player2_id=participants[i + 1].id if i + 1 < num_participants else None,
                status="pending",
            )
            matches.append(match)
            match_number += 1

        # Add matches with byes
        for i in range(num_participants - num_byes, num_participants):
            match = TournamentMatch(
                tournament_id=tournament.id,
                round_number=1,
                match_number=match_number,
                player1_id=participants[i].id,
                player2_id=None,  # Bye
                status="pending",
            )
            matches.append(match)
            match_number += 1

        db.session.add_all(matches)
        db.session.commit()

    @staticmethod
    def _generate_double_elimination_brackets(tournament: Tournament):
        """Generate double elimination tournament brackets."""
        # Similar to single elimination but with losers bracket
        participants = tournament.participants.all()
        random.shuffle(participants)

        # Generate winners bracket (similar to single elimination)
        TournamentService._generate_single_elimination_brackets(tournament)

        # Add placeholder matches for losers bracket
        num_participants = len(participants)
        num_rounds = math.ceil(math.log2(num_participants))

        losers_matches = []
        match_number = 1

        # Create initial losers bracket matches
        for round_num in range(1, num_rounds):
            num_matches = 2 ** (num_rounds - round_num - 1)
            for _i in range(num_matches):
                match = TournamentMatch(
                    tournament_id=tournament.id,
                    round_number=-round_num,  # Negative numbers for losers bracket
                    match_number=match_number,
                    status="pending",
                )
                losers_matches.append(match)
                match_number += 1

        db.session.add_all(losers_matches)
        db.session.commit()

    @staticmethod
    def _generate_round_robin_brackets(tournament: Tournament):
        """Generate round robin tournament schedule."""
        participants = tournament.participants.all()
        num_participants = len(participants)

        if num_participants % 2 != 0:
            # Add a "bye" participant for odd number of players
            num_participants += 1

        num_rounds = num_participants - 1
        matches_per_round = num_participants // 2

        # Create schedule using circle method
        schedule = []
        players = list(range(num_participants))

        for round_num in range(num_rounds):
            round_matches = []
            for i in range(matches_per_round):
                player1_idx = players[i]
                player2_idx = players[-i - 1]

                if player1_idx < len(participants) and player2_idx < len(participants):
                    match = TournamentMatch(
                        tournament_id=tournament.id,
                        round_number=round_num + 1,
                        match_number=i + 1,
                        player1_id=participants[player1_idx].id,
                        player2_id=participants[player2_idx].id,
                        status="pending",
                    )
                    round_matches.append(match)

            # Rotate players for next round (keep first player fixed)
            players = [players[0]] + [players[-1]] + players[1:-1]
            schedule.extend(round_matches)

        db.session.add_all(schedule)
        db.session.commit()

    @staticmethod
    def _generate_swiss_brackets(tournament: Tournament):
        """Generate initial Swiss tournament pairings."""
        participants = tournament.participants.all()
        random.shuffle(participants)  # Random initial pairings

        num_participants = len(participants)
        math.floor(math.log2(num_participants))  # Recommended rounds for Swiss

        # Create first round matches
        matches = []
        for i in range(0, num_participants - 1, 2):
            match = TournamentMatch(
                tournament_id=tournament.id,
                round_number=1,
                match_number=(i // 2) + 1,
                player1_id=participants[i].id,
                player2_id=participants[i + 1].id if i + 1 < num_participants else None,
                status="pending",
            )
            matches.append(match)

        db.session.add_all(matches)
        db.session.commit()

    @staticmethod
    def update_brackets(tournament_id: int, match_id: int) -> None:
        """Update tournament brackets after a match is completed."""
        tournament = Tournament.query.get_or_404(tournament_id)
        match = TournamentMatch.query.get_or_404(match_id)

        if match.status != "completed":
            raise ValueError("Match must be completed to update brackets")

        if tournament.format == TournamentFormat.SINGLE_ELIMINATION:
            TournamentService._update_single_elimination_brackets(tournament, match)
        elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION:
            TournamentService._update_double_elimination_brackets(tournament, match)
        elif tournament.format == TournamentFormat.SWISS:
            TournamentService._update_swiss_brackets(tournament, match)

        # Check if tournament is completed
        TournamentService._check_tournament_completion(tournament)

    @staticmethod
    def _update_single_elimination_brackets(
        tournament: Tournament, completed_match: TournamentMatch
    ) -> None:
        """Update single elimination brackets after a match."""
        if not completed_match.winner_id:
            raise ValueError("Completed match must have a winner")

        # Find the next match in the bracket
        next_round = completed_match.round_number + 1
        next_match_number = (completed_match.match_number + 1) // 2

        next_match = TournamentMatch.query.filter_by(
            tournament_id=tournament.id, round_number=next_round, match_number=next_match_number
        ).first()

        if next_match:
            # Determine which player slot to fill
            if completed_match.match_number % 2 == 1:
                next_match.player1_id = completed_match.winner_id
            else:
                next_match.player2_id = completed_match.winner_id

            db.session.commit()

    @staticmethod
    def _update_double_elimination_brackets(
        tournament: Tournament, completed_match: TournamentMatch
    ) -> None:
        """Update double elimination brackets after a match."""
        if not completed_match.winner_id:
            raise ValueError("Completed match must have a winner")

        # Handle winners bracket
        if completed_match.round_number > 0:
            TournamentService._update_single_elimination_brackets(tournament, completed_match)

            # Move loser to losers bracket
            loser_id = (
                completed_match.player1_id
                if completed_match.winner_id == completed_match.player2_id
                else completed_match.player2_id
            )

            # Find appropriate losers bracket match
            losers_round = -completed_match.round_number
            losers_match = (
                TournamentMatch.query.filter_by(
                    tournament_id=tournament.id, round_number=losers_round
                )
                .filter((TournamentMatch.player1_id is None) | (TournamentMatch.player2_id is None))
                .first()
            )

            if losers_match:
                if not losers_match.player1_id:
                    losers_match.player1_id = loser_id
                else:
                    losers_match.player2_id = loser_id
                db.session.commit()

        # Handle losers bracket
        else:
            next_round = completed_match.round_number - 1
            next_match_number = (completed_match.match_number + 1) // 2

            next_match = TournamentMatch.query.filter_by(
                tournament_id=tournament.id, round_number=next_round, match_number=next_match_number
            ).first()

            if next_match:
                if not next_match.player1_id:
                    next_match.player1_id = completed_match.winner_id
                else:
                    next_match.player2_id = completed_match.winner_id
                db.session.commit()

    @staticmethod
    def _update_swiss_brackets(tournament: Tournament, completed_match: TournamentMatch) -> None:
        """Update Swiss tournament after a round is completed."""
        # Check if the round is complete
        incomplete_matches = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            round_number=completed_match.round_number,
            status="in_progress",
        ).count()

        if incomplete_matches == 0:
            # Generate next round pairings
            participants = tournament.participants.all()
            # Sort by number of wins
            participants.sort(key=lambda p: p.matches_won, reverse=True)

            next_round = completed_match.round_number + 1
            matches = []

            # Pair players with similar scores
            for i in range(0, len(participants) - 1, 2):
                match = TournamentMatch(
                    tournament_id=tournament.id,
                    round_number=next_round,
                    match_number=(i // 2) + 1,
                    player1_id=participants[i].id,
                    player2_id=participants[i + 1].id,
                    status="pending",
                )
                matches.append(match)

            db.session.add_all(matches)
            db.session.commit()

    @staticmethod
    def _check_tournament_completion(tournament: Tournament) -> None:
        """Check if tournament is completed and update status."""
        incomplete_matches = TournamentMatch.query.filter_by(
            tournament_id=tournament.id, status="pending"
        ).count()

        if incomplete_matches == 0:
            tournament.status = TournamentStatus.COMPLETED
            db.session.commit()

    @staticmethod
    def get_standings(tournament_id: int) -> List[Dict]:
        """Get current tournament standings."""
        tournament = Tournament.query.get_or_404(tournament_id)
        participants = tournament.participants.all()

        standings = []
        for participant in participants:
            standing = {
                "participant_id": participant.id,
                "user_id": participant.user_id,
                "username": participant.user.username,
                "matches_played": participant.matches_played,
                "matches_won": participant.matches_won,
                "matches_lost": participant.matches_lost,
                "win_percentage": (
                    participant.matches_won / participant.matches_played * 100
                    if participant.matches_played > 0
                    else 0
                ),
            }
            standings.append(standing)

        # Sort by wins, then win percentage
        standings.sort(key=lambda x: (x["matches_won"], x["win_percentage"]), reverse=True)
        return standings
