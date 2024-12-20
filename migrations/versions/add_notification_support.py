"""add notification support

Revision ID: add_notification_support
Revises: add_performance_indexes
Create Date: 2023-07-20 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = 'add_notification_support'
down_revision = 'add_performance_indexes'
branch_labels = None
depends_on = None

def upgrade():
    # Add notification preferences to users table
    op.add_column('users', sa.Column('email_notifications', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('push_notifications', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('notification_types', sa.JSON(), nullable=True))
    
    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=True),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])
    op.create_index('ix_notifications_type', 'notifications', ['type'])

def downgrade():
    # Drop notifications table and indexes
    op.drop_table('notifications')
    
    # Remove notification preferences from users table
    op.drop_column('users', 'notification_types')
    op.drop_column('users', 'push_notifications')
    op.drop_column('users', 'email_notifications') 