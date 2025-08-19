"""add avatar support

Revision ID: add_avatar_support
Revises: initial_migration
Create Date: 2024-01-20 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic
revision = "add_avatar_support"
down_revision = "initial_migration"
branch_labels = None
depends_on = None


def upgrade():
    # Add avatar column to users table
    op.add_column("users", sa.Column("avatar", sa.LargeBinary(), nullable=True))

    # Add is_admin column to users table
    op.add_column(
        "users", sa.Column("is_admin", sa.Boolean(), server_default="false", nullable=False)
    )

    # Add camera_config and table_calibration columns to venues table
    op.add_column("venues", sa.Column("camera_config", sa.JSON(), nullable=True))
    op.add_column("venues", sa.Column("table_calibration", sa.JSON(), nullable=True))


def downgrade():
    # Remove added columns
    op.drop_column("users", "avatar")
    op.drop_column("users", "is_admin")
    op.drop_column("venues", "camera_config")
    op.drop_column("venues", "table_calibration")
