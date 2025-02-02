"""
Legacy Leaderboard Module

This module has been refactored to improve type safety, add asynchronous updates,
and enhance overall code quality and robustness. New improvements include logging,
error handling, dynamic score updates, and automatic sorting of leaderboard entries.
"""

import asyncio
import logging
from typing import Any, Dict, List

# Configure logging for this module
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
if not logger.hasHandlers():
    logger.addHandler(handler)

class LegacyLeaderboard:
    def __init__(self) -> None:
        """
        Initializes an empty leaderboard.
        """
        self.leaderboard: List[Dict[str, Any]] = []
        logger.debug("Initialized empty leaderboard.")

    async def update_leaderboard(self) -> None:
        """
        Asynchronously updates the leaderboard.
        Simulates an update using an asynchronous delay, then sorts the leaderboard.
        """
        try:
            logger.debug("Starting leaderboard update...")
            await asyncio.sleep(0.1)
            # Simulate fetching updated leaderboard data
            fetched_data: List[Dict[str, Any]] = [
                {"player": "Alice", "score": 100},
                {"player": "Bob", "score": 85},
                {"player": "Charlie", "score": 75},
            ]
            self.leaderboard = fetched_data
            self.leaderboard.sort(key=lambda entry: entry.get("score", 0), reverse=True)
            logger.info("Leaderboard updated and sorted successfully.")
        except Exception as e:
            logger.error("Failed to update leaderboard: %s", e)
            raise

    def get_leaderboard(self, count: int) -> List[Dict[str, Any]]:
        """
        Returns the top 'count' entries from the leaderboard, sorted by score in descending order.

        Args:
            count (int): The number of top leaderboard entries to return.

        Returns:
            List[Dict[str, Any]]: A list of the top leaderboard entries.
        """
        try:
            count = int(count)
            top_entries = self.leaderboard[:count]
            logger.debug("Retrieving top %d entries from leaderboard.", count)
            return top_entries
        except Exception as e:
            logger.error("Error retrieving leaderboard slice: %s", e)
            raise

    def add_score(self, player: str, score: int) -> None:
        """
        Adds or updates a player's score in the leaderboard. If the player already exists,
        their score is updated; otherwise, a new entry is added. The leaderboard is then sorted.

        Args:
            player (str): The player's name.
            score (int): The player's score.
        """
        try:
            logger.debug("Adding or updating score for player '%s' with score %d.", player, score)
            # Update existing entry if found
            found = False
            for entry in self.leaderboard:
                if entry.get("player") == player:
                    entry["score"] = score
                    found = True
                    break
            if not found:
                self.leaderboard.append({"player": player, "score": score})
            self.leaderboard.sort(key=lambda entry: entry.get("score", 0), reverse=True)
            logger.info("Leaderboard updated with score for player '%s'.", player)
        except Exception as e:
            logger.error("Error adding/updating score for player '%s': %s", player, e)
            raise

    def reset_leaderboard(self) -> None:
        """
        Resets the leaderboard to an empty list.
        """
        try:
            logger.debug("Resetting leaderboard...")
            self.leaderboard = []
            logger.info("Leaderboard reset successfully.")
        except Exception as e:
            logger.error("Error resetting leaderboard: %s", e)
            raise

if __name__ == "__main__":
    async def main() -> None:
        leaderboard = LegacyLeaderboard()

        # Update leaderboard asynchronously
        await leaderboard.update_leaderboard()
        print("Initial Leaderboard:", leaderboard.get_leaderboard(3))

        # Add a new score and update
        leaderboard.add_score("Diana", 95)
        print("After Adding Diana:", leaderboard.get_leaderboard(4))

        # Reset leaderboard
        leaderboard.reset_leaderboard()
        print("After Reset:", leaderboard.get_leaderboard(3))

    asyncio.run(main())
