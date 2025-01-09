from typing import Dict, List, Optional, Tuple
from src.extensions import cache
from src.utils.adaptive_difficulty import AdaptiveDifficulty
from datetime import datetime, timedelta
import numpy as np

class MatchmakingSystem:
    """Matchmaking system for finding suitable opponents"""
    
    def __init__(self):
        self.adaptive_difficulty = AdaptiveDifficulty()
        self.max_skill_gap = 0.3  # Maximum allowed skill difference
        self.max_wait_time = 300  # Maximum wait time in seconds
        self.location_weight = 0.3  # Weight for location-based matching
        self.skill_weight = 0.7  # Weight for skill-based matching
    
    def find_match(self, player_id: int, venue_id: Optional[int] = None) -> Optional[Dict]:
        """
        Find a suitable match for a player
        :param player_id: Player ID
        :param venue_id: Optional venue ID for location-based matching
        :return: Match details if found, None otherwise
        """
        # Get player's difficulty settings
        settings = self.adaptive_difficulty.adjust_difficulty(player_id)
        skill_range = settings['opponent_skill_range']
        
        # Get active players in skill range
        active_players = self._get_active_players(
            player_id,
            skill_range['min'],
            skill_range['max'],
            venue_id
        )
        
        if not active_players:
            return None
        
        # Find best match
        best_match = self._find_best_match(
            player_id,
            settings['skill_score'],
            active_players,
            venue_id
        )
        
        if best_match:
            return self._create_match(player_id, best_match, settings)
        
        return None
    
    def _get_active_players(
        self,
        player_id: int,
        min_skill: float,
        max_skill: float,
        venue_id: Optional[int]
    ) -> List[Dict]:
        """Get active players within skill range"""
        from src.models.player import Player
        from src.models.player_status import PlayerStatus
        
        # Get players who are active and looking for a match
        query = Player.query.join(PlayerStatus).filter(
            Player.id != player_id,
            PlayerStatus.status == 'looking_for_match',
            PlayerStatus.last_active >= datetime.utcnow() - timedelta(minutes=5)
        )
        
        # Filter by venue if specified
        if venue_id:
            query = query.filter(PlayerStatus.venue_id == venue_id)
        
        # Get players and their skill scores
        players = []
        for player in query.all():
            skill_score = self.adaptive_difficulty._get_cached_skill(player.id)
            if skill_score is None:
                # Calculate skill score if not cached
                recent_games = self.adaptive_difficulty._get_recent_games(player.id)
                skill_score = self.adaptive_difficulty.calculate_player_skill(
                    player.id,
                    recent_games
                )
                self.adaptive_difficulty._cache_skill(player.id, skill_score)
            
            if min_skill <= skill_score <= max_skill:
                players.append({
                    'id': player.id,
                    'skill_score': skill_score,
                    'venue_id': player.current_status.venue_id,
                    'wait_time': (datetime.utcnow() - player.current_status.looking_since).total_seconds()
                })
        
        return players
    
    def _find_best_match(
        self,
        player_id: int,
        player_skill: float,
        candidates: List[Dict],
        venue_id: Optional[int]
    ) -> Optional[Dict]:
        """Find the best match among candidates"""
        if not candidates:
            return None
        
        best_match = None
        best_score = float('-inf')
        
        for candidate in candidates:
            # Calculate match score based on multiple factors
            skill_diff = abs(player_skill - candidate['skill_score'])
            skill_score = 1.0 - (skill_diff / self.max_skill_gap)
            
            # Location score
            location_score = 1.0 if venue_id and candidate['venue_id'] == venue_id else 0.0
            
            # Wait time score (prioritize players waiting longer)
            wait_score = min(candidate['wait_time'] / self.max_wait_time, 1.0)
            
            # Combined score with weights
            score = (
                skill_score * self.skill_weight +
                location_score * self.location_weight +
                wait_score * 0.1  # Small weight for wait time
            )
            
            if score > best_score:
                best_score = score
                best_match = candidate
        
        return best_match
    
    def _create_match(self, player_id: int, opponent: Dict, settings: Dict) -> Dict:
        """Create a match with the selected opponent"""
        from src.models.game import Game
        from src.models.player_status import PlayerStatus
        
        # Create new game
        game = Game(
            player1_id=player_id,
            player2_id=opponent['id'],
            venue_id=opponent['venue_id'],
            status='pending',
            rules=settings['game_rules'],
            challenges=settings['challenges'],
            rewards=settings['rewards']
        )
        
        # Update player statuses
        PlayerStatus.query.filter(
            PlayerStatus.player_id.in_([player_id, opponent['id']])
        ).update({
            'status': 'in_game',
            'game_id': game.id
        }, synchronize_session=False)
        
        # Commit changes
        from src.extensions import db
        db.session.add(game)
        db.session.commit()
        
        return {
            'game_id': game.id,
            'opponent_id': opponent['id'],
            'venue_id': opponent['venue_id'],
            'settings': settings
        }
    
    def cancel_matchmaking(self, player_id: int):
        """Cancel matchmaking for a player"""
        from src.models.player_status import PlayerStatus
        
        PlayerStatus.query.filter_by(player_id=player_id).update({
            'status': 'online',
            'looking_since': None
        })
        
        from src.extensions import db
        db.session.commit()
    
    def start_matchmaking(self, player_id: int, venue_id: Optional[int] = None):
        """Start matchmaking for a player"""
        from src.models.player_status import PlayerStatus
        
        PlayerStatus.query.filter_by(player_id=player_id).update({
            'status': 'looking_for_match',
            'looking_since': datetime.utcnow(),
            'venue_id': venue_id
        })
        
        from src.extensions import db
        db.session.commit()
