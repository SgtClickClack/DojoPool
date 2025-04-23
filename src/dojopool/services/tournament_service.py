"""Tournament service module."""

from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload # Import joinedload

from dojopool.models.game import Game
# Import TournamentFormat enum
from dojopool.models.tournament import Tournament, TournamentParticipant, TournamentStatus, TournamentFormat, TournamentMatch
from dojopool.core.extensions import db
import math
import random


class TournamentService:
    """Service for managing tournament operations."""

    def create_tournament(self, data: Dict) -> Tournament:
        """
        Create a new tournament.

        Args:
            data: Tournament data including name, format, rules, etc.

        Returns:
            Tournament: Created tournament
        """
        tournament = Tournament(
            name=data["name"],
            description=data.get("description"),
            start_date=datetime.fromisoformat(data["start_date"]),
            end_date=datetime.fromisoformat(data["end_date"]),
            venue_id=data.get("venue_id"),
            format=data["format"],
            max_players=data.get("max_players"),
            entry_fee=data.get("entry_fee"),
            prize_pool=data.get("prize_pool"),
            rules=data.get("rules"),
        )

        db.session.add(tournament)
        db.session.commit()

        return tournament

    def register_player(
        self, tournament_id: int, player_id: int, seed: Optional[int] = None
    ) -> TournamentParticipant:
        """
        Register a player for a tournament.

        Args:
            tournament_id: Tournament ID
            player_id: Player ID (User ID)
            seed: Optional seed number

        Returns:
            TournamentParticipant: The created registration entry.

        Raises:
            ValueError: If registration is not allowed (closed, full, etc.).
            IntegrityError: If the player is already registered (due to unique constraint).
        """
        tournament = Tournament.query.get_or_404(tournament_id)

        # Check if tournament is open for registration
        # Allow registration if PENDING or explicitly in REGISTRATION status
        if tournament.status not in [TournamentStatus.PENDING.value, TournamentStatus.REGISTRATION.value]:
            raise ValueError(f"Tournament is not open for registration (Status: {tournament.status})")

        # Check registration deadline
        if datetime.utcnow() > tournament.registration_deadline:
             raise ValueError("Registration deadline has passed.")

        # Check if tournament is full (using the relationship count)
        if tournament.max_participants:
            current_players = tournament.participants.count()
            if current_players >= tournament.max_participants:
                raise ValueError("Tournament is full")

        # Check if player is already registered (handled by unique constraint, but check anyway)
        existing_registration = TournamentParticipant.query.filter_by(
            tournament_id=tournament_id, user_id=player_id
        ).first()
        if existing_registration:
            raise ValueError("Player is already registered for this tournament.")

        # Create tournament participant entry
        # Assume payment status is initially 'pending'
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=player_id,
            seed=seed,
            status='registered',
            payment_status='pending' # Default payment status
        )

        try:
            db.session.add(participant)
            db.session.commit()
            return participant
        except IntegrityError as e:
            db.session.rollback()
            # Check if it's the unique constraint violation
            if "_tournament_user_uc" in str(e.orig):
                raise ValueError("Player is already registered for this tournament (Constraint Violation).")
            else:
                # Re-raise other integrity errors
                raise e
        except Exception as e:
            db.session.rollback()
            # Log the error
            print(f"Error registering player {player_id} for tournament {tournament_id}: {e}") # Replace with proper logging
            raise ValueError("An unexpected error occurred during registration.")

    def start_tournament(self, tournament_id: int) -> Tournament:
        """
        Start a tournament, change its status, and generate initial matches/brackets.

        Args:
            tournament_id: Tournament ID

        Returns:
            Tournament: The updated tournament object.

        Raises:
            ValueError: If the tournament cannot be started (wrong status, not enough players).
        """
        tournament = Tournament.query.options(
            joinedload(Tournament.participants) # Eager load participants
        ).get_or_404(tournament_id)

        # Check if tournament can be started (must be PENDING or REGISTRATION)
        if tournament.status not in [TournamentStatus.PENDING.value, TournamentStatus.REGISTRATION.value]:
            raise ValueError(f"Tournament cannot be started (Status: {tournament.status})")

        # Check if registration deadline has passed (optional check, could allow starting early)
        # if datetime.utcnow() < tournament.registration_deadline:
        #     raise ValueError("Registration deadline has not passed yet.")

        # Get registered players, sorted by seed (nulls last), then registration date
        participants = sorted(
            tournament.participants, # Use the eager-loaded relationship
            key=lambda p: (p.seed is None, p.seed, p.registration_date)
        )

        if len(participants) < 2:
            raise ValueError("Cannot start tournament with fewer than 2 participants.")

        # --- Bracket/Match Generation (To be implemented based on format) ---
        if tournament.format == TournamentFormat.SINGLE_ELIMINATION.value:
            self._create_single_elimination_brackets(tournament, participants)
        elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION.value:
            self._create_double_elimination_brackets(tournament, participants)
        elif tournament.format == TournamentFormat.ROUND_ROBIN.value:
            self._create_round_robin_matches(tournament, participants)
        elif tournament.format == TournamentFormat.SWISS.value:
            # self._create_swiss_pairing(tournament, participants, round_number=1)
            pass # Placeholder
        else:
            raise ValueError(f"Unsupported tournament format: {tournament.format}")
        # ---------------------------------------------------------------------

        # Update tournament status
        tournament.status = TournamentStatus.IN_PROGRESS.value

        try:
            # Commit status update AND generated matches
            db.session.commit()
            return tournament
        except Exception as e:
            db.session.rollback()
            print(f"Error starting tournament {tournament_id}: {e}") # Replace with proper logging
            raise ValueError("An unexpected error occurred while starting the tournament.")

    def complete_match(self, tournament_id: int, match_id: int, winner_id: int, score: str):
        """
        Complete a tournament match, update statuses, and advance winner.

        Args:
            tournament_id: Tournament ID (consider removing if match_id is globally unique)
            match_id: ID of the match being completed
            winner_id: User ID of the winning player
            score: Final score string (e.g., "7-5")
        """
        # Fetch match and related data eagerly
        match = TournamentMatch.query.options(
            joinedload(TournamentMatch.tournament).joinedload(Tournament.participants), # Load tournament and its participants
            joinedload(TournamentMatch.player1),
            joinedload(TournamentMatch.player2)
        ).get(match_id)

        if not match:
            raise ValueError(f"Match with ID {match_id} not found.")

        if match.tournament_id != tournament_id:
             raise ValueError("Match does not belong to the specified tournament.")

        if match.status == TournamentStatus.COMPLETED.value:
            raise ValueError("Match is already completed.")

        tournament = match.tournament
        if tournament.status != TournamentStatus.IN_PROGRESS.value:
             raise ValueError("Tournament is not in progress.")

        # Validate winner ID
        if winner_id not in [match.player1_id, match.player2_id]:
            raise ValueError("Winner ID is not one of the players in this match.")

        loser_id = match.player2_id if winner_id == match.player1_id else match.player1_id

        # Update match details
        match.status = TournamentStatus.COMPLETED.value
        match.winner_id = winner_id
        match.score = score
        match.end_time = datetime.utcnow()

        eliminated = False # Flag to track if the loser is fully eliminated

        # Format-Specific Logic
        if tournament.format == TournamentFormat.SINGLE_ELIMINATION.value:
            loser_participant = next((p for p in tournament.participants if p.user_id == loser_id), None)
            if loser_participant:
                loser_participant.status = 'eliminated'
                eliminated = True
            self._advance_single_elimination_winner(tournament, match, winner_id)

        elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION.value:
            if match.bracket_type == 'winners':
                # Winner advances in winners bracket
                self._advance_winner_bracket(tournament, match, winner_id)
                # Loser drops to losers bracket
                self._drop_to_losers_bracket(tournament, match, loser_id)
            elif match.bracket_type == 'losers':
                # Winner advances in losers bracket
                self._advance_loser_bracket(tournament, match, winner_id)
                # Loser is eliminated
                loser_participant = next((p for p in tournament.participants if p.user_id == loser_id), None)
                if loser_participant:
                    loser_participant.status = 'eliminated'
                    eliminated = True
            else:
                print(f"Warning: Unknown bracket type '{match.bracket_type}' for match {match_id} in DE tournament.")

        elif tournament.format == TournamentFormat.ROUND_ROBIN.value:
            # No advancement, just mark match complete. Loser status doesn't change here.
            pass

        # Update loser participant status if they were eliminated
        if eliminated:
            loser_participant = next((p for p in tournament.participants if p.user_id == loser_id), None)
            if loser_participant:
                 # Ensure status is set if helper methods didn't already
                 if loser_participant.status != 'eliminated':
                      loser_participant.status = 'eliminated'
                 print(f"User {loser_id} eliminated from tournament {tournament.id}.")
            else:
                 print(f"Warning: Loser participant record {loser_id} not found for final status update.")

        # Check if tournament is complete (logic now resides in _check_tournament_completion)
        self._check_tournament_completion(tournament)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error completing match {match_id}: {e}") # Replace with proper logging
            raise ValueError("An unexpected error occurred while completing the match.")

    def _advance_single_elimination_winner(self, tournament: Tournament, completed_match: TournamentMatch, winner_id: int):
        """Handles advancing the winner in a single elimination bracket."""
        current_round = completed_match.round
        # Determine the match number in the *next* round the winner advances to
        next_round_match_number = math.ceil(completed_match.match_number / 2)
        next_round = current_round + 1

        # Find if the corresponding match in the next round already exists
        next_match = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            round=next_round,
            match_number=next_round_match_number
        ).first()

        if next_match:
            # Match exists, fill the empty player slot
            if next_match.player1_id is None:
                next_match.player1_id = winner_id
                print(f"Advancing User {winner_id} to Round {next_round} Match {next_round_match_number} as Player 1.")
            elif next_match.player2_id is None:
                next_match.player2_id = winner_id
                print(f"Advancing User {winner_id} to Round {next_round} Match {next_round_match_number} as Player 2.")
            else:
                # This shouldn't happen in single elimination if logic is correct
                print(f"Error: Next match {next_round_match_number} in round {next_round} is already full.")
                return
            # If both players are now filled, the match becomes scheduled
            if next_match.player1_id and next_match.player2_id:
                next_match.status = 'scheduled'
        else:
            # Match doesn't exist, create it with the winner as player1
            new_match = TournamentMatch(
                tournament_id=tournament.id,
                round=next_round,
                match_number=next_round_match_number,
                player1_id=winner_id,
                player2_id=None, # Wait for the other winner
                status='pending' # Status indicates waiting for opponent
            )
            db.session.add(new_match)
            print(f"Creating Round {next_round} Match {next_round_match_number} with User {winner_id} as Player 1.")

    def _advance_winner_bracket(self, tournament: Tournament, completed_match: TournamentMatch, winner_id: int):
        """Handles advancing the winner in the winners bracket."""
        current_round = completed_match.round
        # Same advancement logic as single elimination for winners bracket
        next_round_match_number = math.ceil(completed_match.match_number / 2)
        next_round = current_round + 1

        # Find or create the next match
        next_match = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            round=next_round,
            match_number=next_round_match_number,
            bracket_type='winners' # Ensure it's the winners bracket match
        ).first()

        if next_match:
            if next_match.player1_id is None:
                next_match.player1_id = winner_id
                print(f"Advancing User {winner_id} to Winners R{next_round} M{next_round_match_number} as Player 1.")
            elif next_match.player2_id is None:
                next_match.player2_id = winner_id
                print(f"Advancing User {winner_id} to Winners R{next_round} M{next_round_match_number} as Player 2.")
            else:
                print(f"Error: Next winners match {next_round_match_number} in round {next_round} is already full.")
                return
            # If both players are now filled, the match becomes scheduled
            if next_match.player1_id and next_match.player2_id:
                next_match.status = 'scheduled'
        else:
            # Create the next round match if it doesn't exist
            new_match = TournamentMatch(
                tournament_id=tournament.id,
                round=next_round,
                match_number=next_round_match_number,
                bracket_type='winners',
                player1_id=winner_id,
                player2_id=None,
                status='pending' # Waiting for opponent
            )
            db.session.add(new_match)
            print(f"Creating Winners R{next_round} M{next_round_match_number} with User {winner_id} as Player 1.")

    def _drop_to_losers_bracket(self, tournament: Tournament, completed_match: TournamentMatch, loser_id: int):
        """Determines the appropriate losers bracket match for a player dropping from the winners bracket."""
        winners_round = completed_match.round
        winners_match_num = completed_match.match_number

        # Standard DE bracket logic for determining loser bracket placement
        # Losers from winners round WR drop into losers round LR = 2*WR - 1 or LR = 2*WR
        # Exact mapping depends on the specific bracket structure (e.g., Challonge standard)

        # Simplified logic (may need refinement for specific bracket structures):
        # Losers of WR 1 go to LR 1
        # Losers of WR 2 go to LR 3
        # Losers of WR 3 go to LR 5
        # Losers of WR k go to LR 2k-1
        losers_round = (winners_round * 2) - 1

        # Determine match number in losers round
        # Losers of WR M1 and M2 feed into LR M1
        # Losers of WR M3 and M4 feed into LR M2
        # Loser of WR Mk feeds into LR ceil(k/2)
        losers_match_num = math.ceil(winners_match_num / 2)

        # Find or create the target losers bracket match
        target_match = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            round=losers_round,
            match_number=losers_match_num,
            bracket_type='losers'
        ).first()

        if target_match:
            # Match exists, fill the empty player slot
            if target_match.player1_id is None:
                target_match.player1_id = loser_id
                print(f"Dropping User {loser_id} to Losers R{losers_round} M{losers_match_num} as Player 1.")
            elif target_match.player2_id is None:
                target_match.player2_id = loser_id
                print(f"Dropping User {loser_id} to Losers R{losers_round} M{losers_match_num} as Player 2.")
            else:
                print(f"Error: Target losers match {losers_match_num} in round {losers_round} is already full.")
                return
            # If both players are now filled, the match becomes scheduled
            if target_match.player1_id and target_match.player2_id:
                target_match.status = 'scheduled'
        else:
            # Create the losers bracket match
            new_match = TournamentMatch(
                tournament_id=tournament.id,
                round=losers_round,
                match_number=losers_match_num,
                bracket_type='losers',
                player1_id=loser_id, # Place loser in first available slot
                player2_id=None,
                status='pending' # Waiting for opponent from losers bracket
            )
            db.session.add(new_match)
            print(f"Creating Losers R{losers_round} M{losers_match_num} with User {loser_id} as Player 1.")

    def _advance_loser_bracket(self, tournament: Tournament, completed_match: TournamentMatch, winner_id: int):
        """Handles advancing the winner in the losers bracket."""
        current_round = completed_match.round
        current_match_num = completed_match.match_number

        # Determine next match in losers bracket
        # Winner of LR M advances to LR+1, ceil(M/2)
        next_round = current_round + 1
        next_match_num = math.ceil(current_match_num / 2)

        # Check if this advancement leads to the Grand Final
        # This happens when the winner of the Losers Bracket Final advances.
        # Detecting the LB Final requires knowing the total number of rounds/matches.
        # This is complex, let's handle basic advancement first.
        # We might need a separate check or logic for the Grand Final transition.

        # Find or create the next match
        next_match = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            round=next_round,
            match_number=next_match_num,
            bracket_type='losers' # Still in losers bracket (usually)
        ).first()

        if next_match:
            # Match exists, fill the empty player slot
            if next_match.player1_id is None:
                next_match.player1_id = winner_id
                print(f"Advancing User {winner_id} to Losers R{next_round} M{next_match_num} as Player 1.")
            elif next_match.player2_id is None:
                next_match.player2_id = winner_id
                print(f"Advancing User {winner_id} to Losers R{next_round} M{next_match_num} as Player 2.")
            else:
                print(f"Error: Next losers match {next_match_num} in round {next_round} is already full.")
                return
            # If both players are now filled, the match becomes scheduled
            if next_match.player1_id and next_match.player2_id:
                next_match.status = 'scheduled'
        else:
            # Create the next round match if it doesn't exist
            # This could be the Losers Final feeding into Grand Final, needs careful handling.
            # Let's assume for now we just create the next losers match placeholder.
            # Grand Final logic might need specific handling in _check_tournament_completion.
            new_match = TournamentMatch(
                tournament_id=tournament.id,
                round=next_round,
                match_number=next_match_num,
                bracket_type='losers',
                player1_id=winner_id,
                player2_id=None,
                status='pending' # Waiting for opponent
            )
            db.session.add(new_match)
            print(f"Creating Losers R{next_round} M{next_match_num} with User {winner_id} as Player 1.")

    def _check_tournament_completion(self, tournament: Tournament):
        """Check if tournament is complete and update status."""
        if tournament.status != TournamentStatus.IN_PROGRESS.value:
            return # Only check if in progress

        completion_status_updated = False

        # Single Elimination Check
        if tournament.format == TournamentFormat.SINGLE_ELIMINATION.value:
            max_round = db.session.query(db.func.max(TournamentMatch.round)).filter(
                TournamentMatch.tournament_id == tournament.id
            ).scalar()
            if max_round:
                final_match = TournamentMatch.query.filter_by(
                    tournament_id=tournament.id,
                    round=max_round,
                    match_number=1
                ).first()
                if final_match and final_match.status == TournamentStatus.COMPLETED.value:
                    tournament.status = TournamentStatus.COMPLETED.value
                    tournament.end_date = final_match.end_time or datetime.utcnow()
                    completion_status_updated = True
                    print(f"Tournament {tournament.id} (SE) completed. Winner: {final_match.winner_id}")

        # Round Robin Check
        elif tournament.format == TournamentFormat.ROUND_ROBIN.value:
            incomplete_matches = TournamentMatch.query.filter(
                TournamentMatch.tournament_id == tournament.id,
                TournamentMatch.status != TournamentStatus.COMPLETED.value
            ).count()

            if incomplete_matches == 0:
                tournament.status = TournamentStatus.COMPLETED.value
                # Find the latest match end time for the tournament end date
                latest_match_end_time = db.session.query(db.func.max(TournamentMatch.end_time)).filter(
                    TournamentMatch.tournament_id == tournament.id
                ).scalar()
                tournament.end_date = latest_match_end_time or datetime.utcnow()
                completion_status_updated = True
                print(f"Tournament {tournament.id} (RR) completed. All matches finished.")

        # Double Elimination Check
        elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION.value:
            # Find the highest round number in both winners and losers brackets
            max_winners_round = db.session.query(db.func.max(TournamentMatch.round)).filter(
                TournamentMatch.tournament_id == tournament.id,
                TournamentMatch.bracket_type == 'winners'
            ).scalar() or 0

            max_losers_round = db.session.query(db.func.max(TournamentMatch.round)).filter(
                TournamentMatch.tournament_id == tournament.id,
                TournamentMatch.bracket_type == 'losers'
            ).scalar() or 0

            # The Grand Final is typically match 1 in the round after the max winners round
            # Or it might have a specific round number or bracket_type like 'grand_final'
            # Assuming grand final happens at round = max_winners_round + 1, match 1
            grand_final_round = max_winners_round + 1 # Potential round for GF

            grand_final_match = TournamentMatch.query.filter_by(
                tournament_id=tournament.id,
                round=grand_final_round, # Check potential GF round
                match_number=1
                # Consider adding bracket_type='grand_final' if using that convention
            ).first()

            # Check if the grand final match exists and is completed
            if grand_final_match and grand_final_match.status == TournamentStatus.COMPLETED.value:
                # In DE, a bracket reset might be needed if the loser bracket winner wins the first GF match.
                # For simplicity now, assume tournament ends after the first GF match is complete.
                # A more robust implementation needs to handle potential bracket reset.
                tournament.status = TournamentStatus.COMPLETED.value
                tournament.end_date = grand_final_match.end_time or datetime.utcnow()
                completion_status_updated = True
                print(f"Tournament {tournament.id} (DE) completed. Winner: {grand_final_match.winner_id}")

        # Add logic for other formats
        # elif tournament.format == TournamentFormat.SWISS.value:
            # ... implementation ...

        # if completion_status_updated:
            # Potentially trigger notifications, prize distribution, etc.
            # pass

    def get_standings(self, tournament_id: int) -> List[Dict]:
        """
        Get tournament standings.

        Args:
            tournament_id: Tournament ID

        Returns:
            List[Dict]: List of player standings
        """
        tournament = Tournament.query.get_or_404(tournament_id)

        participants = TournamentParticipant.query.filter_by(tournament_id=tournament_id).all()

        standings = []
        for p in participants:
            placement = tournament.get_player_placement(p.user_id)
            standings.append({
                "user_id": p.user_id,
                "username": p.user.username, # Assumes User model has username
                "status": p.status,
                "seed": p.seed,
                "placement": placement
            })

        # Sort standings by placement if available, otherwise by seed or registration
        standings.sort(key=lambda x: (x["placement"] is None, x["placement"], x["seed"] is None, x["seed"]))

        return standings

    # --- Bracket/Match Generation Methods --- #

    def _create_single_elimination_brackets(
        self, tournament: Tournament, participants: List[TournamentParticipant]
    ):
        """Creates the first round of matches for a single elimination bracket."""
        num_participants = len(participants)
        if num_participants < 2:
            return # Should have been caught earlier, but defensive check

        # Shuffle participants after sorting by seed if seeding is not strict pairing
        # If seeds determine initial matchups (1 vs N, 2 vs N-1), don't shuffle.
        # Let's assume seeds determine pairings for now.
        # random.shuffle(participants)

        # Calculate number of byes needed for power of 2
        next_power_of_2 = 2**math.ceil(math.log2(num_participants))
        num_byes = next_power_of_2 - num_participants
        num_first_round_matches = (num_participants - num_byes) // 2

        print(f"Creating SE Round 1 for {num_participants} participants. Byes: {num_byes}, Matches: {num_first_round_matches}")

        matches_to_add = []
        participant_index = 0

        # Assign byes to top seeds (first in the sorted list)
        for i in range(num_byes):
            top_seed_participant = participants[participant_index]
            # How to represent a bye? Create a match with player1 and player2=None?
            # Or advance the player directly? Let's advance directly for now.
            # This requires tracking player status ('advanced', 'eliminated') on TournamentParticipant
            # Need to add/check status updates later in complete_match.
            print(f"Assigning Bye to Seed {i+1}: User {top_seed_participant.user_id}")
            # top_seed_participant.status = 'advanced_round1' # Or similar concept
            participant_index += 1

        # Create matches for the remaining players
        match_number_in_round = 1
        while participant_index < num_participants:
            player1 = participants[participant_index]
            player2 = participants[participant_index + 1]

            match = TournamentMatch(
                tournament_id=tournament.id,
                round=1,
                match_number=match_number_in_round,
                player1_id=player1.user_id,
                player2_id=player2.user_id,
                status='scheduled' # Initial status
            )
            matches_to_add.append(match)
            print(f"Creating Match {match_number_in_round}: User {player1.user_id} vs User {player2.user_id}")

            participant_index += 2
            match_number_in_round += 1

        if matches_to_add:
            db.session.add_all(matches_to_add)
            # Note: commit happens in start_tournament after all generation is done.

    def _create_double_elimination_brackets(
        self, tournament: Tournament, participants: List[TournamentParticipant]
    ):
        """Creates the first round of the winners' bracket for double elimination."""
        num_participants = len(participants)
        if num_participants < 2:
            return

        # Calculate byes and matches for the first round (winners bracket)
        next_power_of_2 = 2**math.ceil(math.log2(num_participants))
        num_byes = next_power_of_2 - num_participants
        num_first_round_matches = (num_participants - num_byes) // 2

        print(f"Creating DE Winners Round 1 for {num_participants} participants. Byes: {num_byes}, Matches: {num_first_round_matches}")

        matches_to_add = []
        participant_index = 0

        # Assign byes to top seeds
        # Winners of byes automatically advance to winners round 2
        # Losers of byes...? In DE, there are no losers of byes, they just advance.
        for i in range(num_byes):
            top_seed_participant = participants[participant_index]
            print(f"Assigning Bye (Winners R1) to Seed {i+1}: User {top_seed_participant.user_id}")
            # Need logic to create the R2 match they advance to, potentially placeholder
            # This is complex, handle advancement fully in complete_match/advance methods for now.
            # self._advance_winner_bracket(tournament, None, top_seed_participant.user_id, 1) # Simulate bye completion?
            participant_index += 1

        # Create matches for the remaining players in winners round 1
        match_number_in_round = 1
        while participant_index < num_participants:
            player1 = participants[participant_index]
            player2 = participants[participant_index + 1]

            match = TournamentMatch(
                tournament_id=tournament.id,
                round=1, # Winners Round 1
                match_number=match_number_in_round,
                bracket_type='winners', # Set bracket type
                player1_id=player1.user_id,
                player2_id=player2.user_id,
                status='scheduled'
            )
            matches_to_add.append(match)
            print(f"Creating Winners R1 Match {match_number_in_round}: User {player1.user_id} vs User {player2.user_id}")

            participant_index += 2
            match_number_in_round += 1

        if matches_to_add:
            db.session.add_all(matches_to_add)
            # Commit happens in start_tournament

    def _create_round_robin_matches(
       self, tournament: Tournament, participants: List[TournamentParticipant]
    ):
        """Creates all matches for a round robin tournament."""
        num_participants = len(participants)
        if num_participants < 2:
            return

        print(f"Creating Round Robin matches for {num_participants} participants.")
        matches_to_add = []
        match_number_in_round = 1 # Round Robin can be considered one large round

        for i in range(num_participants):
            for j in range(i + 1, num_participants):
                player1 = participants[i]
                player2 = participants[j]

                match = TournamentMatch(
                    tournament_id=tournament.id,
                    round=1, # Use round 1 for all RR matches
                    match_number=match_number_in_round,
                    player1_id=player1.user_id,
                    player2_id=player2.user_id,
                    status='scheduled'
                )
                matches_to_add.append(match)
                print(f"Creating RR Match {match_number_in_round}: User {player1.user_id} vs User {player2.user_id}")
                match_number_in_round += 1

        if matches_to_add:
            db.session.add_all(matches_to_add)
            # Commit happens in start_tournament

    # ... placeholder methods for other formats ...

    # ... complete_match (needs update for RR completion check) ...
    # ... get_standings ...
