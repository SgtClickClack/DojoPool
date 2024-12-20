"""add rating support

Revision ID: add_rating_support
Revises: add_achievement_support
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'add_rating_support'
down_revision = 'add_achievement_support'
branch_labels = None
depends_on = None

def upgrade():
    # Create ratings table
    op.create_table(
        'ratings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=False),
        sa.Column('target_id', sa.Integer(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('review', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add unique constraint to prevent duplicate ratings
    op.create_unique_constraint(
        'unique_user_rating',
        'ratings',
        ['user_id', 'target_type', 'target_id']
    )
    
    # Add indexes for common queries
    op.create_index(
        'ix_ratings_target',
        'ratings',
        ['target_type', 'target_id']
    )
    op.create_index(
        'ix_ratings_user_id',
        'ratings',
        ['user_id']
    )

def downgrade():
    # Drop indexes
    op.drop_index('ix_ratings_target')
    op.drop_index('ix_ratings_user_id')
    
    # Drop ratings table
    op.drop_table('ratings') 