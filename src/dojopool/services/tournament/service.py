from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from ..models import Tournament, TournamentParticipant, TournamentMatch, User, Venue
from ..extensions import db

class TournamentService:
    """Service for managing tournaments."""

    @staticmethod
    def create_tournament(
        name: str,
        description: str,
        venue_id: int,
        organizer_id: int,
        start_date: datetime,
        end_date: datetime,
        registration_deadline: datetime,
        max_participants: int,
        entry_fee: float,
        prize_pool: float,
        format: str
    ) -> Tuple[bool, Optional[Tournament], Optional[str]]:
        """Create a new tournament.
        
        Args:
            name: Tournament name
            description: Tournament description
            venue_id: Venue ID
            organizer_id: Organizer ID
            start_date: Start date
            end_date: End date
            registration_deadline: Registration deadline
            max_participants: Maximum number of participants
            entry_fee: Entry fee
            prize_pool: Prize pool amount
            format: Tournament format
            
        Returns:
            Tuple of (success, tournament, error_message)
        """
        try:
            # Validate venue
            venue = Venue.query.get(venue_id)
            if not venue:
                return False, None, "Venue not found"

            # Validate organizer
            organizer = User.query.get(organizer_id)
            if not organizer:
                return False, None, "Organizer not found"

            # Create tournament
            tournament = Tournament(
                name=name,
                description=description,
                venue_id=venue_id,
                organizer_id=organizer_id,
                start_date=start_date,
                end_date=end_date,
                registration_deadline=registration_deadline,
                max_participants=max_participants,
                entry_fee=entry_fee,
                prize_pool=prize_pool,
                format=format
            )

            db.session.add(tournament)
            db.session.commit()

            return True, tournament, None
        except Exception as e:
            db.session.rollback()
            return False, None, str(e)

    @staticmethod
    def register_participant(
        tournament_id: int,
        user_id: int
    ) -> Tuple[bool, Optional[TournamentParticipant], Optional[str]]:
        """Register a participant for a tournament.
        
        Args:
            tournament_id: Tournament ID
            user_id: User ID
            
        Returns:
            Tuple of (success, participant, error_message)
        """
        try:
            # Validate tournament
            tournament = Tournament.query.get(tournament_id)
            if not tournament:
                return False, None, "Tournament not found"

            # Check if registration is open
            if tournament.status != 'open':
                return False, None, "Tournament registration is not open"

            # Check if registration deadline has passed
            if datetime.utcnow() > tournament.registration_deadline:
                return False, None, "Registration deadline has passed"

            # Check if tournament is full
            if len(tournament.participants) >= tournament.max_participants:
                return False, None, "Tournament is full"

            # Check if user is already registered
            existing_participant = TournamentParticipant.query.filter_by(
                tournament_id=tournament_id,
                user_id=user_id
            ).first()

            if existing_participant:
                return False, None, "User is already registered"

            # Create participant
            participant = TournamentParticipant(
                tournament_id=tournament_id,
                user_id=user_id
            )

            db.session.add(participant)
            db.session.commit()

            return True, participant, None
        except Exception as e:
            db.session.rollback()
            return False, None, str(e)

    @staticmethod
    def generate_bracket(tournament_id: int) -> Tuple[bool, Optional[List[TournamentMatch]], Optional[str]]:
        """Generate tournament bracket.
        
        Args:
            tournament_id: Tournament ID
            
        Returns:
            Tuple of (success, matches, error_message)
        """
        try:
            tournament = Tournament.query.get(tournament_id)
            if not tournament:
                return False, None, "Tournament not found"

            # Get all participants
            participants = TournamentParticipant.query.filter_by(
                tournament_id=tournament_id,
                status='registered'
            ).all()

            if not participants:
                return False, None, "No participants registered"

            # Generate matches based on tournament format
            matches = []
            if tournament.format == 'single_elimination':
                matches = TournamentService._generate_single_elimination_bracket(tournament, participants)
            elif tournament.format == 'double_elimination':
                matches = TournamentService._generate_double_elimination_bracket(tournament, participants)
            elif tournament.format == 'round_robin':
                matches = TournamentService._generate_round_robin_matches(tournament, participants)

            # Update tournament status
            tournament.status = 'in_progress'
            db.session.commit()

            return True, matches, None
        except Exception as e:
            db.session.rollback()
            return False, None, str(e)

    @staticmethod
    def _generate_single_elimination_bracket(
        tournament: Tournament,
        participants: List[TournamentParticipant]
    ) -> List[TournamentMatch]:
        """Generate single elimination bracket."""
        matches = []
        round_num = 1
        match_num = 1

        # Sort participants by seed
        sorted_participants = sorted(participants, key=lambda x: x.seed or float('inf'))

        # Generate first round matches
        for i in range(0, len(sorted_participants), 2):
            if i + 1 < len(sorted_participants):
                match = TournamentMatch(
                    tournament_id=tournament.id,
                    round=round_num,
                    match_number=match_num,
                    player1_id=sorted_participants[i].user_id,
                    player2_id=sorted_participants[i + 1].user_id
                )
                matches.append(match)
                match_num += 1

        return matches

    @staticmethod
    def _generate_double_elimination_bracket(
        tournament: Tournament,
        participants: List[TournamentParticipant]
    ) -> List[TournamentMatch]:
        """Generate double elimination bracket."""
        # Implementation for double elimination bracket generation
        # This is a simplified version - you might want to add more logic
        return TournamentService._generate_single_elimination_bracket(tournament, participants)

    @staticmethod
    def _generate_round_robin_matches(
        tournament: Tournament,
        participants: List[TournamentParticipant]
    ) -> List[TournamentMatch]:
        """Generate round robin matches."""
        matches = []
        match_num = 1

        # Generate matches for each round
        for i in range(len(participants)):
            for j in range(i + 1, len(participants)):
                match = TournamentMatch(
                    tournament_id=tournament.id,
                    round=1,  # All matches are in the same round
                    match_number=match_num,
                    player1_id=participants[i].user_id,
                    player2_id=participants[j].user_id
                )
                matches.append(match)
                match_num += 1

        return matches

    @staticmethod
    def update_match_result(
        match_id: int,
        winner_id: int,
        score: str
    ) -> Tuple[bool, Optional[TournamentMatch], Optional[str]]:
        """Update match result.
        
        Args:
            match_id: Match ID
            winner_id: Winner's user ID
            score: Match score
            
        Returns:
            Tuple of (success, match, error_message)
        """
        try:
            match = TournamentMatch.query.get(match_id)
            if not match:
                return False, None, "Match not found"

            if match.status == 'completed':
                return False, None, "Match already completed"

            # Update match result
            match.winner_id = winner_id
            match.score = score
            match.status = 'completed'
            match.end_time = datetime.utcnow()

            db.session.commit()

            return True, match, None
        except Exception as e:
            db.session.rollback()
            return False, None, str(e)

    @staticmethod
    def get_tournament_status(tournament_id: int) -> Dict[str, Any]:
        """Get tournament status and statistics.
        
        Args:
            tournament_id: Tournament ID
            
        Returns:
            Dictionary containing tournament status and statistics
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            return {"error": "Tournament not found"}

        return {
            "id": tournament.id,
            "name": tournament.name,
            "status": tournament.status,
            "format": tournament.format,
            "participant_count": len(tournament.participants),
            "max_participants": tournament.max_participants,
            "completed_matches": len([m for m in tournament.matches if m.status == 'completed']),
            "total_matches": len(tournament.matches),
            "start_date": tournament.start_date.isoformat(),
            "end_date": tournament.end_date.isoformat(),
            "registration_deadline": tournament.registration_deadline.isoformat()
        } 