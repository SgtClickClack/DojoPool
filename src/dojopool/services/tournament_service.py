"""Tournament service module."""

from datetime import datetime
from typing import Dict, List, Optional

from dojopool.models.game import Game
from dojopool.models.tournament import Tournament
from dojopool.core.extensions import db


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
    ) -> None:
        """
        Register a player for a tournament.

        Args:
            tournament_id: Tournament ID
            player_id: Player ID
            seed: Optional seed number

        Returns:
            None
        """
        tournament = Tournament.query.get_or_404(tournament_id)

        # Check if tournament is open for registration
        if tournament.status != "pending":
            raise ValueError("Tournament is not open for registration")

        # Check if player is already registered
        # if TournamentPlayer.query.filter_by(
        #     tournament_id=tournament_id, player_id=player_id
        # ).first():
        #     raise ValueError("Player is already registered")

        # Check if tournament is full
        if tournament.max_players:
            # current_players = TournamentPlayer.query.filter_by(tournament_id=tournament_id).count()
            # if current_players >= tournament.max_players:
            #     raise ValueError("Tournament is full")

            pass

        # Create tournament player entry
        # tournament_player = TournamentPlayer(
        #     tournament_id=tournament_id, player_id=player_id, seed=seed, status="active"
        # )

        # db.session.add(tournament_player)
        # db.session.commit()

    def start_tournament(self, tournament_id: int):
        """
        Start a tournament.

        Args:
            tournament_id: Tournament ID
        """
        tournament = Tournament.query.get_or_404(tournament_id)

        # Check if tournament can be started
        if tournament.status != "pending":
            raise ValueError("Tournament cannot be started")

        # Get registered players
        # players = (
        #     TournamentPlayer.query.filter_by(tournament_id=tournament_id, status="active")
        #     .order_by(TournamentPlayer.seed)
        #     .all()
        # )

        # if not players:
        #     raise ValueError("No players registered")

        # Create initial rounds and brackets based on format
        # if tournament.format == "single_elimination":
        #     self._create_single_elimination_brackets(tournament, players)
        # elif tournament.format == "double_elimination":
        #     self._create_double_elimination_brackets(tournament, players)
        # elif tournament.format == "round_robin":
        #     self._create_round_robin_matches(tournament, players)

        # Update tournament status
        tournament.status = "active"
        tournament.start_date = datetime.utcnow()
        db.session.commit()

    # def _create_single_elimination_brackets(
    #     self, tournament: Tournament, players: List[TournamentPlayer]
    # ):
    #     """Create single elimination tournament brackets."""
    #     # Create first round
    #     round = TournamentRound(
    #         tournament_id=tournament.id, round_number=1, round_type="winners", status="pending"
    #     )
    #     db.session.add(round)
    #     db.session.flush()

    #     # Create matches for first round
    #     for i in range(0, len(players), 2):
    #         if i + 1 < len(players):
    #             game = Game(
    #                 player1_id=players[i].player_id,
    #                 player2_id=players[i + 1].player_id,
    #                 game_type="tournament",
    #                 status="pending",
    #             )
    #             db.session.add(game)
    #             db.session.flush()

    #             tournament_game = TournamentGame(
    #                 tournament_id=tournament.id,
    #                 game_id=game.id,
    #                 round_number=1,
    #                 match_number=i // 2 + 1,
    #             )
    #             db.session.add(tournament_game)
    #             db.session.flush()

    #             bracket = TournamentBracket(
    #                 tournament_round_id=round.id,
    #                 tournament_game_id=tournament_game.id,
    #                 bracket_type="winners",
    #                 position=i // 2 + 1,
    #             )
    #             db.session.add(bracket)
    #         else:
    #             # Bye round
    #             players[i].status = "advanced"

    # def _create_double_elimination_brackets(
    #     self, tournament: Tournament, players: List[TournamentPlayer]
    # ):
    #     """Create double elimination tournament brackets."""
    #     # Similar to single elimination but with losers bracket
    #     self._create_single_elimination_brackets(tournament, players)

    #     # Create initial losers round
    #     round = TournamentRound(
    #         tournament_id=tournament.id, round_number=1, round_type="losers", status="pending"
    #     )
    #     db.session.add(round)

    # def _create_round_robin_matches(self, tournament: Tournament, players: List[TournamentPlayer]):
    #     """Create round robin tournament matches."""
    #     # Create matches for each player pair
    #     match_number = 1
    #     for i, player1 in enumerate(players):
    #         for player2 in players[i + 1 :]:
    #             game = Game(
    #                 player1_id=player1.player_id,
    #                 player2_id=player2.player_id,
    #                 game_type="tournament",
    #                 status="pending",
    #             )
    #             db.session.add(game)
    #             db.session.flush()

    #             tournament_game = TournamentGame(
    #                 tournament_id=tournament.id,
    #                 game_id=game.id,
    #                 round_number=1,
    #                 match_number=match_number,
    #             )
    #             db.session.add(tournament_game)
    #             match_number += 1

    def complete_match(self, tournament_id: int, game_id: int, winner_id: int, score: str):
        """
        Complete a tournament match.

        Args:
            tournament_id: Tournament ID
            game_id: Game ID
            winner_id: Winner player ID
            score: Game score
        """
        tournament = Tournament.query.get_or_404(tournament_id)
        game = Game.query.get_or_404(game_id)

        # Update game
        game.status = "completed"
        game.winner_id = winner_id
        game.score = score
        game.completed_at = datetime.utcnow()

        # Update tournament players
        # if tournament.format in ["single_elimination", "double_elimination"]:
        #     loser_id = game.player1_id if winner_id == game.player2_id else game.player2_id

        #     winner = TournamentPlayer.query.filter_by(
        #         tournament_id=tournament_id, player_id=winner_id
        #     ).first()
        #     winner.status = "advanced"

        #     loser = TournamentPlayer.query.filter_by(
        #         tournament_id=tournament_id, player_id=loser_id
        #     ).first()

        #     if tournament.format == "single_elimination":
        #         loser.status = "eliminated"
        #     else:
        #         loser.status = "losers_bracket"

        db.session.commit()

        # Check if tournament is complete
        # self._check_tournament_completion(tournament)

    # def _check_tournament_completion(self, tournament: Tournament):
    #     """Check if tournament is complete and update status."""
    #     incomplete_games = (
    #         TournamentGame.query.filter_by(tournament_id=tournament.id)
    #         .join(Game)
    #         .filter(Game.status != "completed")
    #         .count()
    #     )

    #     if incomplete_games == 0:
    #         tournament.status = "completed"
    #         tournament.end_date = datetime.utcnow()
    #         db.session.commit()

    def get_standings(self, tournament_id: int) -> List[Dict]:
        """
        Get tournament standings.

        Args:
            tournament_id: Tournament ID

        Returns:
            List[Dict]: List of player standings
        """
        tournament = Tournament.query.get_or_404(tournament_id)

        standings = []
        # players = TournamentPlayer.query.filter_by(tournament_id=tournament_id).all()

        # for player in players:
        #     games = (
        #         TournamentGame.query.filter_by(tournament_id=tournament_id)
        #         .join(Game)
        #         .filter(
        #             (Game.player1_id == player.player_id) | (Game.player2_id == player.player_id)
        #         )
        #         .all()
        #     )

        #     wins = 0
        #     losses = 0
        #     points_for = 0
        #     points_against = 0

        #     for game in games:
        #         if game.game.status == "completed":
        #             score_parts = game.game.score.split("-")
        #             if game.game.player1_id == player.player_id:
        #                 points_for += int(score_parts[0])
        #                 points_against += int(score_parts[1])
        #                 if game.game.winner_id == player.player_id:
        #                     wins += 1
        #                 else:
        #                     losses += 1
        #             else:
        #                 points_for += int(score_parts[1])
        #                 points_against += int(score_parts[0])
        #                 if game.game.winner_id == player.player_id:
        #                     wins += 1
        #                 else:
        #                     losses += 1

        #     standings.append(
        #         {
        #             "player_id": player.player_id,
        #             "status": player.status,
        #             "wins": wins,
        #             "losses": losses,
        #             "points_for": points_for,
        #             "points_against": points_against,
        #             "point_differential": points_for - points_against,
        #         }
        #     )

        # # Sort standings
        # if tournament.format == "round_robin":
        #     standings.sort(
        #         key=lambda x: (x["wins"], x["point_differential"], x["points_for"]), reverse=True
        #     )
        # else:
        #     standings.sort(
        #         key=lambda x: (
        #             x["status"] != "active",
        #             -x["wins"],
        #             x["losses"],
        #             -x["point_differential"],
        #         )
        #     )

        return standings
