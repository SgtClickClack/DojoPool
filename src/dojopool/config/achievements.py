"""Achievement configuration module"""

ACHIEVEMENT_TYPES = {
    # Gameplay Achievements
    'first_match': {
        'name': 'First Match',
        'description': 'Complete your first match',
        'category': 'gameplay',
        'points': 10,
        'icon_url': '/static/icons/achievements/first_match.png',
        'requirements': {'matches_played': 1},
        'reward_type': 'points',
        'reward_value': {'points': 10}
    },
    'winning_streak': {
        'name': 'Winning Streak',
        'description': 'Win 5 matches in a row',
        'category': 'gameplay',
        'points': 50,
        'icon_url': '/static/icons/achievements/winning_streak.png',
        'requirements': {'consecutive_wins': 5},
        'reward_type': 'power_up',
        'reward_value': {'power_up_id': 'double_points', 'quantity': 1}
    },
    'master_player': {
        'name': 'Master Player',
        'description': 'Win 100 matches',
        'category': 'gameplay',
        'points': 100,
        'icon_url': '/static/icons/achievements/master_player.png',
        'requirements': {'total_wins': 100},
        'reward_type': 'cosmetic',
        'reward_value': {'avatar_frame_id': 'master_frame'}
    },

    # Tournament Achievements
    'tournament_participant': {
        'name': 'Tournament Participant',
        'description': 'Participate in your first tournament',
        'category': 'tournament',
        'points': 20,
        'icon_url': '/static/icons/achievements/tournament_participant.png',
        'requirements': {'tournaments_participated': 1},
        'reward_type': 'points',
        'reward_value': {'points': 20}
    },
    'tournament_winner': {
        'name': 'Tournament Winner',
        'description': 'Win a tournament',
        'category': 'tournament',
        'points': 100,
        'icon_url': '/static/icons/achievements/tournament_winner.png',
        'requirements': {'tournaments_won': 1},
        'reward_type': 'power_up',
        'reward_value': {'power_up_id': 'tournament_boost', 'quantity': 1}
    },

    # Venue Achievements
    'venue_explorer': {
        'name': 'Venue Explorer',
        'description': 'Check in to 5 different venues',
        'category': 'venue',
        'points': 30,
        'icon_url': '/static/icons/achievements/venue_explorer.png',
        'requirements': {'unique_venues_visited': 5},
        'reward_type': 'points',
        'reward_value': {'points': 30}
    },
    'venue_regular': {
        'name': 'Venue Regular',
        'description': 'Check in to the same venue 10 times',
        'category': 'venue',
        'points': 40,
        'icon_url': '/static/icons/achievements/venue_regular.png',
        'requirements': {'venue_visits': 10},
        'reward_type': 'power_up',
        'reward_value': {'power_up_id': 'venue_boost', 'quantity': 1}
    },

    # Social Achievements
    'social_butterfly': {
        'name': 'Social Butterfly',
        'description': 'Play matches with 10 different players',
        'category': 'social',
        'points': 30,
        'icon_url': '/static/icons/achievements/social_butterfly.png',
        'requirements': {'unique_opponents': 10},
        'reward_type': 'points',
        'reward_value': {'points': 30}
    },
    'friendly_player': {
        'name': 'Friendly Player',
        'description': 'Add 5 friends',
        'category': 'social',
        'points': 20,
        'icon_url': '/static/icons/achievements/friendly_player.png',
        'requirements': {'friends_added': 5},
        'reward_type': 'cosmetic',
        'reward_value': {'avatar_frame_id': 'friendly_frame'}
    },

    # Power-up Achievements
    'power_collector': {
        'name': 'Power Collector',
        'description': 'Collect 10 different power-ups',
        'category': 'power_ups',
        'points': 40,
        'icon_url': '/static/icons/achievements/power_collector.png',
        'requirements': {'unique_power_ups': 10},
        'reward_type': 'power_up',
        'reward_value': {'power_up_id': 'mystery_box', 'quantity': 1}
    },
    'power_master': {
        'name': 'Power Master',
        'description': 'Use power-ups 50 times',
        'category': 'power_ups',
        'points': 50,
        'icon_url': '/static/icons/achievements/power_master.png',
        'requirements': {'power_ups_used': 50},
        'reward_type': 'points',
        'reward_value': {'points': 50}
    }
}

# Achievement Categories
ACHIEVEMENT_CATEGORIES = {
    'gameplay': 'Gameplay Achievements',
    'tournament': 'Tournament Achievements',
    'venue': 'Venue Achievements',
    'social': 'Social Achievements',
    'power_ups': 'Power-up Achievements'
}

# Achievement Points Thresholds
ACHIEVEMENT_LEVELS = {
    'bronze': 100,
    'silver': 500,
    'gold': 1000,
    'platinum': 2000,
    'diamond': 5000
}

# Achievement Reward Types
REWARD_TYPES = {
    'points': 'Points Reward',
    'power_up': 'Power-up Reward',
    'cosmetic': 'Cosmetic Reward'
}

def get_achievement_config(achievement_type: str) -> dict:
    """Get achievement configuration by type"""
    return ACHIEVEMENT_TYPES.get(achievement_type)

def get_achievement_category_name(category: str) -> str:
    """Get achievement category display name"""
    return ACHIEVEMENT_CATEGORIES.get(category, category)

def get_achievement_level(points: int) -> str:
    """Get achievement level based on points"""
    for level, threshold in sorted(ACHIEVEMENT_LEVELS.items(), key=lambda x: x[1], reverse=True):
        if points >= threshold:
            return level
    return 'bronze'

def get_reward_type_name(reward_type: str) -> str:
    """Get reward type display name"""
    return REWARD_TYPES.get(reward_type, reward_type) 