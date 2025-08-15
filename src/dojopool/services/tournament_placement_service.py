"""Tournament Placement Service module."""

from enum import Enum
from typing import List, Dict, Optional, Tuple, TYPE_CHECKING

from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from dojopool.models import UserProfile, Tournament, Match, Game # Assuming Match is the SQLAlchemy model
from dojopool.models.enums import TournamentFormat # Assuming TournamentFormat is in enums

# Import necessary models and enums

if TYPE_CHECKING:
    from ..models.tournament import Tournament as TournamentModel # For type hinting Tournament
    from ..models.match import Match as MatchModel # For type hinting Match
    # from ..models.user import User # If User object is needed beyond user_id

class TournamentPlacementService:
    """Service for calculating player placements in tournaments."""

    def get_player_placement(self, tournament: 'TournamentModel', user_id: int) -> Optional[int]:
        """Get player's placement in a tournament."""
        if not tournament or not tournament.is_completed:
            return None

        # Ensure tournament_games and matches are loaded. 
        # Depending on lazy loading, direct access might trigger multiple queries.
        # For a service, it might be better to query explicitly if performance is a concern.
        all_matches: List['MatchModel'] = []
        if tournament.tournament_games:
            for tg in tournament.tournament_games:
                if tg.matches: # Check if matches collection is not None
                    # Assuming tg.matches is iterable (e.g., a list or a query result)
                    all_matches.extend(list(tg.matches)) # Convert to list if it's a dynamic loader

        if not all_matches:
            # Check if participant exists but had no matches (e.g. walkover, or error in match generation)
            participant_exists = any(p.user_id == user_id for p in tournament.participants)
            if participant_exists:
                 # Decide on placement for participant with no matches (e.g., last, or based on registration)
                 # For now, returning None as original logic implies no matches means no placement calculated.
                 return None 
            return None

        # Check if the user actually participated in any recorded matches
        played_in_match = any(m.player1_id == user_id or m.player2_id == user_id for m in all_matches)
        if not played_in_match:
            # Similar to above: participant might exist but not in these specific matches.
            return None

        tournament_format_value = tournament.format.value if isinstance(tournament.format, Enum) else tournament.format

        if tournament_format_value == TournamentFormat.SINGLE_ELIMINATION.value:
            return self._calculate_single_elim_placement(user_id, all_matches)
        elif tournament_format_value == TournamentFormat.DOUBLE_ELIMINATION.value:
            return self._calculate_double_elim_placement(user_id, all_matches)
        elif tournament_format_value == TournamentFormat.ROUND_ROBIN.value:
            return self._calculate_round_robin_placement(user_id, all_matches)
        # Add SWISS or other formats if logic exists

        return None # Default if format is unknown or not handled

    def _calculate_single_elim_placement(self, user_id: int, matches: List['MatchModel']) -> int:
        """Calculate placement in single elimination tournament."""
        if not matches:
            return 0 # Or an appropriate value indicating no matches / error

        elimination_round = 0
        won_tournament = True # Assume winner until a loss is found

        # Find if and where the player was eliminated
        for match in matches:
            if match.loser_id == user_id:
                elimination_round = match.round if match.round is not None else 0
                won_tournament = False
                break
            if match.winner_id == user_id and match.player1_id != user_id and match.player2_id != user_id:
                # This case covers if the user won a match they weren't part of - data integrity issue
                pass # Or log error
        
        if won_tournament:
            # Check if they actually played and won any match, or if it's a tournament with no matches for them
            played_and_won_any_match = any(m.winner_id == user_id for m in matches)
            if played_and_won_any_match or not matches: # If no matches, and they are in, they are 1st by default
                return 1
            else: # Played no matches, so cannot be determined as winner here
                return 0 # Or some other indicator

        if elimination_round == 0: # Lost, but no specific elimination round found (e.g. no rounds on matches)
            return len(set(m.player1_id for m in matches) | set(m.player2_id for m in matches)) # last place among participants

        # Calculate placement based on elimination round
        active_rounds = [m.round for m in matches if m.round is not None and m.round > 0]
        if not active_rounds:
             # If player lost (elimination_round > 0) but no valid rounds in matches, this is ambiguous
             return 2 # Default to second if eliminated but round data is poor
        
        total_rounds = max(active_rounds) if active_rounds else 0

        if elimination_round == total_rounds: 
            return 2 # Eliminated in the final round (runner-up)
        else:
            # Estimate placement: 2^k for losers in round R-k+1
            # e.g. total_rounds = 3. Eliminated in round 1 -> k=1. 2^(3-1) = 4th (approx for 3rd/4th)
            # Eliminated in round 2 -> k=2. 2^(3-2) = 2nd (this means they lost final, should be 2)
            # Let's refine: placement is 2^(total_rounds - elimination_round) + 1, but capped by participant count.
            # A simpler approach: people eliminated in round X share place 2^(N-X+1) to 2^(N-X+1) + (2^(N-X)-1)
            # Winner is 1st. Loser of Final is 2nd. Losers of Semis are 3rd/4th.
            # If eliminated_round = 1, total_rounds = 3 (e.g. 8 players)
            # Losers in round 1 are 5th-8th. Losers in round 2 are 3rd-4th.
            return 2**(total_rounds - elimination_round +1) // 2 +1 # Simplified heuristic

    def _calculate_double_elim_placement(self, user_id: int, matches: List['MatchModel']) -> int:
        """Calculate placement in double elimination. Placeholder - complex logic."""
        # This requires tracking wins/losses in both winner's and loser's brackets.
        # For simplicity, returning a placeholder.
        # TODO: Implement actual double elimination placement logic
        return 0 # Placeholder

    def _calculate_round_robin_placement(self, user_id: int, matches: List['MatchModel']) -> int:
        """Calculate placement in round robin based on wins, then tie-breakers."""
        # This typically involves sorting players by wins, then by head-to-head, then point difference etc.
        # For simplicity, returning a placeholder.
        # TODO: Implement actual round robin placement logic with tie-breaking
        player_scores = {}
        for match in matches:
            p1 = match.player1_id
            p2 = match.player2_id
            winner = match.winner_id

            if p1 not in player_scores: player_scores[p1] = {'wins': 0, 'played': 0}
            if p2 not in player_scores: player_scores[p2] = {'wins': 0, 'played': 0}

            if winner:
                player_scores[winner]['wins'] += 1
            if p1 and p2: # Match was played
                 player_scores[p1]['played'] +=1
                 player_scores[p2]['played'] +=1
        
        # Filter out players who didn't play
        active_players = {pid: data for pid, data in player_scores.items() if data['played'] > 0}
        if not active_players or user_id not in active_players:
            return 0 # User didn't play or no one played

        # Sort by wins (descending)
        sorted_players = sorted(active_players.items(), key=lambda item: item[1]['wins'], reverse=True)
        
        # Find rank of the user
        rank = 0
        current_wins = -1
        for i, (player_id_sorted, data) in enumerate(sorted_players):
            if data['wins'] != current_wins:
                rank = i + 1
                current_wins = data['wins']
            if player_id_sorted == user_id:
                return rank
        return 0 # Should be found if participated

tournament_placement_service = TournamentPlacementService() # Singleton instance 