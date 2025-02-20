"""add tournament system

Revision ID: add_tournament_system
Revises: add_social_features
Create Date: 2024-01-20 15:00:00.000000

"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

import sqlalchemy as sa
from alembic import op
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

# revision identifiers, used by Alembic
revision: str = "add_tournament_system"
down_revision: str = "add_social_features"
branch_labels: NoneType = None
depends_on: NoneType = None


def upgrade() -> None:
    # Create enum types
    op.execute(
        "CREATE TYPE tournament_status AS ENUM ('upcoming', 'registration_open', 'in_progress', 'completed', 'cancelled')"
    )
    op.execute(
        "CREATE TYPE participant_status AS ENUM ('registered', 'checked_in', 'eliminated', 'active', 'winner')"
    )
    op.execute("CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded')")
    op.execute(
        "CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled')"
    )
    op.execute("CREATE TYPE prize_status AS ENUM ('pending', 'distributed', 'claimed')")

    # Create tournaments table
    op.create_table(
        "tournaments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("organizer_id", sa.Integer(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column("registration_deadline", sa.DateTime(), nullable=False),
        sa.Column("max_participants", sa.Integer(), nullable=False),
        sa.Column("entry_fee", sa.Float(), nullable=False),
        sa.Column("total_prize_pool", sa.Float(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "upcoming",
                "registration_open",
                "in_progress",
                "completed",
                "cancelled",
                name="tournament_status",
            ),
            nullable=False,
        ),
        sa.Column("rules", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organizer_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["venue_id"],
            ["venues.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create tournament_participants table
    op.create_table(
        "tournament_participants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tournament_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("registration_date", sa.DateTime(), nullable=False),
        sa.Column("seed", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "registered",
                "checked_in",
                "eliminated",
                "active",
                "winner",
                name="participant_status",
            ),
            nullable=False,
        ),
        sa.Column(
            "payment_status",
            sa.Enum("pending", "paid", "refunded", name="payment_status"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["tournament_id"],
            ["tournaments.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create tournament_brackets table
    op.create_table(
        "tournament_brackets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tournament_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["tournament_id"],
            ["tournaments.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create tournament_matches table
    op.create_table(
        "tournament_matches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bracket_id", sa.Integer(), nullable=False),
        sa.Column("table_number", sa.Integer(), nullable=True),
        sa.Column("scheduled_time", sa.DateTime(), nullable=True),
        sa.Column("actual_start_time", sa.DateTime(), nullable=True),
        sa.Column("actual_end_time", sa.DateTime(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "scheduled",
                "in_progress",
                "completed",
                "cancelled",
                name="match_status",
            ),
            nullable=False,
        ),
        sa.Column("winner_id", sa.Integer(), nullable=True),
        sa.Column("score", sa.String(length=50), nullable=True),
        sa.Column("next_match_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["bracket_id"],
            ["tournament_brackets.id"],
        ),
        sa.ForeignKeyConstraint(
            ["next_match_id"],
            ["tournament_matches.id"],
        ),
        sa.ForeignKeyConstraint(
            ["winner_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create tournament_match_players table
    op.create_table(
        "tournament_match_players",
        sa.Column("match_id", sa.Integer(), nullable=False),
        sa.Column("participant_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["match_id"],
            ["tournament_matches.id"],
        ),
        sa.ForeignKeyConstraint(
            ["participant_id"],
            ["tournament_participants.id"],
        ),
        sa.PrimaryKeyConstraint("match_id", "participant_id"),
    )

    # Create tournament_prizes table
    op.create_table(
        "tournament_prizes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tournament_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("prize_amount", sa.Float(), nullable=False),
        sa.Column("prize_description", sa.Text(), nullable=True),
        sa.Column("winner_id", sa.Integer(), nullable=True),
        sa.Column(
            "distribution_status",
            sa.Enum("pending", "distributed", "claimed", name="prize_status"),
            nullable=False,
        ),
        sa.Column("distributed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["tournament_id"],
            ["tournaments.id"],
        ),
        sa.ForeignKeyConstraint(
            ["winner_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("tournament_prizes")
    op.drop_table("tournament_match_players")
    op.drop_table("tournament_matches")
    op.drop_table("tournament_brackets")
    op.drop_table("tournament_participants")
    op.drop_table("tournaments")

    op.execute("DROP TYPE prize_status")
    op.execute("DROP TYPE match_status")
    op.execute("DROP TYPE payment_status")
    op.execute("DROP TYPE participant_status")
    op.execute("DROP TYPE tournament_status")
