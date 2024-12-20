"""Add friendship support

Revision ID: add_friendship_support
Revises: add_notification_support
Create Date: 2024-01-10 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'add_friendship_support'
down_revision = 'add_notification_support'
branch_labels = None
depends_on = None

def upgrade():
    """Add friendship table and related constraints."""
    op.create_table(
        'friendships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('friend_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['friend_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'friend_id', name='unique_friendship'),
        sa.CheckConstraint('user_id != friend_id', name='no_self_friendship')
    )
    
    # Add indexes for better query performance
    op.create_index('idx_friendships_user_id', 'friendships', ['user_id'])
    op.create_index('idx_friendships_friend_id', 'friendships', ['friend_id'])
    op.create_index('idx_friendships_status', 'friendships', ['status'])

def downgrade():
    """Remove friendship table and related constraints."""
    op.drop_index('idx_friendships_status')
    op.drop_index('idx_friendships_friend_id')
    op.drop_index('idx_friendships_user_id')
    op.drop_table('friendships') 