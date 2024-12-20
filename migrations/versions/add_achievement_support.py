"""add achievement support

Revision ID: add_achievement_support
Revises: add_tournament_support
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_achievement_support'
down_revision = 'add_tournament_support'
branch_labels = None
depends_on = None

def upgrade():
    # Create achievement_type enum
    achievement_type = postgresql.ENUM('games_played', 'games_won', 'tournaments_played', 
                                     'tournaments_won', 'friends_made', 'chat_messages',
                                     'profile_complete', 'consecutive_days', 'special_event',
                                     name='achievementtype')
    achievement_type.create(op.get_bind())
    
    # Create achievements table
    op.create_table('achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.Enum('games_played', 'games_won', 'tournaments_played', 
                                 'tournaments_won', 'friends_made', 'chat_messages',
                                 'profile_complete', 'consecutive_days', 'special_event',
                                 name='achievementtype'), nullable=False),
        sa.Column('icon_url', sa.String(length=255), nullable=True),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('target_value', sa.Integer(), nullable=True),
        sa.Column('is_hidden', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('tier', sa.Integer(), nullable=False, default=1),
        sa.Column('next_tier_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['next_tier_id'], ['achievements.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user_achievements table
    op.create_table('user_achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('achievement_id', sa.Integer(), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False, default=0),
        sa.Column('completed', sa.Boolean(), nullable=False, default=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_achievements_type'), 'achievements', ['type'], unique=False)
    op.create_index(op.f('ix_user_achievements_user_id'), 'user_achievements', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_achievements_achievement_id'), 'user_achievements', ['achievement_id'], unique=False)
    op.create_index(op.f('ix_user_achievements_completed'), 'user_achievements', ['completed'], unique=False)

def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_user_achievements_completed'), table_name='user_achievements')
    op.drop_index(op.f('ix_user_achievements_achievement_id'), table_name='user_achievements')
    op.drop_index(op.f('ix_user_achievements_user_id'), table_name='user_achievements')
    op.drop_index(op.f('ix_achievements_type'), table_name='achievements')
    
    # Drop tables
    op.drop_table('user_achievements')
    op.drop_table('achievements')
    
    # Drop enum type
    achievement_type = postgresql.ENUM('games_played', 'games_won', 'tournaments_played', 
                                     'tournaments_won', 'friends_made', 'chat_messages',
                                     'profile_complete', 'consecutive_days', 'special_event',
                                     name='achievementtype')
    achievement_type.drop(op.get_bind()) 