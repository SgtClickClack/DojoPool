"""add training system

Revision ID: add_training_system
Revises: add_tournament_system
Create Date: 2024-01-20 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "add_training_system"
down_revision = "add_tournament_system"
branch_labels = None
depends_on = None


def upgrade():
    # Create training_programs table
    op.create_table(
        "training_programs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("difficulty", sa.String(length=20), nullable=False),
        sa.Column("duration_weeks", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create exercises table
    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("program_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("target_metrics", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["training_programs.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create user_progress table
    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("program_id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.Integer(), nullable=False),
        sa.Column("completion_date", sa.DateTime(), nullable=True),
        sa.Column("performance_metrics", postgresql.JSONB(), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(
            ["exercise_id"],
            ["exercises.id"],
        ),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["training_programs.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index("ix_training_programs_difficulty", "training_programs", ["difficulty"])
    op.create_index("ix_exercises_program_id", "exercises", ["program_id"])
    op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"])
    op.create_index("ix_user_progress_program_id", "user_progress", ["program_id"])


def downgrade():
    # Drop indexes
    op.drop_index("ix_user_progress_program_id")
    op.drop_index("ix_user_progress_user_id")
    op.drop_index("ix_exercises_program_id")
    op.drop_index("ix_training_programs_difficulty")

    # Drop tables
    op.drop_table("user_progress")
    op.drop_table("exercises")
    op.drop_table("training_programs")
