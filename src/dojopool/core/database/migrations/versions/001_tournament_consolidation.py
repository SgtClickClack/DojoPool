"""Tournament consolidation migration.

This migration updates the tournament tables schema to match the new consolidated model.
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic
revision = "tournament_consolidation_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to tournaments table
    op.add_column("tournaments", sa.Column("organizer_id", sa.Integer(), nullable=True))
    op.add_column("tournaments", sa.Column("check_in_start", sa.DateTime(), nullable=True))
    op.add_column("tournaments", sa.Column("check_in_end", sa.DateTime(), nullable=True))
    op.add_column("tournaments", sa.Column("max_participants", sa.Integer(), nullable=True))
    op.add_column("tournaments", sa.Column("min_participants", sa.Integer(), nullable=True))
    op.add_column("tournaments", sa.Column("total_prize_pool", sa.Float(), nullable=True))
    op.add_column("tournaments", sa.Column("scoring_type", sa.String(50), nullable=True))
    op.add_column("tournaments", sa.Column("match_format", sa.String(50), nullable=True))
    op.add_column("tournaments", sa.Column("seeding_method", sa.String(50), nullable=True))
    op.add_column("tournaments", sa.Column("visibility", sa.String(20), nullable=True))
    op.add_column("tournaments", sa.Column("featured", sa.Boolean(), nullable=True))
    op.add_column("tournaments", sa.Column("created_at", sa.DateTime(), nullable=True))
    op.add_column("tournaments", sa.Column("updated_at", sa.DateTime(), nullable=True))

    # Create tournament_brackets table
    op.create_table(
        "tournament_brackets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tournament_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create tournament_match_players table
    op.create_table(
        "tournament_match_players",
        sa.Column("match_id", sa.Integer(), nullable=False),
        sa.Column("participant_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer()),
        sa.Column("notes", sa.Text()),
        sa.ForeignKeyConstraint(["match_id"], ["tournament_matches.id"]),
        sa.ForeignKeyConstraint(["participant_id"], ["tournament_participants.id"]),
        sa.PrimaryKeyConstraint("match_id", "participant_id"),
    )

    # Update tournaments table with data migration
    op.execute(
        """
        UPDATE tournaments
        SET
            max_participants = max_players,
            min_participants = min_players,
            total_prize_pool = prize_pool,
            created_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP,
            visibility = 'public',
            featured = false
    """
    )

    # Update tournament_matches table
    op.add_column("tournament_matches", sa.Column("bracket_id", sa.Integer(), nullable=True))
    op.add_column("tournament_matches", sa.Column("table_number", sa.Integer()))
    op.add_column("tournament_matches", sa.Column("scheduled_time", sa.DateTime()))
    op.add_column("tournament_matches", sa.Column("actual_start_time", sa.DateTime()))
    op.add_column("tournament_matches", sa.Column("actual_end_time", sa.DateTime()))
    op.add_column("tournament_matches", sa.Column("next_match_id", sa.Integer()))

    # Create foreign key for bracket_id
    op.create_foreign_key(
        "fk_matches_bracket", "tournament_matches", "tournament_brackets", ["bracket_id"], ["id"]
    )

    # Create foreign key for next_match_id
    op.create_foreign_key(
        "fk_matches_next_match",
        "tournament_matches",
        "tournament_matches",
        ["next_match_id"],
        ["id"],
    )

    # Update tournament_prizes table
    op.add_column(
        "tournament_prizes", sa.Column("distribution_status", sa.String(20), nullable=True)
    )
    op.add_column("tournament_prizes", sa.Column("distributed_at", sa.DateTime()))

    # Set default values for new columns
    op.execute(
        """
        UPDATE tournament_prizes
        SET distribution_status =
            CASE
                WHEN winner_id IS NOT NULL THEN 'distributed'
                ELSE 'pending'
            END,
            distributed_at = awarded_at
    """
    )


def downgrade():
    # Remove new columns from tournaments table
    op.drop_column("tournaments", "organizer_id")
    op.drop_column("tournaments", "check_in_start")
    op.drop_column("tournaments", "check_in_end")
    op.drop_column("tournaments", "max_participants")
    op.drop_column("tournaments", "min_participants")
    op.drop_column("tournaments", "total_prize_pool")
    op.drop_column("tournaments", "scoring_type")
    op.drop_column("tournaments", "match_format")
    op.drop_column("tournaments", "seeding_method")
    op.drop_column("tournaments", "visibility")
    op.drop_column("tournaments", "featured")
    op.drop_column("tournaments", "created_at")
    op.drop_column("tournaments", "updated_at")

    # Drop tournament_brackets table
    op.drop_table("tournament_brackets")

    # Drop tournament_match_players table
    op.drop_table("tournament_match_players")

    # Remove new columns from tournament_matches table
    op.drop_constraint("fk_matches_next_match", "tournament_matches", type_="foreignkey")
    op.drop_constraint("fk_matches_bracket", "tournament_matches", type_="foreignkey")
    op.drop_column("tournament_matches", "bracket_id")
    op.drop_column("tournament_matches", "table_number")
    op.drop_column("tournament_matches", "scheduled_time")
    op.drop_column("tournament_matches", "actual_start_time")
    op.drop_column("tournament_matches", "actual_end_time")
    op.drop_column("tournament_matches", "next_match_id")

    # Remove new columns from tournament_prizes table
    op.drop_column("tournament_prizes", "distribution_status")
    op.drop_column("tournament_prizes", "distributed_at")
