"""add sponsorship system

Revision ID: add_sponsorship_system
Revises: add_payment_system
Create Date: 2024-01-20 11:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic
revision = "add_sponsorship_system"
down_revision = "add_payment_system"
branch_labels = None
depends_on = None


def upgrade():
    # Create sponsors table
    op.create_table(
        "sponsors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("contact_phone", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create sponsorship_tiers table
    op.create_table(
        "sponsorship_tiers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("benefits", sa.Text(), nullable=True),
        sa.Column("max_sponsors", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create sponsorship_deals table
    op.create_table(
        "sponsorship_deals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sponsor_id", sa.Integer(), nullable=False),
        sa.Column("tier_id", sa.Integer(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=True),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("payment_status", sa.String(length=50), nullable=False),
        sa.Column("stripe_payment_id", sa.String(length=255), nullable=True),
        sa.Column("total_amount", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["sponsor_id"],
            ["sponsors.id"],
        ),
        sa.ForeignKeyConstraint(
            ["tier_id"],
            ["sponsorship_tiers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["venue_id"],
            ["venues.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("sponsorship_deals")
    op.drop_table("sponsorship_tiers")
    op.drop_table("sponsors")
