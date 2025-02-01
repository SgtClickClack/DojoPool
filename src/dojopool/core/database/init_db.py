"""Database initialization module.

This module provides functions to initialize the database with default data.
"""

from werkzeug.security import generate_password_hash

from src.core.database import db
from src.core.models import GameMode, GameType, PricingPlan, RewardTier, Role, User, UserRole


def create_default_roles():
    """Create default roles."""
    roles = [
        {
            "name": "admin",
            "description": "Administrator role with full access",
            "permissions": ["admin", "manage_users", "manage_venues", "manage_tournaments"],
        },
        {
            "name": "moderator",
            "description": "Moderator role with limited management access",
            "permissions": ["manage_venues", "manage_tournaments"],
        },
        {
            "name": "player",
            "description": "Regular player role",
            "permissions": ["play_games", "join_tournaments"],
        },
    ]

    for role_data in roles:
        role = Role.query.filter_by(name=role_data["name"]).first()
        if not role:
            role = Role(**role_data)
            db.session.add(role)

    db.session.commit()


def create_admin_user():
    """Create default admin user."""
    admin_role = Role.query.filter_by(name="admin").first()
    if not admin_role:
        return

    admin = User.query.filter_by(username="admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@dojopool.com",
            password_hash=generate_password_hash("admin"),  # Change in production
            first_name="Admin",
            last_name="User",
            is_active=True,
            is_verified=True,
        )
        db.session.add(admin)
        db.session.commit()

        user_role = UserRole(user_id=admin.id, role_id=admin_role.id, is_active=True)
        db.session.add(user_role)
        db.session.commit()


def create_game_types():
    """Create default game types."""
    game_types = [
        {
            "name": "8-ball",
            "description": "Classic 8-ball pool game",
            "rules": "8-ball is played with a cue ball and 15 object balls...",
        },
        {
            "name": "9-ball",
            "description": "Fast-paced 9-ball pool game",
            "rules": "9-ball is played with a cue ball and 9 object balls...",
        },
        {
            "name": "straight-pool",
            "description": "Traditional straight pool game",
            "rules": "Straight pool is played by calling all shots...",
        },
    ]

    for type_data in game_types:
        game_type = GameType.query.filter_by(name=type_data["name"]).first()
        if not game_type:
            game_type = GameType(**type_data)
            db.session.add(game_type)

    db.session.commit()


def create_game_modes():
    """Create default game modes."""
    game_modes = [
        {"name": "singles", "description": "One-on-one match", "min_players": 2, "max_players": 2},
        {
            "name": "doubles",
            "description": "Two-on-two team match",
            "min_players": 4,
            "max_players": 4,
        },
        {
            "name": "cutthroat",
            "description": "Three-player game",
            "min_players": 3,
            "max_players": 3,
        },
    ]

    for mode_data in game_modes:
        game_mode = GameMode.query.filter_by(name=mode_data["name"]).first()
        if not game_mode:
            game_mode = GameMode(**mode_data)
            db.session.add(game_mode)

    db.session.commit()


def create_reward_tiers():
    """Create default reward tiers."""
    reward_tiers = [
        {
            "name": "Bronze",
            "description": "Entry level rewards",
            "points_required": 0,
            "benefits": ["basic_achievements", "tournament_entry"],
        },
        {
            "name": "Silver",
            "description": "Intermediate rewards",
            "points_required": 1000,
            "benefits": ["premium_achievements", "tournament_priority", "venue_discounts"],
        },
        {
            "name": "Gold",
            "description": "Premium rewards",
            "points_required": 5000,
            "benefits": [
                "exclusive_achievements",
                "tournament_vip",
                "venue_priority",
                "special_events",
            ],
        },
    ]

    for tier_data in reward_tiers:
        reward_tier = RewardTier.query.filter_by(name=tier_data["name"]).first()
        if not reward_tier:
            reward_tier = RewardTier(**tier_data)
            db.session.add(reward_tier)

    db.session.commit()


def create_pricing_plans():
    """Create default pricing plans."""
    pricing_plans = [
        {
            "name": "Basic",
            "description": "Basic membership plan",
            "price": 0.0,
            "billing_interval": "monthly",
            "features": ["play_games", "join_tournaments"],
        },
        {
            "name": "Premium",
            "description": "Premium membership with additional features",
            "price": 9.99,
            "billing_interval": "monthly",
            "features": [
                "play_games",
                "join_tournaments",
                "priority_registration",
                "stats_tracking",
            ],
        },
        {
            "name": "Pro",
            "description": "Professional membership with all features",
            "price": 19.99,
            "billing_interval": "monthly",
            "features": [
                "play_games",
                "join_tournaments",
                "priority_registration",
                "stats_tracking",
                "coaching",
                "video_analysis",
            ],
        },
    ]

    for plan_data in pricing_plans:
        pricing_plan = PricingPlan.query.filter_by(name=plan_data["name"]).first()
        if not pricing_plan:
            pricing_plan = PricingPlan(**plan_data)
            db.session.add(pricing_plan)

    db.session.commit()


def init_db():
    """Initialize database with default data."""
    create_default_roles()
    create_admin_user()
    create_game_types()
    create_game_modes()
    create_reward_tiers()
    create_pricing_plans()
