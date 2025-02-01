"""Tournament module."""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func

from dojopool.core.exceptions import TournamentError
from dojopool.models import (
    Game,
    GameType,
    Tournament,
    TournamentBracket,
    TournamentBracketType,
    TournamentFormat,
    TournamentGame,
    TournamentPlayer,
    TournamentRound,
    TournamentRoundType,
    TournamentStatus,
    TournamentType,
    User,
    db,
)


class TournamentService:
    """Tournament service."""

    def __init__(self):
        """Initialize tournament service."""
        pass

    def create_tournament(
        self,
        name: str,
        description: str,
        tournament_type: TournamentType,
        format: TournamentFormat,
        start_date: datetime,
        end_date: datetime,
        max_players: int,
        entry_fee: float = 0.0,
        prize_pool: float = 0.0,
        game_type: GameType = GameType.EIGHT_BALL,
    ) -> Tournament:
        """Create new tournament.

        Args:
            name: Tournament name
            description: Tournament description
            tournament_type: Tournament type
            format: Tournament format
            start_date: Start date
            end_date: End date
            max_players: Maximum number of players
            entry_fee: Entry fee
            prize_pool: Prize pool
            game_type: Game type

        Returns:
            Created tournament

        Raises:
            TournamentError: If tournament creation fails
        """
        if start_date >= end_date:
            raise TournamentError("Start date must be before end date")

        tournament = Tournament(
            name=name,
            description=description,
            type=tournament_type,
            format=format,
            start_date=start_date,
            end_date=end_date,
            max_players=max_players,
            entry_fee=entry_fee,
            prize_pool=prize_pool,
            game_type=game_type,
            status=TournamentStatus.PENDING,
        )

        db.session.add(tournament)
        db.session.commit()

        return tournament

    def register_player(self, tournament_id: int, user_id: int) -> TournamentPlayer:
        """Register player for tournament.

        Args:
            tournament_id: Tournament ID
            user_id: User ID

        Returns:
            Created tournament player

        Raises:
            TournamentError: If registration fails
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise TournamentError("Tournament not found")

        if tournament.status != TournamentStatus.PENDING:
            raise TournamentError("Tournament is not accepting registrations")

        if len(tournament.players) >= tournament.max_players:
            raise TournamentError("Tournament is full")

        if any(p.user_id == user_id for p in tournament.players):
            raise TournamentError("Player already registered")

        player = TournamentPlayer(tournament_id=tournament_id, user_id=user_id)

        db.session.add(player)
        db.session.commit()

        return player

    def start_tournament(self, tournament_id: int) -> None:
        """Start tournament.

        Args:
            tournament_id: Tournament ID

        Raises:
            TournamentError: If tournament cannot be started
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise TournamentError("Tournament not found")

        if tournament.status != TournamentStatus.PENDING:
            raise TournamentError("Tournament cannot be started")

        if len(tournament.players) < 2:
            raise TournamentError("Not enough players")

        # Create brackets and rounds based on format
        if tournament.format == TournamentFormat.SINGLE_ELIMINATION:
            self._create_single_elimination_brackets(tournament)
        elif tournament.format == TournamentFormat.DOUBLE_ELIMINATION:
            self._create_double_elimination_brackets(tournament)
        elif tournament.format == TournamentFormat.ROUND_ROBIN:
            self._create_round_robin_brackets(tournament)

        tournament.status = TournamentStatus.IN_PROGRESS
        tournament.started_at = datetime.utcnow()
        db.session.commit()

    def _create_single_elimination_brackets(self, tournament: Tournament) -> None:
        """Create single elimination brackets.

        Args:
            tournament: Tournament
        """
        players = tournament.players
        num_players = len(players)

        # Calculate number of rounds needed
        num_rounds = (num_players - 1).bit_length()

        # Create rounds
        rounds = []
        for i in range(num_rounds):
            round = TournamentRound(
                tournament_id=tournament.id,
                round_number=i + 1,
                type=TournamentRoundType.WINNERS,
            )
            db.session.add(round)
            rounds.append(round)

        # Create initial brackets
        num_byes = 2**num_rounds - num_players
        num_first_round_games = num_players - num_byes

        for i in range(0, num_first_round_games, 2):
            bracket = TournamentBracket(
                tournament_id=tournament.id,
                round_id=rounds[0].id,
                type=TournamentBracketType.WINNERS,
                player1_id=players[i].id,
                player2_id=players[i + 1].id,
            )
            db.session.add(bracket)

        # Add byes
        for i in range(num_first_round_games, num_players):
            bracket = TournamentBracket(
                tournament_id=tournament.id,
                round_id=rounds[1].id,
                type=TournamentBracketType.WINNERS,
                player1_id=players[i].id,
            )
            db.session.add(bracket)

    def _create_double_elimination_brackets(self, tournament: Tournament) -> None:
        """Create double elimination brackets.

        Args:
            tournament: Tournament
        """
        # TODO: Implement double elimination bracket creation
        pass

    def _create_round_robin_brackets(self, tournament: Tournament) -> None:
        """Create round robin brackets.

        Args:
            tournament: Tournament
        """
        players = tournament.players
        num_players = len(players)

        # Create rounds (each player plays against every other player)
        rounds = []
        for i in range(num_players - 1):
            round = TournamentRound(
                tournament_id=tournament.id,
                round_number=i + 1,
                type=TournamentRoundType.ROUND_ROBIN,
            )
            db.session.add(round)
            rounds.append(round)

        # Create brackets for each round
        for round in rounds:
            for i in range(num_players):
                for j in range(i + 1, num_players):
                    bracket = TournamentBracket(
                        tournament_id=tournament.id,
                        round_id=round.id,
                        type=TournamentBracketType.ROUND_ROBIN,
                        player1_id=players[i].id,
                        player2_id=players[j].id,
                    )
                    db.session.add(bracket)

    def record_game_result(
        self,
        tournament_id: int,
        bracket_id: int,
        winner_id: int,
        loser_id: int,
        score: Optional[str] = None,
    ) -> None:
        """Record game result.

        Args:
            tournament_id: Tournament ID
            bracket_id: Bracket ID
            winner_id: Winner ID
            loser_id: Loser ID
            score: Game score

        Raises:
            TournamentError: If result cannot be recorded
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise TournamentError("Tournament not found")

        if tournament.status != TournamentStatus.IN_PROGRESS:
            raise TournamentError("Tournament is not in progress")

        bracket = TournamentBracket.query.get(bracket_id)
        if not bracket:
            raise TournamentError("Bracket not found")

        if bracket.game_id:
            raise TournamentError("Game result already recorded")

        # Create game record
        game = Game(
            type=tournament.game_type,
            winner_id=winner_id,
            loser_id=loser_id,
            score=score,
            completed_at=datetime.utcnow(),
        )
        db.session.add(game)

        # Update bracket
        bracket.game_id = game.id
        bracket.winner_id = winner_id
        bracket.completed_at = datetime.utcnow()

        # Advance winner to next round if applicable
        if tournament.format != TournamentFormat.ROUND_ROBIN:
            self._advance_winner(tournament, bracket, winner_id)

        # Check if tournament is complete
        if self._is_tournament_complete(tournament):
            tournament.status = TournamentStatus.COMPLETED
            tournament.completed_at = datetime.utcnow()

        db.session.commit()

    def _advance_winner(
        self, tournament: Tournament, bracket: TournamentBracket, winner_id: int
    ) -> None:
        """Advance winner to next round.

        Args:
            tournament: Tournament
            bracket: Current bracket
            winner_id: Winner ID
        """
        current_round = TournamentRound.query.get(bracket.round_id)
        if not current_round:
            return

        # Find or create next round bracket
        next_round = TournamentRound.query.filter_by(
            tournament_id=tournament.id, round_number=current_round.round_number + 1
        ).first()

        if next_round:
            # Find available bracket in next round
            next_bracket = TournamentBracket.query.filter_by(
                tournament_id=tournament.id, round_id=next_round.id, player1_id=None
            ).first()

            if next_bracket:
                next_bracket.player1_id = winner_id
            else:
                next_bracket = TournamentBracket.query.filter_by(
                    tournament_id=tournament.id, round_id=next_round.id, player2_id=None
                ).first()

                if next_bracket:
                    next_bracket.player2_id = winner_id

    def _is_tournament_complete(self, tournament: Tournament) -> bool:
        """Check if tournament is complete.

        Args:
            tournament: Tournament

        Returns:
            True if tournament is complete
        """
        if tournament.format == TournamentFormat.ROUND_ROBIN:
            # Check if all games are completed
            return not TournamentBracket.query.filter_by(
                tournament_id=tournament.id, completed_at=None
            ).first()
        else:
            # Check if final bracket is completed
            final_round = (
                TournamentRound.query.filter_by(tournament_id=tournament.id)
                .order_by(TournamentRound.round_number.desc())
                .first()
            )

            if not final_round:
                return False

            final_bracket = TournamentBracket.query.filter_by(
                tournament_id=tournament.id, round_id=final_round.id
            ).first()

            return final_bracket and final_bracket.completed_at is not None

    def get_standings(self, tournament_id: int) -> List[Dict[str, Any]]:
        """Get tournament standings.

        Args:
            tournament_id: Tournament ID

        Returns:
            List of player standings

        Raises:
            TournamentError: If tournament not found
        """
        tournament = Tournament.query.get(tournament_id)
        if not tournament:
            raise TournamentError("Tournament not found")

        if tournament.format == TournamentFormat.ROUND_ROBIN:
            return self._get_round_robin_standings(tournament)
        else:
            return self._get_elimination_standings(tournament)

    def _get_round_robin_standings(self, tournament: Tournament) -> List[Dict[str, Any]]:
        """Get round robin tournament standings.

        Args:
            tournament: Tournament

        Returns:
            List of player standings
        """
        standings = []

        for player in tournament.players:
            # Get player's games
            games = (
                Game.query.join(TournamentBracket, Game.id == TournamentBracket.game_id)
                .filter(
                    TournamentBracket.tournament_id == tournament.id,
                    (Game.winner_id == player.user_id) | (Game.loser_id == player.user_id),
                )
                .all()
            )

            # Calculate stats
            total_games = len(games)
            wins = sum(1 for game in games if game.winner_id == player.user_id)
            losses = total_games - wins

            standings.append(
                {
                    "player_id": player.user_id,
                    "username": player.user.username,
                    "wins": wins,
                    "losses": losses,
                    "total_games": total_games,
                    "win_rate": wins / total_games if total_games > 0 else 0.0,
                }
            )

        # Sort by wins, then win rate
        standings.sort(key=lambda x: (x["wins"], x["win_rate"]), reverse=True)

        return standings

    def _get_elimination_standings(self, tournament: Tournament) -> List[Dict[str, Any]]:
        """Get elimination tournament standings.

        Args:
            tournament: Tournament

        Returns:
            List of player standings
        """
        standings = []

        # Get all completed brackets
        brackets = (
            TournamentBracket.query.filter_by(tournament_id=tournament.id, completed_at=not None)
            .order_by(TournamentBracket.completed_at.desc())
            .all()
        )

        # Track eliminated players
        eliminated = set()
        for bracket in brackets:
            if bracket.winner_id and bracket.winner_id not in eliminated:
                standings.append(
                    {
                        "player_id": bracket.winner_id,
                        "username": User.query.get(bracket.winner_id).username,
                        "place": len(standings) + 1,
                    }
                )

            if bracket.loser_id:
                eliminated.add(bracket.loser_id)
                if bracket.loser_id not in [s["player_id"] for s in standings]:
                    standings.append(
                        {
                            "player_id": bracket.loser_id,
                            "username": User.query.get(bracket.loser_id).username,
                            "place": len(standings) + 1,
                        }
                    )

        return standings


tournament_service = TournamentService()

__all__ = ["tournament_service", "TournamentService"]
