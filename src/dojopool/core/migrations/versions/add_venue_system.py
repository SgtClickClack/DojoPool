"""add venue system

Revision ID: add_venue_system
Revises: add_avatar_support
Create Date: 2024-01-20 10:00:00.000000

"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

import sqlalchemy as sa
from alembic import op
from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

# revision identifiers, used by Alembic.
revision: str = "add_venue_system"
down_revision: str = "add_avatar_support"
branch_labels: NoneType = None
depends_on: NoneType = None


def upgrade() -> None:
    # Create venues table
    op.create_table(
        "venues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("address", sa.String(length=200), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=50), nullable=True),
        sa.Column("country", sa.String(length=50), nullable=False),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=100), nullable=True),
        sa.Column("website", sa.String(length=200), nullable=True),
        sa.Column(
            "operating_hours", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("has_parking", sa.Boolean(), default=False),
        sa.Column("is_accessible", sa.Boolean(), default=False),
        sa.Column("has_food_service", sa.Boolean(), default=False),
        sa.Column("has_bar", sa.Boolean(), default=False),
        sa.Column("is_verified", sa.Boolean(), default=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create pool_tables table
    op.create_table(
        "pool_tables",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=False),
        sa.Column("table_number", sa.String(length=20), nullable=False),
        sa.Column("table_type", sa.String(length=50), nullable=True),
        sa.Column("manufacturer", sa.String(length=100), nullable=True),
        sa.Column("model", sa.String(length=100), nullable=True),
        sa.Column("has_ball_return", sa.Boolean(), default=True),
        sa.Column("is_coin_operated", sa.Boolean(), default=True),
        sa.Column("coin_amount", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("needs_maintenance", sa.Boolean(), default=False),
        sa.Column("last_maintenance", sa.DateTime(), nullable=True),
        sa.Column("is_occupied", sa.Boolean(), default=False),
        sa.Column("current_game_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["venue_id"],
            ["venues.id"],
        ),
        sa.ForeignKeyConstraint(
            ["current_game_id"],
            ["games.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create venue_ratings table
    op.create_table(
        "venue_ratings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("review", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.ForeignKeyConstraint(
            ["venue_id"],
            ["venues.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index("idx_venues_location", "venues", ["latitude", "longitude"])
    op.create_index("idx_venues_city", "venues", ["city"])
    op.create_index("idx_pool_tables_venue", "pool_tables", ["venue_id"])
    op.create_index("idx_venue_ratings_venue", "venue_ratings", ["venue_id"])
    op.create_index("idx_venue_ratings_user", "venue_ratings", ["user_id"])


def downgrade():
    # Drop indexes
    op.drop_index("idx_venue_ratings_user")
    op.drop_index("idx_venue_ratings_venue")
    op.drop_index("idx_pool_tables_venue")
    op.drop_index("idx_venues_city")
    op.drop_index("idx_venues_location")

    # Drop tables
    op.drop_table("venue_ratings")
    op.drop_table("pool_tables")
    op.drop_table("venues")
