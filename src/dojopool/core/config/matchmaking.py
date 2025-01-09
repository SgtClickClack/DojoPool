"""Matchmaking configuration module.

This module defines all configuration settings and constants used by the matchmaker.
"""

# Matchmaking weights for different factors
MATCHMAKING_WEIGHTS = {
    'skill_level': 0.3,
    'play_style': 0.2,
    'availability': 0.2,
    'location': 0.2,
    'social_factors': 0.1
}

# Skill level configurations
SKILL_LEVELS = {
    'beginner': {
        'range': (0, 1000),
        'max_diff': 200,
        'description': 'New to the game'
    },
    'intermediate': {
        'range': (1001, 2000),
        'max_diff': 300,
        'description': 'Comfortable with basic shots and rules'
    },
    'advanced': {
        'range': (2001, 3000),
        'max_diff': 400,
        'description': 'Strong understanding of strategy'
    },
    'expert': {
        'range': (3001, 4000),
        'max_diff': 500,
        'description': 'Mastery of advanced techniques'
    }
}

# Play style configurations
PLAY_STYLES = {
    'aggressive': {
        'description': 'Prefers high-risk, high-reward shots',
        'compatibility': {
            'aggressive': 0.8,
            'defensive': 0.6,
            'balanced': 0.9,
            'strategic': 0.7
        }
    },
    'defensive': {
        'description': 'Focuses on safety plays and position',
        'compatibility': {
            'aggressive': 0.6,
            'defensive': 0.7,
            'balanced': 0.8,
            'strategic': 0.9
        }
    },
    'balanced': {
        'description': 'Adapts style based on situation',
        'compatibility': {
            'aggressive': 0.9,
            'defensive': 0.8,
            'balanced': 0.9,
            'strategic': 0.8
        }
    },
    'strategic': {
        'description': 'Emphasizes planning and control',
        'compatibility': {
            'aggressive': 0.7,
            'defensive': 0.9,
            'balanced': 0.8,
            'strategic': 0.8
        }
    }
}

# Time-related settings
TIME_SETTINGS = {
    'default_game_duration': 60,  # minutes
    'minimum_notice': 15,  # minutes
    'max_schedule_days': 7,  # days ahead
    'rate_limit_window': 300,  # seconds
    'max_attempts': 3,
    'activity_timeout': 1800  # seconds
}

# Location-related settings
LOCATION_SETTINGS = {
    'max_distance': 20.0,  # kilometers
    'preferred_distance': 5.0,  # kilometers
    'minimum_venues': 2,
    'venue_weights': {
        'distance': 0.4,
        'rating': 0.3,
        'availability': 0.3
    }
}

# Social interaction settings
SOCIAL_SETTINGS = {
    'friend_weight': 0.4,
    'mutual_friend_weight': 0.3,
    'previous_match_weight': 0.2,
    'maximum_games': 5,  # max previous games to consider
    'block_duration': 30  # days
}

# Queue management settings
QUEUE_SETTINGS = {
    'max_queue_size': 100,
    'batch_size': 10,
    'update_interval': 30,  # seconds
    'priority_levels': {
        'vip': 3,
        'premium': 2,
        'standard': 1
    },
    'timeout': 600  # seconds
}

# Preference validation settings
PREFERENCES = {
    'required_fields': {
        'game_type',
        'available_times'
    },
    'game_types': {
        'eight_ball': {
            'description': 'Standard 8-ball pool',
            'duration': 45  # minutes
        },
        'nine_ball': {
            'description': '9-ball pool',
            'duration': 30  # minutes
        },
        'straight_pool': {
            'description': 'Continuous pool',
            'duration': 60  # minutes
        }
    },
    'min_time_slots': 1,
    'max_time_slots': 5
}
