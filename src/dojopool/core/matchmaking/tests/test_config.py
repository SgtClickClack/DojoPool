"""Test configuration and data for matchmaking tests."""

from datetime import datetime, timedelta

# Test user configurations
TEST_USERS = {
    'user1': {
        'id': 1,
        'rating': 1500,
        'play_style': 'aggressive',
        'friends': [3, 4, 5],
        'preferred_venues': [1, 2, 3],
        'subscription_type': 'standard',
        'location': (40.7128, -74.0060)  # NYC coordinates
    },
    'user2': {
        'id': 2,
        'rating': 1600,
        'play_style': 'defensive',
        'friends': [4, 6, 7],
        'preferred_venues': [2, 3, 4],
        'subscription_type': 'premium',
        'location': (40.7614, -73.9776)  # Manhattan coordinates
    }
}

# Test venue configurations
TEST_VENUES = {
    'venue1': {
        'id': 1,
        'name': 'Downtown Pool Hall',
        'location': (40.7128, -74.0060),
        'tables': 10,
        'rating': 4.5
    },
    'venue2': {
        'id': 2,
        'name': 'Uptown Billiards',
        'location': (40.7614, -73.9776),
        'tables': 8,
        'rating': 4.8
    }
}

# Test matchmaking preferences
TEST_PREFERENCES = {
    'pref1': {
        'game_type': 'eight_ball',
        'available_times': [
            datetime.now() + timedelta(hours=1),
            datetime.now() + timedelta(hours=2)
        ],
        'venue_preference': [1, 2],
        'skill_range': (1000, 2000)
    },
    'pref2': {
        'game_type': 'nine_ball',
        'available_times': [
            datetime.now() + timedelta(hours=2),
            datetime.now() + timedelta(hours=3)
        ],
        'venue_preference': [2, 3],
        'skill_range': (1500, 2500)
    }
}

# Test schedule configurations
TEST_SCHEDULES = {
    'schedule1': [
        {
            'start_time': datetime.now() + timedelta(hours=1),
            'end_time': datetime.now() + timedelta(hours=2),
            'type': 'game'
        },
        {
            'start_time': datetime.now() + timedelta(hours=4),
            'end_time': datetime.now() + timedelta(hours=5),
            'type': 'practice'
        }
    ],
    'schedule2': [
        {
            'start_time': datetime.now() + timedelta(hours=2),
            'end_time': datetime.now() + timedelta(hours=3),
            'type': 'game'
        },
        {
            'start_time': datetime.now() + timedelta(hours=5),
            'end_time': datetime.now() + timedelta(hours=6),
            'type': 'tournament'
        }
    ]
}

# Test distance configurations
TEST_DISTANCES = {
    'nearby': 5.0,  # 5km
    'medium': 10.0,  # 10km
    'far': 20.0  # 20km
}

# Test compatibility configurations
TEST_COMPATIBILITY = {
    'min_score': 0.6,
    'perfect_score': 1.0,
    'weights': {
        'skill_level': 0.3,
        'play_style': 0.2,
        'availability': 0.2,
        'location': 0.2,
        'social_factors': 0.1
    }
}

# Test queue configurations
TEST_QUEUE = {
    'max_size': 100,
    'batch_size': 10,
    'update_interval': 30,  # seconds
    'priority_levels': {
        'standard': 1,
        'premium': 2,
        'vip': 3
    }
}

# Test rate limit configurations
TEST_RATE_LIMITS = {
    'window': 300,  # 5 minutes
    'max_attempts': 3,
    'retry_after': 60  # 1 minute
}

# Test error messages
TEST_ERROR_MESSAGES = {
    'queue_full': "Cannot add player to queue: Queue is at maximum capacity",
    'player_not_found': "Cannot find player in the matchmaking queue",
    'invalid_preferences': "Invalid matchmaking preferences provided",
    'matchmaking_timeout': "Matchmaking process timed out, please try again later",
    'incompatible_players': "Players have incompatible preferences or requirements",
    'venue_unavailable': "No venues available that match both players' preferences"
}
