"""
Achievement Integration Service for DojoPool.

This service integrates achievements with game events and provides
methods for checking and awarding achievements based on player actions.
"""

import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from prisma import Prisma
from prisma.models import User, Achievement, PlayerAchievement

from .achievement_service import achievement_service


class AchievementIntegrationService:
    """
    Service for integrating achievements with game events.

    This service handles the automatic checking and awarding of
    achievements when players complete various actions in the game.
    """

    def __init__(self, prisma_client: Prisma):
        """Initialize with Prisma client."""
        self.prisma = prisma_client

    async def check_and_award_achievements(self, player_id: str) -> Dict[str, Any]:
        """
        Check if a player has met criteria for any achievements and award them.

        Args:
            player_id: The ID of the player to check

        Returns:
            Dictionary containing awarded achievements and status
        """
        try:
            # Get all available achievements
            achievements = await self.prisma.achievement.find_many()

            # Get player's current stats
            player_stats = await self._get_player_stats(player_id)

            # Check each achievement
            awarded_achievements = []

            for achievement in achievements:
                if await self._should_award_achievement(player_id, achievement, player_stats):
                    result = await self._award_achievement(player_id, achievement)
                    if result['success']:
                        awarded_achievements.append(result['achievement'])

            return {
                'success': True,
                'awarded_achievements': awarded_achievements,
                'total_awarded': len(awarded_achievements)
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'awarded_achievements': []
            }

    async def _get_player_stats(self, player_id: str) -> Dict[str, Any]:
        """Get comprehensive player statistics for achievement checking."""
        try:
            # Get player's match history
            matches = await self.prisma.tournamentmatch.find_many(
                where={
                    'OR': [
                        {'player1_id': player_id},
                        {'player2_id': player_id}
                    ]
                }
            )

            # Calculate stats
            total_matches = len(matches)
            wins = sum(1 for m in matches if m.winner_id == player_id)
            win_streak = await self._calculate_win_streak(player_id)

            # Get tournament participation
            tournaments = await self.prisma.tournament.find_many(
                where={
                    'participants': {
                        'contains': player_id
                    }
                }
            )

            tournament_wins = sum(1 for t in tournaments if t.winner_id == player_id)

            # Get territory control
            territories = await self.prisma.territory.find_many(
                where={'owner_id': player_id}
            )

            return {
                'total_matches': total_matches,
                'wins': wins,
                'losses': total_matches - wins,
                'win_rate': (wins / total_matches * 100) if total_matches > 0 else 0,
                'win_streak': win_streak,
                'tournaments_entered': len(tournaments),
                'tournaments_won': tournament_wins,
                'territories_controlled': len(territories)
            }

        except Exception as e:
            # Return default stats if there's an error
            return {
                'total_matches': 0,
                'wins': 0,
                'losses': 0,
                'win_rate': 0,
                'win_streak': 0,
                'tournaments_entered': 0,
                'tournaments_won': 0,
                'territories_controlled': 0
            }

    async def _calculate_win_streak(self, player_id: str) -> int:
        """Calculate current win streak for a player."""
        try:
            # Get recent matches ordered by completion date
            recent_matches = await self.prisma.tournamentmatch.find_many(
                where={
                    'OR': [
                        {'player1_id': player_id},
                        {'player2_id': player_id}
                    ]
                },
                order=[('completed_at', 'desc')],
                take=20  # Check last 20 matches
            )

            streak = 0
            for match in recent_matches:
                if match.winner_id == player_id:
                    streak += 1
                else:
                    break  # Streak broken

            return streak

        except Exception:
            return 0

    async def _should_award_achievement(
        self,
        player_id: str,
        achievement: Achievement,
        player_stats: Dict[str, Any]
    ) -> bool:
        """Check if a player should be awarded a specific achievement."""
        try:
            # Check if already awarded
            existing = await self.prisma.playerachievement.find_first(
                where={
                    'player_id': player_id,
                    'achievement_id': achievement.id
                }
            )

            if existing:
                return False  # Already awarded

            # Parse criteria
            criteria = json.loads(achievement.criteria) if achievement.criteria else {}

            # Check each criterion
            for criterion in criteria:
                if not self._check_criterion(criterion, player_stats):
                    return False

            return True

        except Exception:
            return False

    def _check_criterion(self, criterion: Dict[str, Any], player_stats: Dict[str, Any]) -> bool:
        """Check if a single criterion is met."""
        criterion_type = criterion.get('type')
        required_value = criterion.get('value', 0)
        operator = criterion.get('operator', '>=')

        if criterion_type == 'matches_won':
            actual_value = player_stats.get('wins', 0)
        elif criterion_type == 'win_streak':
            actual_value = player_stats.get('win_streak', 0)
        elif criterion_type == 'tournaments_won':
            actual_value = player_stats.get('tournaments_won', 0)
        elif criterion_type == 'territories_controlled':
            actual_value = player_stats.get('territories_controlled', 0)
        else:
            return False

        # Apply operator
        if operator == '>=':
            return actual_value >= required_value
        elif operator == '=':
            return actual_value == required_value
        elif operator == '>':
            return actual_value > required_value
        else:
            return False

    async def _award_achievement(self, player_id: str, achievement: Achievement) -> Dict[str, Any]:
        """Award an achievement to a player."""
        try:
            # Create player achievement record
            player_achievement = await self.prisma.playerachievement.create(
                data={
                    'player_id': player_id,
                    'achievement_id': achievement.id,
                    'date_unlocked': datetime.utcnow(),
                    'progress': 100  # Fully completed
                }
            )

            # Update achievement rarity
            await self._update_achievement_rarity(achievement.id)

            return {
                'success': True,
                'achievement': {
                    'id': achievement.id,
                    'name': achievement.name,
                    'description': achievement.description,
                    'icon': achievement.icon,
                    'points': achievement.points,
                    'category': achievement.category
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    async def _update_achievement_rarity(self, achievement_id: str):
        """Update the rarity percentage for an achievement."""
        try:
            # Count total users
            total_users = await self.prisma.user.count()

            if total_users == 0:
                return

            # Count users with this achievement
            unlocked_count = await self.prisma.playerachievement.count(
                where={'achievement_id': achievement_id}
            )

            # Calculate rarity percentage
            rarity = (unlocked_count / total_users) * 100

            # Update achievement
            await self.prisma.achievement.update(
                where={'id': achievement_id},
                data={'rarity': rarity}
            )

        except Exception:
            # Silently fail if rarity update fails
            pass

    async def check_match_completion_achievements(self, match_data: Dict[str, Any]):
        """
        Check and award achievements after a match completion.

        Args:
            match_data: Dictionary containing match result information
        """
        try:
            winner_id = match_data.get('winner_id')
            if not winner_id:
                return

            # Check achievements for winner
            await self.check_and_award_achievements(winner_id)

            # Check achievements for loser if needed
            loser_id = match_data.get('loser_id')
            if loser_id:
                # Some achievements might be based on participation
                await self.check_and_award_achievements(loser_id)

        except Exception as e:
            # Log error but don't fail the match completion
            print(f"Error checking match completion achievements: {e}")

    async def check_tournament_completion_achievements(self, tournament_data: Dict[str, Any]):
        """
        Check and award achievements after tournament completion.

        Args:
            tournament_data: Dictionary containing tournament result information
        """
        try:
            winner_id = tournament_data.get('winner_id')
            if winner_id:
                await self.check_and_award_achievements(winner_id)

            # Check achievements for all participants
            participants = tournament_data.get('participants', [])
            for participant_id in participants:
                await self.check_and_award_achievements(participant_id)

        except Exception as e:
            print(f"Error checking tournament completion achievements: {e}")


# Create singleton instance
achievement_integration_service = None

def get_achievement_integration_service(prisma_client: Prisma) -> AchievementIntegrationService:
    """Get or create the achievement integration service instance."""
    global achievement_integration_service
    if achievement_integration_service is None:
        achievement_integration_service = AchievementIntegrationService(prisma_client)
    return achievement_integration_service
