"""Tournament service module."""

from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload # Import joinedload

from dojopool.core.tournaments.models import Tournament, TournamentParticipant, TournamentStatus, TournamentFormat, TournamentMatch
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
            # pass # Placeholder
            self._create_swiss_pairing(tournament, participants, round_number=1)
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
            # Check if this is the first Grand Final match
            if match.bracket_type == 'grand_final':
                wb_winner_id = match.player1_id # P1 is WB winner
                lb_winner_id = match.player2_id # P2 is LB winner
                if winner_id == wb_winner_id:
                    # WB winner won GF, tournament is over.
                    # Completion status is set later in the common check.
                    print(f"Grand Final (1) completed. WB Winner {winner_id} wins tournament.")
                    # Mark LB winner as eliminated (technically runner-up)
                    loser_participant = next((p for p in tournament.participants if p.user_id == lb_winner_id), None)
                    if loser_participant: loser_participant.status = 'eliminated' # or 'runner-up'
                elif winner_id == lb_winner_id:
                    # LB winner won GF, force a bracket reset (create second GF match)
                    print(f"Grand Final (1) completed. LB Winner {winner_id} forces bracket reset.")
                    # Mark WB winner participant as having one loss (status doesn't track losses directly)
                    # Create the reset match
                    self._create_grand_final_reset(tournament, match)
                else:
                     print(f"Warning: Unexpected winner {winner_id} in Grand Final match {match_id}")

            elif match.bracket_type == 'grand_final_reset':
                # The second GF match completion determines the winner
                print(f"Grand Final (Reset) completed. Winner {winner_id} wins tournament.")
                loser_id = match.player2_id if winner_id == match.player1_id else match.player1_id
                loser_participant = next((p for p in tournament.participants if p.user_id == loser_id), None)
                if loser_participant: loser_participant.status = 'eliminated' # or 'runner-up'
                # Completion status handled later

            elif match.bracket_type == 'winners':
                # Regular WB match
                self._advance_winner_bracket(tournament, match, winner_id)
                self._drop_to_losers_bracket(tournament, match, loser_id)
                # Loser is not eliminated yet

            elif match.bracket_type == 'losers':
                # Regular LB match
                self._advance_loser_bracket(tournament, match, winner_id)
                # Loser is eliminated
                loser_participant = next((p for p in tournament.participants if p.user_id == loser_id), None)
                if loser_participant:
                    loser_participant.status = 'eliminated'
                    eliminated = True # Track elimination for potential later use
                else:
                    print(f"Warning: Could not find participant record for loser {loser_id} in LB match {match_id}")
            else:
                print(f"Warning: Unknown bracket type '{match.bracket_type}' for match {match_id} in DE tournament.")

        elif tournament.format == TournamentFormat.ROUND_ROBIN.value:
            # No advancement, just mark match complete. Loser status doesn't change here.
            pass

        elif tournament.format == TournamentFormat.SWISS.value:
            # No direct advancement, scores determine next round pairings.
            # Loser status doesn't change here unless specific rules apply.
            pass # Score calculation happens when pairing for next round

        # --- Check for Round/Tournament Completion --- (Common logic + format specifics)
        is_round_complete = False
        is_tournament_complete = False

        if tournament.format == TournamentFormat.SWISS.value:
            # Check if all matches for the *current* round are completed
            current_round_matches = TournamentMatch.query.filter_by(
                tournament_id=tournament.id,
                round=match.round # Check matches from the round just completed
            ).all()
            if all(m.status == TournamentStatus.COMPLETED.value for m in current_round_matches):
                is_round_complete = True
                # Determine if enough rounds have been played (e.g., based on player count)
                # TODO: Replace with proper logic based on tournament settings/rules
                num_players = tournament.participants.count()
                required_rounds = math.ceil(math.log2(num_players)) # Example: log2(N) rounds
                if match.round >= required_rounds:
                    is_tournament_complete = True
                else:
                    # Trigger next round pairing
                    next_round_number = match.round + 1
                    participants = tournament.participants.all() # Get all participants
                    self._create_swiss_pairing(tournament, participants, next_round_number)
                    print(f"Swiss round {match.round} complete. Pairing initiated for round {next_round_number}.")

        else:
            # Check completion for other formats
            is_tournament_complete = self._check_tournament_completion(tournament)


        # Update tournament status if completed
        if is_tournament_complete:
            tournament.status = TournamentStatus.COMPLETED.value
            print(f"Tournament {tournament.id} completed.")
            # Could trigger final standings calculation or notifications here

        try:
            db.session.commit() # Commit match update, status updates, and potentially new matches
        except Exception as e:
            db.session.rollback()
            print(f"Error completing match {match_id} or proceeding: {e}")
            raise ValueError("An error occurred while finalizing the match completion.")

    def _create_grand_final_reset(self, tournament: Tournament, first_gf_match: TournamentMatch):
        """Creates the second Grand Final (reset) match."""
        # Players are the same as the first GF, but match type indicates it's the reset
        reset_match = TournamentMatch(
            tournament_id=tournament.id,
            round=first_gf_match.round + 1, # Typically next round, or same round + high match number
            match_number=1, # Or 2 if GF1 was 1
            bracket_type='grand_final_reset', # Specific type
            player1_id=first_gf_match.player1_id, # Keep players the same
            player2_id=first_gf_match.player2_id,
            status=TournamentStatus.PENDING.value # Immediately ready
        )
        db.session.add(reset_match)
        print(f"Created Grand Final Reset match (R{reset_match.round} M{reset_match.match_number}) between {reset_match.player1_id} and {reset_match.player2_id}")

    def _advance_single_elimination_winner(self, tournament: Tournament, completed_match: TournamentMatch, winner_id: int):
        """Find or create the next match for the winner in a single elimination bracket."""
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
                next_match.status = TournamentStatus.PENDING.value
                print(f"Match R{next_round} M{next_round_match_number} is now ready.")

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
        """Advance the winner in the winner's bracket and potentially create the Grand Final."""
        current_round = completed_match.round
        next_round = current_round + 1
        # Calculate the match number in the next round
        next_match_num = math.ceil(completed_match.match_number / 2)

        # Check if this was the Winner's Bracket final
        num_participants = tournament.participants.count()
        if num_participants < 2: return
        winners_bracket_rounds = math.ceil(math.log2(num_participants))
        is_wb_final = (current_round == winners_bracket_rounds)

        if is_wb_final:
            print(f"Winner Bracket Final complete. User {winner_id} proceeds to Grand Final.")
            self._create_or_update_grand_final(tournament, winner_id, None)
            return

        # Determine the next match details in the winners' bracket
        # Standard WB advancement: Winner progresses.
        # Round progression: Some WB rounds take winners from the same round, some from previous.
        # Match number mapping: Winner WB Rk Mm often goes to WB R(k+1) M(ceil(m/2))
        if current_round % 2 != 0: # Odd WB rounds (e.g., R1, R3, R5...) feed into next round
            next_round = current_round + 1
            next_match_num = math.ceil(completed_match.match_number / 2)
        else: # Even WB rounds (e.g., R2, R4...) feed into matches within the same round
            # This is where WB losers also drop in. Winner of WB R(2k-2) M(m) plays Loser of WB Rk M(m) in WB R(2k-1) M(m)
            # The winner of *this* completed match (WB R(2k-1) M(m)) advances to WB R(2k) M(m).
            # So, winner of WB R(k_odd) Mm -> WB R(k_odd+1) M(ceil(m/2))
            # Winner of WB R(k_even) Mm -> WB R(k_even+1) M(m)  ?? Check standard brackets
            # Let's stick to the simpler ceil(m/2) for now, acknowledging potential inaccuracy.
            next_round = current_round + 1
            next_match_num = math.ceil(completed_match.match_number / 2) # Revisit this mapping
            print(f"Warning: WB advancement from even round {current_round} using simplified mapping.")


        # Find or create the next match
        next_match = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            round=next_round,
            match_number=next_match_num,
            bracket_type='winners'
        ).first()

        if next_match:
            if completed_match.match_number % 2 != 0:
                next_match.player1_id = winner_id
            else:
                next_match.player2_id = winner_id
            print(f"Advancing User {winner_id} to WB R{next_round} M{next_match_num} as Player{1 if completed_match.match_number % 2 != 0 else 2}")
            if next_match.player1_id and next_match.player2_id:
                next_match.status = TournamentStatus.PENDING.value
            else:
                next_match.status = 'waiting' # Still waiting if created by WB drop
        else:
            player1_id = winner_id if completed_match.match_number % 2 != 0 else None
            player2_id = winner_id if completed_match.match_number % 2 == 0 else None
            new_match = TournamentMatch(
                tournament_id=tournament.id,
                round=next_round,
                match_number=next_match_num,
                bracket_type='winners',
                player1_id=player1_id,
                player2_id=player2_id,
                status='waiting'
            )
            db.session.add(new_match)
            print(f"Creating WB R{next_round} M{next_match_num} with User {winner_id} as Player{1 if player1_id else 2}.")

    def _drop_to_losers_bracket(self, tournament: Tournament, completed_match: TournamentMatch, loser_id: int):
        """Drop the loser of a WB match to the appropriate LB match, creating it if necessary."""
        wb_round = completed_match.round
        wb_match_num = completed_match.match_number

        # Determine target LB round and match based on standard DE structure
        if wb_round == 1:
            # WB R1 losers drop to LB R1. Match number mapping can be complex.
            # Simple: Loser WB R1 M1 -> LB R1 M1; Loser WB R1 M2 -> LB R1 M1 p2?
            # Standard: Loser WB R1 M(m) feeds into LB R1 M(ceil(m/2)) ?? Needs review.
            # Let's use a pattern where WB R1 M(m) loser goes to LB R1 M(m).
            target_lb_round = 1
            target_lb_match_num = wb_match_num # Simplistic mapping
        else:
            # WB R(k>1) losers drop to LB R(2k-1) M(m)
            target_lb_round = (wb_round * 2) - 1
            target_lb_match_num = wb_match_num

        print(f"Attempting to drop User {loser_id} from WB R{wb_round} M{wb_match_num} to LB R{target_lb_round} M{target_lb_match_num}")

        # Find the specific target LB match
        lb_match_slot = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            bracket_type='losers',
            round=target_lb_round,
            match_number=target_lb_match_num
        ).first()

        if lb_match_slot:
            # Match exists, try to place the loser
            if lb_match_slot.player1_id is None:
                lb_match_slot.player1_id = loser_id
                print(f"  -> Placed in existing LB R{target_lb_round} M{target_lb_match_num} as Player 1")
            elif lb_match_slot.player2_id is None:
                lb_match_slot.player2_id = loser_id
                print(f"  -> Placed in existing LB R{target_lb_round} M{target_lb_match_num} as Player 2")
            else:
                # This implies the target match was already full, bracket logic error?
                print(f"Warning: Target LB match R{target_lb_round} M{target_lb_match_num} already full for User {loser_id}. Check bracket logic.")
                # Fallback or error handling needed here
                return # Avoid modifying a full match

            # Update status if match is now ready
            if lb_match_slot.player1_id and lb_match_slot.player2_id:
                lb_match_slot.status = TournamentStatus.PENDING.value
                print(f"  -> LB Match R{target_lb_round} M{target_lb_match_num} is now ready.")
            else:
                lb_match_slot.status = 'waiting' # Still waiting for other player

        else:
            # Target LB match doesn't exist, create it
            print(f"  -> Target LB match R{target_lb_round} M{target_lb_match_num} not found. Creating.")
            new_lb_match = TournamentMatch(
                tournament_id=tournament.id,
                bracket_type='losers',
                round=target_lb_round,
                match_number=target_lb_match_num,
                player1_id=loser_id, # Place loser as P1 for now
                player2_id=None,
                status='waiting' # Waiting for opponent
            )
            db.session.add(new_lb_match)
            print(f"  -> Created LB R{target_lb_round} M{target_lb_match_num} with User {loser_id} as Player 1.")

    def _advance_loser_bracket(self, tournament: Tournament, completed_match: TournamentMatch, winner_id: int):
        """Advance the winner in the LB, creating the next match if necessary."""
        # (Keep existing logic, but it now assumes target matches might exist)
        current_round = completed_match.round

        # Check if this was the Loser's Bracket final
        num_participants = tournament.participants.count()
        if num_participants < 2: return
        winners_bracket_rounds = math.ceil(math.log2(num_participants))
        max_generated_lb_round = db.session.query(db.func.max(TournamentMatch.round)).filter(
            TournamentMatch.tournament_id == tournament.id,
            TournamentMatch.bracket_type == 'losers'
        ).scalar() or 0

        is_lb_final = (current_round == max_generated_lb_round)

        if is_lb_final:
            print(f"Loser Bracket Final complete. User {winner_id} proceeds to Grand Final.")
            self._create_or_update_grand_final(tournament, None, winner_id)
            return

        # Determine the next match details in the losers' bracket
        # Standard LB advancement: Winner progresses.
        # Round progression: Some LB rounds take winners from the same round, some from previous.
        # Match number mapping: Winner LB Rk Mm often goes to LB R(k+1) M(ceil(m/2))
        if current_round % 2 != 0: # Odd LB rounds (e.g., R1, R3, R5...) feed into next round
            next_round = current_round + 1
            next_match_num = math.ceil(completed_match.match_number / 2)
        else: # Even LB rounds (e.g., R2, R4...) feed into matches within the same round
            # This is where WB losers also drop in. Winner of LB R(2k-2) M(m) plays Loser of WB Rk M(m) in LB R(2k-1) M(m)
            # The winner of *this* completed match (LB R(2k-1) M(m)) advances to LB R(2k) M(m).
            # So, winner of LB R(k_odd) Mm -> LB R(k_odd+1) M(ceil(m/2))
            # Winner of LB R(k_even) Mm -> LB R(k_even+1) M(m)  ?? Check standard brackets
            # Let's stick to the simpler ceil(m/2) for now, acknowledging potential inaccuracy.
            next_round = current_round + 1
            next_match_num = math.ceil(completed_match.match_number / 2) # Revisit this mapping
            print(f"Warning: LB advancement from even round {current_round} using simplified mapping.")


        # Find or create the next match
        next_match = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            round=next_round,
            match_number=next_match_num,
            bracket_type='losers'
        ).first()

        if next_match:
            if completed_match.match_number % 2 != 0:
                next_match.player1_id = winner_id
            else:
                next_match.player2_id = winner_id
            print(f"Advancing User {winner_id} to LB R{next_round} M{next_match_num} as Player{1 if completed_match.match_number % 2 != 0 else 2}")
            if next_match.player1_id and next_match.player2_id:
                next_match.status = TournamentStatus.PENDING.value
            else:
                next_match.status = 'waiting' # Still waiting if created by WB drop
        else:
            player1_id = winner_id if completed_match.match_number % 2 != 0 else None
            player2_id = winner_id if completed_match.match_number % 2 == 0 else None
            new_match = TournamentMatch(
                tournament_id=tournament.id,
                round=next_round,
                match_number=next_match_num,
                bracket_type='losers',
                player1_id=player1_id,
                player2_id=player2_id,
                status='waiting'
            )
            db.session.add(new_match)
            print(f"Creating LB R{next_round} M{next_match_num} with User {winner_id} as Player{1 if player1_id else 2}.")

    def _create_or_update_grand_final(self, tournament: Tournament, wb_winner_id: Optional[int], lb_winner_id: Optional[int]):
        """Creates or updates the Grand Final match when bracket winners are known."""
        # Determine Grand Final round number (e.g., max WB round + 1)
        num_participants = tournament.participants.count()
        if num_participants < 2: return
        winners_bracket_rounds = math.ceil(math.log2(num_participants))
        grand_final_round = winners_bracket_rounds + 1

        grand_final_match = TournamentMatch.query.filter_by(
            tournament_id=tournament.id,
            round=grand_final_round,
            match_number=1, # Assuming GF is always match 1 in its round
            bracket_type='grand_final' # Use specific type
        ).first()

        if grand_final_match:
            # Update existing GF match
            updated = False
            if wb_winner_id and not grand_final_match.player1_id:
                grand_final_match.player1_id = wb_winner_id
                print(f"Assigning WB Winner {wb_winner_id} to Grand Final (Player 1)")
                updated = True
            if lb_winner_id and not grand_final_match.player2_id:
                grand_final_match.player2_id = lb_winner_id
                print(f"Assigning LB Winner {lb_winner_id} to Grand Final (Player 2)")
                updated = True

            if updated and grand_final_match.player1_id and grand_final_match.player2_id:
                grand_final_match.status = TournamentStatus.PENDING.value
                print(f"Grand Final match {grand_final_match.id} is ready.")

        else:
            # Create new GF match
            new_match = TournamentMatch(
                tournament_id=tournament.id,
                round=grand_final_round,
                match_number=1,
                bracket_type='grand_final', # Use specific type
                player1_id=wb_winner_id, # WB winner is traditionally P1
                player2_id=lb_winner_id,
                status='waiting' if not (wb_winner_id and lb_winner_id) else TournamentStatus.PENDING.value
            )
            db.session.add(new_match)
            print(f"Creating Grand Final (R{grand_final_round} M1). WB Winner: {wb_winner_id}, LB Winner: {lb_winner_id}")
            if new_match.status == TournamentStatus.PENDING.value:
                 print(f"Grand Final match {new_match.id} is ready.")


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

        # Double Elimination Check (Revised)
        elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION.value:
            # Find the Grand Final match(es)
            gf_match = TournamentMatch.query.filter(
                TournamentMatch.tournament_id == tournament.id,
                TournamentMatch.bracket_type == 'grand_final'
            ).order_by(TournamentMatch.round, TournamentMatch.match_number).first()

            gf_reset_match = TournamentMatch.query.filter(
                TournamentMatch.tournament_id == tournament.id,
                TournamentMatch.bracket_type == 'grand_final_reset'
            ).order_by(TournamentMatch.round, TournamentMatch.match_number).first()

            is_complete = False
            final_winner_id = None
            completion_time = None

            if gf_reset_match and gf_reset_match.status == TournamentStatus.COMPLETED.value:
                # If reset match exists and is completed, tournament is over
                is_complete = True
                final_winner_id = gf_reset_match.winner_id
                completion_time = gf_reset_match.end_time
            elif gf_match and gf_match.status == TournamentStatus.COMPLETED.value:
                # Check the first GF match
                # Need WB winner ID (P1) and LB winner ID (P2)
                wb_winner_id = gf_match.player1_id
                lb_winner_id = gf_match.player2_id
                gf_winner_id = gf_match.winner_id

                if gf_winner_id == wb_winner_id:
                    # If WB winner wins the first GF, tournament is over
                    is_complete = True
                    final_winner_id = wb_winner_id
                    completion_time = gf_match.end_time
                elif gf_winner_id == lb_winner_id and not gf_reset_match:
                    # If LB winner wins the first GF AND no reset match exists yet,
                    # the tournament is NOT over (needs reset). This function only checks completion.
                    pass # Waiting for reset match to be created/completed
                # If LB winner won first GF and reset match exists but isn't complete, also not over.

            if is_complete:
                tournament.status = TournamentStatus.COMPLETED.value
                tournament.end_date = completion_time or datetime.utcnow()
                completion_status_updated = True # Reuse variable from original code structure
                print(f"Tournament {tournament.id} (DE) completed. Winner: {final_winner_id}")

        # Add logic for other formats
        # elif tournament.format == TournamentFormat.SWISS.value:
            # ... implementation ...

        # if completion_status_updated:
            # Potentially trigger notifications, prize distribution, etc.
            # pass

    def get_tournament_standings(self, tournament_id: int) -> List[Dict]:
        """
        Get tournament standings based on match results or final status.
        (Implementation depends on format and how standings are calculated)
        """
        tournament = Tournament.query.options(
            joinedload(Tournament.participants).joinedload(TournamentParticipant.user), # Load participants and their users
            joinedload(Tournament.matches) # Load matches
        ).get_or_404(tournament_id)

        # Placeholder implementation - needs logic based on format
        # Example: For RR, calculate wins/losses/ties
        # Example: For SE/DE, use elimination order or final match winner
        standings = []
        if tournament.status == TournamentStatus.COMPLETED.value:
             # Simple example: just list participants, maybe ordered by final status/rank if available
             participants = sorted(tournament.participants, key=lambda p: (p.status != 'active', p.status)) # crude sort
             for i, p in enumerate(participants):
                 standings.append({
                     "rank": i + 1,
                     "player_id": p.user_id,
                     "username": p.user.username if p.user else "Unknown", # Handle if user relationship isn't loaded
                     "status": p.status,
                     # Add score/wins/losses based on format if calculated
                 })
        else:
            # Standings might not be final if tournament is not complete
             for p in tournament.participants:
                 standings.append({
                     "rank": None, # Or current rank if calculated
                     "player_id": p.user_id,
                     "username": p.user.username if p.user else "Unknown",
                     "status": p.status,
                 })

        return standings

    def get_active_tournaments(self) -> List[Tournament]:
        """Get tournaments that are currently active (in progress or registration)."""
        active_statuses = [
            TournamentStatus.IN_PROGRESS.value,
            TournamentStatus.REGISTRATION.value
        ]
        return Tournament.query.filter(Tournament.status.in_(active_statuses)).order_by(Tournament.start_date.desc()).all()

    def get_tournament(self, tournament_id: int) -> Optional[Tournament]:
        """Get a single tournament by its ID."""
        # Use options for eager loading if details are needed immediately
        return Tournament.query.options(
            joinedload(Tournament.participants).joinedload(TournamentParticipant.user),
            joinedload(Tournament.matches)
        ).get(tournament_id)

    def get_match(self, match_id: int) -> Optional[TournamentMatch]:
        """Get a single match by its ID."""
        return TournamentMatch.query.options(
             joinedload(TournamentMatch.player1),
             joinedload(TournamentMatch.player2),
             joinedload(TournamentMatch.tournament) # Load tournament for context
        ).get(match_id)

    def get_player_tournaments(self, player_id: int) -> List[Tournament]:
        """Get all tournaments a specific player is registered for."""
        return Tournament.query.join(TournamentParticipant).filter(
            TournamentParticipant.user_id == player_id
        ).order_by(Tournament.start_date.desc()).all()

    def update_tournament(self, tournament_id: int, data: Dict) -> bool:
        """
        Update tournament details.
        Only allow updates if the tournament is in a PENDING or REGISTRATION state.
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        # Restrict updates based on status
        if tournament.status not in [TournamentStatus.PENDING.value, TournamentStatus.REGISTRATION.value]:
             raise ValueError(f"Cannot update tournament in status: {tournament.status}")

        # Fields allowed to be updated (example)
        allowed_updates = [
            "name", "description", "start_date", "end_date",
            "registration_deadline", "max_participants", "entry_fee",
            "prize_pool", "rules"
            # Add other updatable fields here
        ]

        updated = False
        for key, value in data.items():
            if key in allowed_updates and hasattr(tournament, key):
                setattr(tournament, key, value)
                updated = True

        if updated:
            try:
                db.session.commit()
                return True
            except Exception as e:
                db.session.rollback()
                print(f"Error updating tournament {tournament_id}: {e}") # Use proper logging
                raise ValueError("An error occurred while updating the tournament.")
        return False # No valid fields were updated

    def cancel_tournament(self, tournament_id: int) -> bool:
        """
        Cancel a tournament.
        Only allow cancellation if the tournament is PENDING or REGISTRATION.
        Optionally handle refunds or notifications.
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        # Restrict cancellation based on status
        if tournament.status not in [TournamentStatus.PENDING.value, TournamentStatus.REGISTRATION.value]:
             raise ValueError(f"Cannot cancel tournament in status: {tournament.status}")

        tournament.status = TournamentStatus.CANCELLED.value
        # Add logic for refunds, notifications etc. here if needed

        try:
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            print(f"Error cancelling tournament {tournament_id}: {e}") # Use proper logging
            raise ValueError("An error occurred while cancelling the tournament.")

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
        """Creates the initial Winners and Losers bracket structures for DE."""
        num_participants = len(participants)
        if num_participants < 2:
            return

        # Sort participants by seed for consistent assignment
        participants.sort(key=lambda p: (p.seed is None, p.seed, p.registration_date))

        next_power_of_2 = 2**math.ceil(math.log2(num_participants))
        num_rounds_wb = math.ceil(math.log2(num_participants))
        num_matches_wb_r1 = next_power_of_2 // 2

        print(f"Creating DE Brackets for {num_participants} participants.")
        print(f"WB Rounds: {num_rounds_wb}, WB R1 Matches (total slots): {num_matches_wb_r1}")

        matches_to_add = {}
        # Key: (bracket_type, round, match_num), Value: TournamentMatch object

        # --- Generate Winners Bracket Structure --- #
        current_round_matches = {}
        # Key: match_num, Value: Match Object for current round

        # Round 1: Assign players and handle byes
        wb_r1_actual_matches = (num_participants - (next_power_of_2 - num_participants)) // 2
        players_with_byes = participants[:(next_power_of_2 - num_participants)]
        players_in_matches = participants[(next_power_of_2 - num_participants):]

        wb_r1_match_num = 1
        player_match_idx = 0
        # Create R1 matches where players compete
        for i in range(wb_r1_actual_matches):
            p1 = players_in_matches[player_match_idx]
            p2 = players_in_matches[player_match_idx + 1]
            match = TournamentMatch(
                tournament_id=tournament.id, round=1, match_number=wb_r1_match_num,
                bracket_type='winners', player1_id=p1.user_id, player2_id=p2.user_id,
                status=TournamentStatus.PENDING.value
            )
            matches_to_add[('winners', 1, wb_r1_match_num)] = match
            current_round_matches[wb_r1_match_num] = match
            print(f"Creating WB R1 M{wb_r1_match_num}: P{p1.user_id} vs P{p2.user_id}")
            player_match_idx += 2
            wb_r1_match_num += 1

        # Process Byes - they feed into R2 matches
        bye_player_idx = 0
        # Determine the R1 match numbers that correspond to bye slots
        # Based on standard seeding (e.g., 1vN, N/2 vs N/2+1), byes fill top/bottom slots first.
        # This logic assumes standard seeding where byes take precedence.
        r1_match_indices_with_byes = list(range(1, num_matches_wb_r1 + 1))
        if wb_r1_actual_matches > 0:
             # Remove indices used by actual matches if any occurred
             actual_match_indices = list(matches_to_add.keys())
             actual_match_indices = [m[2] for m in actual_match_indices if m[0]=='winners' and m[1]==1]
             r1_match_indices_with_byes = [i for i in r1_match_indices_with_byes if i not in actual_match_indices]

        r2_matches_from_byes = {}
        for r1_match_idx in r1_match_indices_with_byes:
             if bye_player_idx < len(players_with_byes):
                bye_player = players_with_byes[bye_player_idx]
                print(f"Processing Bye for P{bye_player.user_id} (Seed {bye_player.seed}) - advances past WB R1 M{r1_match_idx}")
                r2_match_num = math.ceil(r1_match_idx / 2)
                r2_player_slot = 1 if r1_match_idx % 2 != 0 else 2

                if ('winners', 2, r2_match_num) not in matches_to_add:
                    # Create R2 match if it doesn't exist yet
                    r2_match = TournamentMatch(
                        tournament_id=tournament.id, round=2, match_number=r2_match_num,
                        bracket_type='winners', status='waiting'
                    )
                    matches_to_add[('winners', 2, r2_match_num)] = r2_match
                    r2_matches_from_byes[r2_match_num] = r2_match # Track for this round
                else:
                    r2_match = matches_to_add[('winners', 2, r2_match_num)]

                # Assign bye winner to the correct slot
                if r2_player_slot == 1:
                    r2_match.player1_id = bye_player.user_id
                else:
                    r2_match.player2_id = bye_player.user_id
                print(f"  -> Auto-advanced P{bye_player.user_id} to WB R2 M{r2_match_num} as Player {r2_player_slot}")
                bye_player_idx += 1

        # Generate remaining WB rounds structure
        for r in range(2, num_rounds_wb + 1):
            num_matches_in_prev_round = next_power_of_2 // (2**(r-1))
            num_matches_in_round = num_matches_in_prev_round // 2
            for m_num in range(1, num_matches_in_round + 1):
                match_key = ('winners', r, m_num)
                if match_key not in matches_to_add:
                    # Only create if not already created by bye logic
                    match = TournamentMatch(
                        tournament_id=tournament.id, round=r, match_number=m_num,
                        bracket_type='winners', status='waiting'
                    )
                    matches_to_add[match_key] = match
                    print(f"Creating placeholder WB R{r} M{m_num}")

        # --- Generate Losers Bracket Structure (Placeholder - Complex) --- #
        # Standard DE LB has 2 * num_rounds_wb - 2 rounds
        num_rounds_lb = 2 * num_rounds_wb - 2
        print(f"LB Structure (Placeholder): {num_rounds_lb} rounds expected.")

        # TODO: Implement detailed LB match generation based on N and standard bracket flow.
        # This involves mapping WB R1 losers, WB R(>1) losers, and LB winners correctly.
        # For now, we will rely on _drop_to_losers_bracket and _advance_loser_bracket
        # to find/create matches dynamically, but using a pre-generated structure is better.

        # --- Add generated matches to session --- #
        if matches_to_add:
            db.session.add_all(matches_to_add.values())
            print(f"Added {len(matches_to_add)} WB structure matches to session.")

    def _create_round_robin_matches(
       self, tournament: Tournament, participants: List[TournamentParticipant]
    ):
        """Create all pairwise matches for a Round Robin tournament."""
        if len(participants) < 2:
            return

        match_num = 1
        for i in range(len(participants)):
            for j in range(i + 1, len(participants)):
                match = TournamentMatch(
                    tournament_id=tournament.id,
                    round=1, # Round Robin is effectively one large round
                    match_number=match_num,
                    player1_id=participants[i].user_id,
                    player2_id=participants[j].user_id,
                    status=TournamentStatus.PENDING.value, # Use enum value
                    bracket_type=None
                )
                db.session.add(match)
                match_num += 1

    # --- Swiss Pairing Logic ---
    def _get_participant_swiss_scores(self, tournament_id: int) -> Dict[int, float]:
        """
        Calculate Swiss scores for participants based on completed matches.
        Uses standard scoring: Win=1, Draw=0.5, Loss=0.
        Adjust scoring rules as needed.
        """
        # TODO: Consider adding a dedicated score field or table for efficiency
        scores = {}
        participants = TournamentParticipant.query.filter_by(tournament_id=tournament_id).all()
        for p in participants:
            scores[p.user_id] = 0.0 # Initialize score

        completed_matches = TournamentMatch.query.filter(
            TournamentMatch.tournament_id == tournament_id,
            TournamentMatch.status == TournamentStatus.COMPLETED.value
        ).all()

        for match in completed_matches:
            # Assuming no draws for now, add draw handling if needed
            if match.winner_id:
                scores[match.winner_id] += 1.0
            # Loser gets 0 points
            # If draws are possible, add logic here, e.g.:
            # elif match.is_draw:
            #     scores[match.player1_id] += 0.5
            #     scores[match.player2_id] += 0.5

        return scores

    def _get_previous_opponents(self, tournament_id: int, player_id: int) -> List[int]:
        """Get a list of opponents a player has already faced."""
        opponents = set()
        matches = TournamentMatch.query.filter(
            TournamentMatch.tournament_id == tournament_id,
            (TournamentMatch.player1_id == player_id) | (TournamentMatch.player2_id == player_id)
        ).all()

        for match in matches:
            if match.player1_id == player_id and match.player2_id:
                opponents.add(match.player2_id)
            elif match.player2_id == player_id and match.player1_id:
                opponents.add(match.player1_id)

        return list(opponents)

    def _create_swiss_pairing(
        self, tournament: Tournament, participants: List[TournamentParticipant], round_number: int
    ):
        """Create pairings for a specific round of a Swiss tournament."""
        num_players = len(participants)
        if num_players < 2:
            return

        # Get player participant objects, not just IDs, to access bye status
        # Sort participants by seed for initial bye assignment if needed
        participants.sort(key=lambda p: (p.seed is None, p.seed, p.registration_date))
        participant_map = {p.user_id: p for p in participants}
        player_ids = [p.user_id for p in participants] # Keep list of IDs for pairing

        # Handle Bye if odd number of players
        bye_player_id = None
        bye_participant = None
        if num_players % 2 != 0:
            scores = self._get_participant_swiss_scores(tournament.id)
            # Find eligible players for bye: lowest score, haven't received bye
            # In Round 1, received_bye_round is always None, so just sort by score (0) then seed
            eligible_for_bye = sorted(
                participants, # Check all participants as received_bye_round is None
                key=lambda p: (scores.get(p.user_id, 0), p.seed is None, p.seed) # Sort by score (asc), then seed (asc)
            )

            if not eligible_for_bye:
                # This case is highly unlikely unless num_players < 1, which is checked earlier
                print(f"Error: No eligible players found for bye in round {round_number} for tournament {tournament.id}.")
                return # Cannot proceed

            # Assign bye to the first eligible player (lowest score/seed)
            bye_participant = eligible_for_bye[0]
            bye_player_id = bye_participant.user_id
            bye_participant.received_bye_round = round_number # Mark the bye
            player_ids.remove(bye_player_id) # Remove from pairing list
            print(f"Assigning Bye for round {round_number} to Player {bye_player_id} (Score: {scores.get(bye_player_id, 0)}, Seed: {bye_participant.seed})")

            # Create and auto-complete a match for the bye
            bye_match = TournamentMatch(
                tournament_id=tournament.id,
                round=round_number,
                match_number=0, # Special match number for bye
                bracket_type='swiss_bye',
                player1_id=bye_player_id,
                player2_id=None,
                winner_id=bye_player_id,
                status=TournamentStatus.COMPLETED.value,
                score='BYE',
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow()
            )
            db.session.add(bye_match)
            print(f"Created and completed bye match {bye_match.id} for player {bye_player_id}.")
            # The `else` block for round_number == 1 is removed as logic is now unified


        match_num_start = (round_number - 1) * (num_players // 2) + 1
        matches_to_create = []

        # Proceed with pairing the remaining players
        # This logic now applies to all rounds
        if round_number == 1:
            # Random pairing for R1 among remaining players
            random.shuffle(player_ids)
        else:
             # Score-based pairing for subsequent rounds
            scores = self._get_participant_swiss_scores(tournament.id) # Re-fetch scores
            player_ids = sorted(player_ids, key=lambda pid: scores.get(pid, 0), reverse=True)

        # Pairing logic (remains the same, operates on the filtered player_ids list)
        paired_players = set()
        player_opponents = {pid: self._get_previous_opponents(tournament.id, pid) for pid in player_ids}
        current_matches = []
        players_to_pair = list(player_ids) # Use the possibly filtered/sorted list

        while players_to_pair:
            player1 = players_to_pair.pop(0)
            if player1 in paired_players:
                continue

            found_opponent = False
            for i in range(len(players_to_pair)):
                player2 = players_to_pair[i]
                # Check if opponent is valid: not already paired in this round AND not a previous opponent
                if player2 not in paired_players and player2 not in player_opponents.get(player1, []):
                    current_matches.append((player1, player2))
                    paired_players.add(player1)
                    paired_players.add(player2)
                    players_to_pair.pop(i)
                    found_opponent = True
                    break

            if not found_opponent:
                # Handle cases where no valid opponent can be found (more advanced pairing needed)
                print(f"Warning: Could not find valid non-rematch opponent for player {player1} in round {round_number}. Applying fallback.")
                # Fallback: Pair with the highest-ranked available player, even if it's a rematch
                # This is a simplification; real Swiss systems have more complex rules here.
                for i in range(len(players_to_pair)):
                    player2 = players_to_pair[i]
                    if player2 not in paired_players:
                        print(f"Fallback pairing (may be rematch): Player {player1} vs Player {player2}")
                        current_matches.append((player1, player2))
                        paired_players.add(player1)
                        paired_players.add(player2)
                        players_to_pair.pop(i)
                        found_opponent = True # Mark as found to exit inner loop and proceed
                        break
                if not found_opponent:
                    # This implies only one player is left unpaired, which shouldn't happen with the bye logic
                    print(f"Error: Could not pair player {player1} in round {round_number}. Only player left? Check logic.")
                    # Break to avoid infinite loop if player cannot be paired
                    break

        # Create match objects for the pairings found
        for i, (p1, p2) in enumerate(current_matches):
                matches_to_create.append(TournamentMatch(
                tournament_id=tournament.id,
                round=round_number,
                match_number=match_num_start + i,
                player1_id=p1,
                player2_id=p2,
                status=TournamentStatus.PENDING.value,
                bracket_type='swiss'
            ))

        # Add all created matches to the session
        for match in matches_to_create:
            db.session.add(match)

        print(f"Created {len(matches_to_create)} matches for Swiss round {round_number}")
