from flask_caching import Cache
from multiprocessing import Pool
from sqlalchemy.orm import joinedload
from flask_caching import Cache
from multiprocessing import Pool
from sqlalchemy.orm import joinedload
"""Tournament service module."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import ForeignKey, desc
from sqlalchemy.orm import Mapped, Session, mapped_column, relationship

from ..core.extensions import db
from ..models.game import Game
from ..models.notification import Notification
from ..models.tournament import Tournament, TournamentPrize
from ..models.tournament_match import TournamentMatch
from ..models.tournament_participant import TournamentParticipant
from ..models.tournament_round import TournamentRound
from ..models.user import User
from ..models.venue import Venue


class TournamentService:
    """Service for managing tournament operations."""

    def create_tournament(
        self,
        name: str,
        start_date: datetime,
        venue_id: Optional[int] = None,
    ) -> Tournament:
        """Create a new tournament."""
        tournament: Tournament = Tournament(
            name=name,
            start_date=start_date,
            venue_id=venue_id,
            status="REGISTRATION_OPEN",
        )

        db.session.add(tournament)
        db.session.commit()

        return tournament

    def get_tournament(self, tournament_id: int):
        """Get tournament by ID."""
        return Tournament.query.get(tournament_id)

    def get_active_tournaments(self):
        """Get all active tournaments."""
        return Tournament.query.filter(
            Tournament.status.in_(["REGISTRATION_OPEN", "IN_PROGRESS"])
        ).all()

    def start_tournament(self, tournament_id: int):
        """Start a tournament."""
        tournament: Tournament = self.get_tournament(tournament_id)
        if tournament:
            tournament.start()
            db.session.commit()
        return tournament

    def complete_tournament(self, tournament_id: int) -> Tournament:
        """Complete a tournament."""
        tournament: Tournament = self.get_tournament(tournament_id)
        if tournament:
            tournament.complete()
            db.session.commit()
        return tournament

    def cancel_tournament(self, tournament_id: int):
        """Cancel a tournament."""
        tournament: Tournament = self.get_tournament(tournament_id)
        if tournament:
            tournament.cancel()
            db.session.commit()
        return tournament

    def create_tournament_match(
        self,
        tournament_id: int,
        round_id: int,
        player1_id: int,
        player2_id: int,
    ):
        """Create a tournament match."""
        match: TournamentMatch = TournamentMatch(
            tournament_id=tournament_id,
            round_id=round_id,
            player1_id=player1_id,
            player2_id=player2_id,
            status="SCHEDULED",
        )

        db.session.add(match)
        db.session.commit()

        return match

    def get_tournament_matches(self, tournament_id: int):
        """Get all matches for a tournament."""
        return TournamentMatch.query.filter_by(tournament_id=tournament_id).all()

    def get_tournament_rounds(self, tournament_id: int) -> List[TournamentRound]:
        """Get all rounds for a tournament."""
        return TournamentRound.query.filter_by(tournament_id=tournament_id).all()

    def create_tournament_round(
        self,
        tournament_id: int,
        round_number: int,
        name: str,
    ):
        """Create a tournament round."""
        round: TournamentRound = TournamentRound(
            tournament_id=tournament_id,
            round_number=round_number,
            name=name,
            status="PENDING",
        )

        db.session.add(round)
        db.session.commit()

        return round

    def register_player(
        self, tournament_id: int, player_id: int, seed: Optional[int] = None
    ):
        """
        Register a player for a tournament.

        Args:
            tournament_id: Tournament ID
            player_id: Player ID
            seed: Optional seed number

        Returns:
            TournamentMatch: Created tournament player entry
        """
        tournament: Tournament = Tournament.query.get_or_404(tournament_id)

        # Check if tournament is open for registration
        if tournament.status != "pending":
            raise ValueError("Tournament is not open for registration")

        # Check if player is already registered
        if TournamentMatch.query.filter_by(
            tournament_id=tournament_id, player_id=player_id
        ).first():
            raise ValueError("Player is already registered")

        # Check if tournament is full
        if tournament.max_players:
            current_players: Any = TournamentMatch.query.filter_by(
                tournament_id=tournament_id
            ).count()
            if current_players >= tournament.max_players:
                raise ValueError("Tournament is full")

        # Create tournament player entry
        tournament_match: TournamentMatch = TournamentMatch(
            tournament_id=tournament_id, player_id=player_id, seed=seed, status="active"
        )

        db.session.add(tournament_match)
        db.session.commit()

        return tournament_match

    def start_tournament(self, tournament_id: int):
        """
        Start a tournament.

        Args:
            tournament_id: Tournament ID
        """
        tournament: Tournament = Tournament.query.get_or_404(tournament_id)

        # Check if tournament can be started
        if tournament.status != "pending":
            raise ValueError("Tournament cannot be started")

        # Get registered players
        players: Any = (
            TournamentMatch.query.filter_by(
                tournament_id=tournament_id, status="active"
            )
            .order_by(TournamentMatch.seed)
            .all()
        )

        if not players:
            raise ValueError("No players registered")

        # Create initial rounds and brackets based on format
        if tournament.format == "single_elimination":
            self._create_single_elimination_brackets(tournament, players)
        elif tournament.format == "double_elimination":
            self._create_double_elimination_brackets(tournament, players)
        elif tournament.format == "round_robin":
            self._create_round_robin_matches(tournament, players)

        # Update tournament status
        tournament.status = "active"
        tournament.start_date = datetime.utcnow()
        db.session.commit()

    def _create_single_elimination_brackets(
        self, tournament: Tournament, players: List[TournamentMatch]
    ):
        """Create single elimination tournament matches."""
        # Create first round
        round: TournamentRound = TournamentRound(
            tournament_id=tournament.id,
            round_number=1,
            name="Round 1",
            status="PENDING",
        )
        db.session.add(round)
        db.session.flush()

        # Create matches for first round
        for i in range(0, len(players), 2):
            if i + 1 < len(players):
                match: TournamentMatch = TournamentMatch(
                    tournament_id=tournament.id,
                    round_id=round.id,
                    player1_id=players[i].player_id,
                    player2_id=players[i + 1].player_id,
                    match_number=i // 2 + 1,
                    status="SCHEDULED",
                )
                db.session.add(match)
            else:  # Bye round - player advances automatically
                players[i].status = "advanced"

        db.session.commit()

    def _create_double_elimination_brackets(
        self, tournament: Tournament, players: List[TournamentMatch]
    ):
        """Create double elimination tournament matches."""
        # Create winners round 1
        winners_round: TournamentRound = TournamentRound(
            tournament_id=tournament.id,
            round_number=1,
            name="Winners Round 1",
            status="PENDING",
        )
        db.session.add(winners_round)
        db.session.flush()

        # Create matches for winners round 1
        for i in range(0, len(players), 2):
            if i + 1 < len(players):
                match: TournamentMatch = TournamentMatch(
                    tournament_id=tournament.id,
                    round_id=winners_round.id,
                    player1_id=players[i].player_id,
                    player2_id=players[i + 1].player_id,
                    match_number=i // 2 + 1,
                    status="SCHEDULED",
                )
                db.session.add(match)
            else:  # Bye round - player advances automatically
                players[i].status = "advanced"

        db.session.commit()

    def _create_round_robin_matches(
        self, tournament: Tournament, players: List[TournamentMatch]
    ):
        """Create round robin tournament matches."""
        # Create matches for each player pair
        match_number: int = 1
        for i, player1 in enumerate(players):
            for player2 in players[i + 1 :]:
                game: Any = Game(
                    player1_id=player1.player_id,
                    player2_id=player2.player_id,
                    game_type="tournament",
                    status="pending",
                )
                db.session.add(game)
                db.session.flush()

                tournament_game: Any = TournamentMatch(
                    tournament_id=tournament.id,
                    round_id=1,
                    player1_id=player1.player_id,
                    player2_id=player2.player_id,
                    match_number=match_number,
                    status="SCHEDULED",
                )
                db.session.add(tournament_game)
                match_number += 1

    def complete_match(
        self, tournament_id: int, game_id: int, winner_id: int, score: str
    ):
        """
        Complete a tournament match.

        Args:
            tournament_id: Tournament ID
            game_id: Game ID
            winner_id: Winner player ID
            score: Game score
        """
        tournament: Tournament = Tournament.query.get_or_404(tournament_id)
        game: Any = Game.query.get_or_404(game_id)

        # Update game
        game.status = "completed"
        game.winner_id = winner_id
        game.score = score
        game.completed_at = datetime.utcnow()

        # Update tournament players
        if tournament.format in ["single_elimination", "double_elimination"]:
            loser_id: Any = (
                game.player1_id if winner_id == game.player2_id else game.player2_id
            )

            winner: Any = TournamentMatch.query.filter_by(
                tournament_id=tournament_id, player_id=winner_id
            ).first()
            winner.status = "advanced"

            loser: Any = TournamentMatch.query.filter_by(
                tournament_id=tournament_id, player_id=loser_id
            ).first()

            if tournament.format == "single_elimination":
                loser.status = "eliminated"
            else:
                loser.status = "losers_bracket"

        db.session.commit()

        # Check if tournament is complete
        self._check_tournament_completion(tournament)

    def _check_tournament_completion(self, tournament: Tournament):
        """Check if tournament is complete and update status."""
        incomplete_games: Any = (
            TournamentMatch.query.filter_by(tournament_id=tournament.id)
            .join(Game)
            .filter(Game.status != "completed")
            .count()
        )

        if incomplete_games == 0:
            tournament.status = "completed"
            tournament.end_date = datetime.utcnow()
            db.session.commit()

    def get_standings(self, tournament_id: int) -> List[Dict]:
        """
        Get tournament standings.

        Args:
            tournament_id: Tournament ID

        Returns:
            List[Dict]: List of player standings
        """
        tournament: Tournament = Tournament.query.get_or_404(tournament_id)

        standings: List[Any] = []
        players: Any = TournamentMatch.query.filter_by(
            tournament_id=tournament_id
        ).all()

        for player in players:
            games: Any = (
                TournamentMatch.query.filter_by(tournament_id=tournament_id)
                .join(Game)
                .filter(
                    (Game.player1_id == player.player_id)
                    | (Game.player2_id == player.player_id)
                )
                .all()
            )

            wins: int = 0
            losses: int = 0
            points_for: int = 0
            points_against: int = 0

            for game in games:
                if game.game.status == "completed":
                    score_parts: Any = game.game.score.split("-")
                    if game.game.player1_id == player.player_id:
                        points_for += int(score_parts[0])
                        points_against += int(score_parts[1])
                        if game.game.winner_id == player.player_id:
                            wins += 1
                        else:
                            losses += 1
                    else:
                        points_for += int(score_parts[1])
                        points_against += int(score_parts[0])
                        if game.game.winner_id == player.player_id:
                            wins += 1
                        else:
                            losses += 1

            standings.append(
                {
                    "player_id": player.player_id,
                    "status": player.status,
                    "wins": wins,
                    "losses": losses,
                    "points_for": points_for,
                    "points_against": points_against,
                    "point_differential": points_for - points_against,
                }
            )

        # Sort standings
        if tournament.format == "round_robin":
            standings.sort(
                key=lambda x: (x["wins"], x["point_differential"], x["points_for"]),
                reverse=True,
            )
        else:
            standings.sort(
                key=lambda x: (
                    x["status"] != "active",
                    -x["wins"],
                    x["losses"],
                    -x["point_differential"],
                )
            )

        return standings

    def get_tournaments(
        self, limit: int = 10, offset: int = 0, filters: Optional[Dict] = None
    ) -> List[Tournament]:
        """Get list of tournaments with optional filtering.

        Args:
            limit: Maximum number of tournaments to return
            offset: Number of tournaments to skip
            filters: Optional filters to apply

        Returns:
            List of tournaments
        """
        query: Any = Tournament.query

        if filters:
            if "venue_id" in filters:
                query: Any = query.filter(Tournament.venue_id == filters["venue_id"])
            if "status" in filters:
                query: Any = query.filter(Tournament.status == filters["status"])

        return query.offset(offset).limit(limit).all()

    def update_tournament(self, tournament_id: int, data: Dict[str, Any]):
        """Update tournament details.

        Args:
            tournament_id: Tournament ID
            data: Updated tournament data

        Returns:
            Updated tournament if found, None otherwise
        """
        tournament: Tournament = self.get_tournament(tournament_id)
        if not tournament:
            return None

        for key, value in data.items():
            setattr(tournament, key, value)

        db.session.commit()
        return tournament

    def register_participant(self, tournament_id: int, user_id: int):
        """Register a participant for a tournament.

        Args:
            tournament_id: Tournament ID
            user_id: User ID

        Returns:
            Created tournament participant
        """
        tournament: Tournament = self.get_tournament(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        if tournament.status != "open":
            raise ValueError("Tournament is not open for registration")

        # Check if user is already registered
        existing: Any = TournamentMatch.query.filter_by(
            tournament_id=tournament_id, player_id=user_id
        ).first()
        if existing:
            raise ValueError("User already registered for this tournament")

        participant: TournamentMatch = TournamentMatch(
            tournament_id=tournament_id,
            player_id=user_id,
            registration_date=datetime.utcnow(),
        )
        db.session.add(participant)
        db.session.commit()

        return participant

    def generate_bracket(self, tournament_id: int):
        """Generate tournament bracket.

        Args:
            tournament_id: Tournament ID

        Returns:
            Generated bracket data
        """
        tournament: Tournament = self.get_tournament(tournament_id)
        if not tournament:
            raise ValueError("Tournament not found")

        if tournament.status != "pending":
            raise ValueError("Tournament must be in pending state to generate bracket")

        participants: Any = TournamentMatch.query.filter_by(
            tournament_id=tournament_id
        ).all()
        if len(participants) < tournament.min_players:
            raise ValueError(f"Need at least {tournament.min_players} players to start")

        # Generate matches based on seeding
        matches: Any = self._generate_matches(tournament, participants)

        # Update tournament status
        tournament.status = "active"
        db.session.commit()

        return {
            "tournament_id": tournament_id,
            "matches": [match.to_dict() for match in matches],
            "total_rounds": tournament.total_rounds,
        }

    def _generate_matches(
        self, tournament: Tournament, participants: List[TournamentMatch]
    ) -> List[TournamentMatch]:
        """Generate initial matches for tournament.

        Args:
            tournament: Tournament instance
            participants: List of participants

        Returns:
            List of generated matches
        """
        # Sort participants by rating/seed
        participants.sort(key=lambda x: x.rating or 0, reverse=True)

        matches: Any = []
        round_number: int = 1

        # Generate first round matches
        for i in range(0, len(participants), 2):
            if i + 1 < len(participants):
                match: TournamentMatch = TournamentMatch(
                    tournament_id=tournament.id,
                    round_number=round_number,
                    player1_id=participants[i].player_id,
                    player2_id=participants[i + 1].player_id,
                )
            else:
                # Bye match
                match: TournamentMatch = TournamentMatch(
                    tournament_id=tournament.id,
                    round_number=round_number,
                    player1_id=participants[i].player_id,
                    is_bye=True,
                )
            matches.append(match)
            db.session.add(match)

        db.session.commit()
        return matches

    def update_match(self, match_id: int, data: Dict[str, Any]):
        """Update match details and progress tournament.

        Args:
            match_id: Match ID
            data: Updated match data

        Returns:
            Updated match if found, None otherwise
        """
        match: TournamentMatch = TournamentMatch.query.get(match_id)
        if not match:
            return None

        # Update match data
        for key, value in data.items():
            setattr(match, key, value)

        # If match is complete, update tournament progress
        if match.winner_id and not match.processed:
            self._process_match_result(match)

        db.session.commit()
        return match

    def _process_match_result(self, match: TournamentMatch):
        """Process match result and create next round match if needed.

        Args:
            match: Completed match
        """
        tournament: Tournament = self.get_tournament(match.tournament_id)
        if not tournament:
            return

        # Mark match as processed
        match.processed = True

        # Check if all matches in current round are complete
        current_round_matches: Any = TournamentMatch.query.filter_by(
            tournament_id=tournament.id, round_number=match.round_number
        ).all()

        if all(m.processed for m in current_round_matches):
            # Generate next round matches
            winners: Any = [m.winner_id for m in current_round_matches]
            if len(winners) > 1:
                self._create_next_round_matches(
                    tournament, winners, match.round_number + 1
                )
            else:
                # Tournament complete
                tournament.status = "completed"
                tournament.winner_id = winners[0]
                tournament.end_date = datetime.utcnow()

                # Create notification for winner
                Notification.create(
                    user_id=winners[0],
                    type="tournament_won",
                    title=f"Tournament Victory in {tournament.name}",
                    message=f"Congratulations! You won the tournament {tournament.name}!",
                    data={"tournament_id": tournament.id},
                )

    def _create_next_round_matches(
        self, tournament: Tournament, winners: List[int], round_number: int
    ) -> None:
        """Create matches for the next tournament round.

        Args:
            tournament: Tournament instance
            winners: List of winners from previous round
            round_number: Round number to create
        """
        for i in range(0, len(winners), 2):
            if i + 1 < len(winners):
                match: TournamentMatch = TournamentMatch(
                    tournament_id=tournament.id,
                    round_number=round_number,
                    player1_id=winners[i],
                    player2_id=winners[i + 1],
                )
            else:
                # Bye match
                match: TournamentMatch = TournamentMatch(
                    tournament_id=tournament.id,
                    round_number=round_number,
                    player1_id=winners[i],
                    is_bye=True,
                )
            db.session.add(match)

    def get_participant_matches(self, tournament_id: int, participant_id: int):
        """Get matches for a participant in a tournament.

        Args:
            tournament_id: Tournament ID
            participant_id: Participant ID

        Returns:
            List of matches
        """
        return TournamentMatch.query.filter(
            TournamentMatch.tournament_id == tournament_id,
            (
                (TournamentMatch.player1_id == participant_id)
                | (TournamentMatch.player2_id == participant_id)
            ),
        ).all()
