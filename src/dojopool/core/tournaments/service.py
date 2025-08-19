import math
from datetime import datetime
from typing import Dict, List

from ..models import db
from .models import (
    Tournament,
    TournamentBracket,
    TournamentMatch,
    TournamentMatchPlayer,
    TournamentParticipant,
    TournamentPrize,
)


class TournamentService:
    def create_tournament(self, data: Dict) -> Tournament:
        """Create a new tournament."""
        tournament = Tournament(
            name=data["name"],
            description=data.get("description"),
            organizer_id=data["organizer_id"],
            venue_id=data["venue_id"],
            start_date=data["start_date"],
            end_date=data["end_date"],
            registration_deadline=data["registration_deadline"],
            max_participants=data["max_participants"],
            entry_fee=data.get("entry_fee", 0.0),
            total_prize_pool=data.get("total_prize_pool", 0.0),
            status="upcoming",
            rules=data.get("rules"),
        )
        db.session.add(tournament)
        db.session.commit()

        # Create prize distribution if prize pool exists
        if tournament.total_prize_pool > 0:
            self._create_prize_distribution(tournament)

        return tournament

    def _create_prize_distribution(self, tournament: Tournament) -> None:
        """Create prize distribution for tournament."""
        prize_distribution = [
            (1, 0.5),  # 1st place: 50%
            (2, 0.3),  # 2nd place: 30%
            (3, 0.2),  # 3rd place: 20%
        ]

        for position, percentage in prize_distribution:
            prize = TournamentPrize(
                tournament_id=tournament.id,
                position=position,
                prize_amount=tournament.total_prize_pool * percentage,
                distribution_status="pending",
            )
            db.session.add(prize)
        db.session.commit()

    def register_participant(self, tournament_id: int, user_id: int) -> TournamentParticipant:
        """Register a participant for a tournament."""
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        if tournament.status != "registration_open":
            raise ValueError("Tournament registration is not open")

        existing = TournamentParticipant.query.filter_by(
            tournament_id=tournament_id, user_id=user_id
        ).first()

        if existing:
            raise ValueError("Already registered for this tournament")

        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=user_id,
            status="registered",
            payment_status="pending" if tournament.entry_fee > 0 else "paid",
        )
        db.session.add(participant)
        db.session.commit()
        return participant

    def generate_brackets(self, tournament_id: int) -> List[TournamentBracket]:
        """Generate tournament brackets based on registered participants."""
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        participants = TournamentParticipant.query.filter_by(
            tournament_id=tournament_id, status="checked_in"
        ).all()

        if not participants:
            raise ValueError("No checked-in participants")

        # Calculate number of rounds needed
        num_participants = len(participants)
        math.ceil(math.log2(num_participants))

        # Create winners bracket
        winners_bracket = TournamentBracket(
            tournament_id=tournament_id, name="Winners", round_number=1, is_active=True
        )
        db.session.add(winners_bracket)
        db.session.commit()

        # Generate first round matches
        self._generate_first_round_matches(winners_bracket, participants)

        return [winners_bracket]

    def _generate_first_round_matches(
        self, bracket: TournamentBracket, participants: List[TournamentParticipant]
    ) -> None:
        """Generate first round matches for a bracket."""
        num_participants = len(participants)
        num_byes = 2 ** math.ceil(math.log2(num_participants)) - num_participants

        # Pair up participants for matches
        for i in range(0, num_participants - num_byes, 2):
            match = TournamentMatch(bracket_id=bracket.id, status="scheduled")
            db.session.add(match)
            db.session.commit()

            # Add players to match
            for position, participant in enumerate([participants[i], participants[i + 1]], 1):
                match_player = TournamentMatchPlayer(
                    match_id=match.id, participant_id=participant.id, position=position
                )
                db.session.add(match_player)

        # Handle byes if needed
        for i in range(num_participants - num_byes, num_participants):
            match = TournamentMatch(bracket_id=bracket.id, status="scheduled")
            db.session.add(match)
            db.session.commit()

            match_player = TournamentMatchPlayer(
                match_id=match.id, participant_id=participants[i].id, position=1
            )
            db.session.add(match_player)

        db.session.commit()

    def update_match_result(self, match_id: int, winner_id: int, score: str) -> TournamentMatch:
        """Update match result and progress tournament."""
        match = TournamentMatch.query.get(match_id)
        if not match:
            raise ValueError("Match not found")

        if match.status != "in_progress":
            raise ValueError("Match is not in progress")

        match.winner_id = winner_id
        match.score = score
        match.status = "completed"
        match.actual_end_time = datetime.utcnow()

        # Update participant statuses
        winner = TournamentParticipant.query.filter_by(
            tournament_id=match.bracket.tournament_id, user_id=winner_id
        ).first()
        winner.status = "active"

        # Get loser and update status
        loser = next((p for p in match.players if p.user_id != winner_id), None)
        if loser:
            loser.status = "eliminated"

        db.session.commit()

        # Progress tournament if needed
        self._progress_tournament(match.bracket.tournament_id)

        return match

    def _progress_tournament(self, tournament_id: int) -> None:
        """Progress tournament to next round or completion."""
        tournament = Tournament.query.get(tournament_id)
        active_matches = (
            TournamentMatch.query.join(TournamentBracket)
            .filter(
                TournamentBracket.tournament_id == tournament_id,
                TournamentMatch.status.in_(["scheduled", "in_progress"]),
            )
            .all()
        )

        if not active_matches:
            # All matches completed, check if tournament is finished
            remaining_active = TournamentParticipant.query.filter_by(
                tournament_id=tournament_id, status="active"
            ).count()

            if remaining_active == 1:
                # Tournament completed
                winner = TournamentParticipant.query.filter_by(
                    tournament_id=tournament_id, status="active"
                ).first()
                winner.status = "winner"
                tournament.status = "completed"

                # Update prizes
                self._distribute_prizes(tournament, winner)
            else:
                # Generate next round matches
                self._generate_next_round_matches(tournament)

        db.session.commit()

    def _generate_next_round_matches(self, tournament: Tournament) -> None:
        """Generate matches for the next round."""
        active_participants = TournamentParticipant.query.filter_by(
            tournament_id=tournament.id, status="active"
        ).all()

        current_bracket = TournamentBracket.query.filter_by(
            tournament_id=tournament.id, is_active=True
        ).first()

        # Create new bracket for next round
        next_bracket = TournamentBracket(
            tournament_id=tournament.id,
            name=f"Round {current_bracket.round_number + 1}",
            round_number=current_bracket.round_number + 1,
            is_active=True,
        )
        current_bracket.is_active = False
        db.session.add(next_bracket)
        db.session.commit()

        # Generate matches for next round
        self._generate_first_round_matches(next_bracket, active_participants)

    def _distribute_prizes(self, tournament: Tournament, winner: TournamentParticipant) -> None:
        """Distribute prizes to tournament winners."""
        prizes = (
            TournamentPrize.query.filter_by(tournament_id=tournament.id)
            .order_by(TournamentPrize.position)
            .all()
        )

        # Assign first place
        prizes[0].winner_id = winner.user_id
        prizes[0].distribution_status = "pending"

        # Find second and third place finishers based on elimination order
        runners_up = (
            TournamentParticipant.query.filter_by(tournament_id=tournament.id, status="eliminated")
            .order_by(TournamentParticipant.updated_at.desc())
            .limit(2)
            .all()
        )

        if len(runners_up) > 0:
            prizes[1].winner_id = runners_up[0].user_id
            prizes[1].distribution_status = "pending"

        if len(runners_up) > 1:
            prizes[2].winner_id = runners_up[1].user_id
            prizes[2].distribution_status = "pending"

        db.session.commit()

    def get_tournament_status(self, tournament_id: int) -> Dict:
        """Get comprehensive tournament status including brackets and matches."""
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        brackets = (
            TournamentBracket.query.filter_by(tournament_id=tournament_id)
            .order_by(TournamentBracket.round_number)
            .all()
        )

        bracket_data = []
        for bracket in brackets:
            matches = TournamentMatch.query.filter_by(bracket_id=bracket.id).all()

            match_data = []
            for match in matches:
                players = (
                    TournamentParticipant.query.join(TournamentMatchPlayer)
                    .filter(TournamentMatchPlayer.match_id == match.id)
                    .all()
                )

                match_data.append(
                    {
                        "id": match.id,
                        "status": match.status,
                        "scheduled_time": (
                            match.scheduled_time.isoformat() if match.scheduled_time else None
                        ),
                        "score": match.score,
                        "winner_id": match.winner_id,
                        "players": [
                            {"id": p.user_id, "username": p.user.username, "status": p.status}
                            for p in players
                        ],
                    }
                )

            bracket_data.append(
                {
                    "id": bracket.id,
                    "name": bracket.name,
                    "round_number": bracket.round_number,
                    "is_active": bracket.is_active,
                    "matches": match_data,
                }
            )

        return {
            "id": tournament.id,
            "name": tournament.name,
            "status": tournament.status,
            "brackets": bracket_data,
            "prizes": [
                {
                    "position": p.position,
                    "amount": p.prize_amount,
                    "winner_id": p.winner_id,
                    "status": p.distribution_status,
                }
                for p in tournament.prizes
            ],
        }
