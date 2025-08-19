from datetime import timedelta
from typing import Dict, Any

GLOBAL_RANKING_CONFIG: Dict[str, Any] = {
    # Ranking update frequency
    "update_frequency": timedelta(hours=6),
    # Minimum games required for ranking
    "min_games_required": 10,
    # Points decay configuration
    "points_decay": {
        "enabled": True,
        "half_life_days": 30,
        "min_points_percentage": 0.25,  # Minimum % of points retained
    },
    # Ranking tiers configuration
    "tiers": [
        {"name": "Pool God", "min_rating": 2400, "color": "#FFD700"},
        {"name": "Divine", "min_rating": 2200, "color": "#FF69B4"},
        {"name": "Mythic", "min_rating": 2000, "color": "#9400D3"},
        {"name": "Legend", "min_rating": 1800, "color": "#4B0082"},
        {"name": "Grandmaster", "min_rating": 1600, "color": "#FF4500"},
        {"name": "Master", "min_rating": 1400, "color": "#1E90FF"},
        {"name": "Expert", "min_rating": 1200, "color": "#32CD32"},
        {"name": "Advanced", "min_rating": 1000, "color": "#FFD700"},
        {"name": "Intermediate", "min_rating": 800, "color": "#C0C0C0"},
        {"name": "Amateur", "min_rating": 600, "color": "#CD853F"},
        {"name": "Novice", "min_rating": 0, "color": "#8B4513"},
    ],
    # Ranking factors weights
    "ranking_weights": {
        "win_rate": 0.4,
        "tournament_performance": 0.3,
        "opponent_strength": 0.2,
        "activity_level": 0.1,
    },
    # Activity requirements
    "activity_requirements": {
        "days_inactive_warning": 14,
        "days_inactive_penalty": 30,
        "inactivity_penalty_per_day": 2,
    },
}
