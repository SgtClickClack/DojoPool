"""Achievement configuration module.

This module provides configuration settings for achievements.
"""

# Achievement types and their requirements
ACHIEVEMENT_CONFIG = {
    # Game milestones
    "GAMES_PLAYED": {
        "bronze": {"count": 10, "points": 100, "icon": "games_bronze"},
        "silver": {"count": 50, "points": 500, "icon": "games_silver"},
        "gold": {"count": 100, "points": 1000, "icon": "games_gold"},
    },
    "GAMES_WON": {
        "bronze": {"count": 5, "points": 200, "icon": "wins_bronze"},
        "silver": {"count": 25, "points": 1000, "icon": "wins_silver"},
        "gold": {"count": 50, "points": 2000, "icon": "wins_gold"},
    },
    "WIN_STREAK": {
        "bronze": {"count": 3, "points": 300, "icon": "streak_bronze"},
        "silver": {"count": 5, "points": 1500, "icon": "streak_silver"},
        "gold": {"count": 10, "points": 3000, "icon": "streak_gold"},
    },
    # Skill achievements
    "PERFECT_GAME": {
        "points": 5000,
        "icon": "perfect",
        "description": "Win a game without letting your opponent score",
    },
    "COMEBACK_WIN": {
        "points": 1000,
        "icon": "comeback",
        "description": "Win after being behind by a significant margin",
    },
    "QUICK_VICTORY": {"points": 800, "icon": "quick", "description": "Win a game in record time"},
    "TOURNAMENT_WIN": {"points": 2000, "icon": "tournament", "description": "Win a tournament"},
    "LEAGUE_PROMOTION": {
        "points": 1500,
        "icon": "promotion",
        "description": "Get promoted to a higher league",
    },
    # Social achievements
    "FRIENDS_MADE": {
        "bronze": {"count": 5, "points": 100, "icon": "friends_bronze"},
        "silver": {"count": 20, "points": 500, "icon": "friends_silver"},
        "gold": {"count": 50, "points": 1000, "icon": "friends_gold"},
    },
    "VENUES_VISITED": {
        "bronze": {"count": 3, "points": 200, "icon": "venues_bronze"},
        "silver": {"count": 10, "points": 800, "icon": "venues_silver"},
        "gold": {"count": 20, "points": 1500, "icon": "venues_gold"},
    },
}

# Achievement categories
ACHIEVEMENT_CATEGORIES = {
    "MILESTONES": ["GAMES_PLAYED", "GAMES_WON", "WIN_STREAK"],
    "SKILLS": [
        "PERFECT_GAME",
        "COMEBACK_WIN",
        "QUICK_VICTORY",
        "TOURNAMENT_WIN",
        "LEAGUE_PROMOTION",
    ],
    "SOCIAL": ["FRIENDS_MADE", "VENUES_VISITED"],
}

# Achievement tiers
ACHIEVEMENT_TIERS = {
    "bronze": {"name": "Bronze", "color": "#CD7F32", "multiplier": 1.0},
    "silver": {"name": "Silver", "color": "#C0C0C0", "multiplier": 2.0},
    "gold": {"name": "Gold", "color": "#FFD700", "multiplier": 3.0},
}

# Achievement settings
ACHIEVEMENT_SETTINGS = {
    "CACHE_TIMEOUT": 300,  # 5 minutes
    "CHECK_INTERVAL": 60,  # Check achievements every minute
    "NOTIFICATION_DELAY": 3,  # Delay achievement notifications by 3 seconds
    "MAX_DISPLAY": 5,  # Maximum achievements to display at once
    "POINTS_MULTIPLIER": 1.0,  # Global points multiplier
    "STREAK_TIMEOUT": 86400,  # 24 hours before streak breaks
    "MIN_GAME_DURATION": 300,  # 5 minutes minimum for achievements
}

# Achievement levels
ACHIEVEMENT_LEVELS = {
    "NOVICE": {"min_points": 0, "max_points": 1000, "title": "Novice", "color": "#A0A0A0"},
    "INTERMEDIATE": {
        "min_points": 1001,
        "max_points": 5000,
        "title": "Intermediate",
        "color": "#50C878",
    },
    "ADVANCED": {"min_points": 5001, "max_points": 15000, "title": "Advanced", "color": "#4169E1"},
    "EXPERT": {"min_points": 15001, "max_points": 50000, "title": "Expert", "color": "#9932CC"},
    "MASTER": {
        "min_points": 50001,
        "max_points": float("inf"),
        "title": "Master",
        "color": "#FFD700",
    },
}

# Achievement notifications
ACHIEVEMENT_NOTIFICATIONS = {
    "ENABLED": True,
    "SOUND_ENABLED": True,
    "VIBRATION_ENABLED": True,
    "TOAST_DURATION": 5000,  # 5 seconds
    "ANIMATION_DURATION": 2000,  # 2 seconds
    "STACKING": True,
    "POSITION": "top-right",
}

# Achievement rewards
ACHIEVEMENT_REWARDS = {
    "POINT_MILESTONES": {
        1000: {"title": "Bronze Trophy", "icon": "trophy_bronze"},
        5000: {"title": "Silver Trophy", "icon": "trophy_silver"},
        15000: {"title": "Gold Trophy", "icon": "trophy_gold"},
        50000: {"title": "Platinum Trophy", "icon": "trophy_platinum"},
    },
    "SPECIAL_REWARDS": {
        "PERFECT_GAME": {"title": "Perfect Game Badge", "icon": "badge_perfect"},
        "WIN_STREAK_10": {"title": "Streak Master Badge", "icon": "badge_streak"},
        "TOURNAMENT_WIN": {"title": "Tournament Champion Badge", "icon": "badge_tournament"},
    },
}

# Achievement animations
ACHIEVEMENT_ANIMATIONS = {
    "ENABLED": True,
    "TYPE": "fade-slide",  # fade, slide, bounce, etc.
    "DURATION": 1000,  # 1 second
    "EASING": "ease-out",
    "PARTICLE_EFFECTS": True,
    "SOUND_EFFECTS": True,
}

# Achievement sharing
ACHIEVEMENT_SHARING = {
    "ENABLED": True,
    "PLATFORMS": ["facebook", "twitter", "instagram"],
    "AUTO_SHARE": False,
    "SHARE_DELAY": 5,  # 5 seconds
    "CUSTOM_MESSAGES": {
        "PERFECT_GAME": "Just achieved a perfect game in DojoPool! 🎱",
        "TOURNAMENT_WIN": "Won my first tournament in DojoPool! 🏆",
        "MASTER_LEVEL": "Reached Master level in DojoPool! 👑",
    },
}
