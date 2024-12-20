"""Add chat support

Revision ID: add_chat_support
Revises: add_friendship_support
Create Date: 2024-01-10 11:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'add_chat_support'
down_revision = 'add_friendship_support'
branch_labels = None
depends_on = None

def upgrade():
    """Add chat tables and related constraints."""
    # Create chat rooms table
    op.create_table(
        'chat_rooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=True),
        sa.Column('type', sa.String(20), nullable=False, server_default='direct'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create chat participants table
    op.create_table(
        'chat_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_read_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['room_id'], ['chat_rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('room_id', 'user_id', name='unique_chat_participant')
    )
    
    # Create chat messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(20), nullable=False, server_default='text'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['room_id'], ['chat_rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes for better query performance
    op.create_index('idx_chat_rooms_type', 'chat_rooms', ['type'])
    op.create_index('idx_chat_participants_room_id', 'chat_participants', ['room_id'])
    op.create_index('idx_chat_participants_user_id', 'chat_participants', ['user_id'])
    op.create_index('idx_chat_messages_room_id', 'chat_messages', ['room_id'])
    op.create_index('idx_chat_messages_sender_id', 'chat_messages', ['sender_id'])
    op.create_index('idx_chat_messages_created_at', 'chat_messages', ['created_at'])

def downgrade():
    """Remove chat tables and related constraints."""
    op.drop_index('idx_chat_messages_created_at')
    op.drop_index('idx_chat_messages_sender_id')
    op.drop_index('idx_chat_messages_room_id')
    op.drop_index('idx_chat_participants_user_id')
    op.drop_index('idx_chat_participants_room_id')
    op.drop_index('idx_chat_rooms_type')
    op.drop_table('chat_messages')
    op.drop_table('chat_participants')
    op.drop_table('chat_rooms') 