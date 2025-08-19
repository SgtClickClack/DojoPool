from enum import Enum

class TransactionType(Enum):
    """Transaction types."""
    REWARD = "reward"
    TRANSFER = "transfer"
    PURCHASE = "purchase"
    TOURNAMENT_ENTRY = "tournament_entry"
    TOURNAMENT_PRIZE = "tournament_prize"

class RewardType(Enum):
    """Reward types."""
    MATCH_WIN = "match_win"
    TOURNAMENT_WIN = "tournament_win"
    TRICK_SHOT = "trick_shot"
    ACHIEVEMENT = "achievement"
    DAILY_BONUS = "daily_bonus"
    WEEKLY_CHALLENGE = "weekly_challenge"
    CLAN_BONUS = "clan_bonus"
    VENUE_BONUS = "venue_bonus" 