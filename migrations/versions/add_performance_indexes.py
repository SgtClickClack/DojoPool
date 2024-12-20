"""add performance indexes

Revision ID: add_performance_indexes
Revises: # Leave this empty, it will be filled automatically
Create Date: 2023-07-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'add_performance_indexes'
down_revision = None  # This will be updated automatically
branch_labels = None
depends_on = None

def upgrade():
    # Add indexes for frequently accessed columns
    op.create_index('ix_games_status', 'games', ['status'])
    op.create_index('ix_games_player_id', 'games', ['player_id'])
    op.create_index('ix_games_winner_id', 'games', ['winner_id'])
    op.create_index('ix_games_completed_at', 'games', ['completed_at'])
    
    op.create_index('ix_matches_player_id', 'matches', ['player_id'])
    op.create_index('ix_matches_created_at', 'matches', ['created_at'])
    
    op.create_index('ix_tournaments_status', 'tournaments', ['status'])
    
    # Composite indexes for common query patterns
    op.create_index('ix_games_player_status', 'games', ['player_id', 'status'])
    op.create_index('ix_matches_player_status', 'matches', ['player_id', 'status'])

def downgrade():
    # Remove the indexes
    op.drop_index('ix_games_status')
    op.drop_index('ix_games_player_id')
    op.drop_index('ix_games_winner_id')
    op.drop_index('ix_games_completed_at')
    
    op.drop_index('ix_matches_player_id')
    op.drop_index('ix_matches_created_at')
    
    op.drop_index('ix_tournaments_status')
    
    op.drop_index('ix_games_player_status')
    op.drop_index('ix_matches_player_status') 