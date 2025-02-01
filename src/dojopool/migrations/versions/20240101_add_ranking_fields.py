"""Add ranking fields to User model

Revision ID: 20240101_add_ranking_fields
Revises: previous_revision
Create Date: 2024-01-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20240101_add_ranking_fields"
down_revision = "previous_revision"  # Update this to your previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Add new ranking fields to users table
    op.add_column("users", sa.Column("rank_tier_color", sa.String(), nullable=True))
    op.add_column(
        "users", sa.Column("rank_movement", sa.Integer(), nullable=False, server_default="0")
    )
    op.add_column(
        "users", sa.Column("rank_streak", sa.Integer(), nullable=False, server_default="0")
    )
    op.add_column("users", sa.Column("rank_streak_type", sa.String(), nullable=True))
    op.add_column(
        "users", sa.Column("total_games", sa.Integer(), nullable=False, server_default="0")
    )
    op.add_column("users", sa.Column("games_won", sa.Integer(), nullable=False, server_default="0"))
    op.add_column(
        "users", sa.Column("tournament_wins", sa.Integer(), nullable=False, server_default="0")
    )
    op.add_column("users", sa.Column("tournament_placements", postgresql.JSONB(), nullable=True))
    op.add_column("users", sa.Column("ranking_history", postgresql.JSONB(), nullable=True))


def downgrade():
    # Remove ranking fields from users table
    op.drop_column("users", "ranking_history")
    op.drop_column("users", "tournament_placements")
    op.drop_column("users", "tournament_wins")
    op.drop_column("users", "games_won")
    op.drop_column("users", "total_games")
    op.drop_column("users", "rank_streak_type")
    op.drop_column("users", "rank_streak")
    op.drop_column("users", "rank_movement")
