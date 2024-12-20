"""add leaderboard support

Revision ID: add_leaderboard_support
Revises: add_rating_support
Create Date: 2024-01-20 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'add_leaderboard_support'
down_revision = 'add_rating_support'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'leaderboard_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('period', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        'idx_leaderboard_category_period',
        'leaderboard_entries',
        ['category', 'period']
    )

    op.create_index(
        'idx_leaderboard_rank',
        'leaderboard_entries',
        ['rank']
    )

    op.create_unique_constraint(
        'unique_user_category_period',
        'leaderboard_entries',
        ['user_id', 'category', 'period']
    )

def downgrade():
    op.drop_constraint('unique_user_category_period', 'leaderboard_entries', type_='unique')
    op.drop_index('idx_leaderboard_rank', table_name='leaderboard_entries')
    op.drop_index('idx_leaderboard_category_period', table_name='leaderboard_entries')
    op.drop_table('leaderboard_entries') 