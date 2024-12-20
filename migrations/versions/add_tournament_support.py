"""add tournament support

Revision ID: add_tournament_support
Revises: add_chat_support
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tournament_support'
down_revision = 'add_chat_support'
branch_labels = None
depends_on = None

def upgrade():
    # Create tournament status enum
    op.execute("CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'in_progress', 'completed', 'cancelled')")
    
    # Create tournament format enum
    op.execute("CREATE TYPE tournament_format AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'swiss')")
    
    # Create tournaments table
    op.create_table('tournaments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('format', postgresql.ENUM('single_elimination', 'double_elimination', 'round_robin', 'swiss', name='tournament_format'), nullable=False),
        sa.Column('status', postgresql.ENUM('draft', 'registration', 'in_progress', 'completed', 'cancelled', name='tournament_status'), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('registration_deadline', sa.DateTime(), nullable=False),
        sa.Column('max_participants', sa.Integer(), nullable=True),
        sa.Column('entry_fee', sa.Float(), nullable=True),
        sa.Column('prize_pool', sa.Float(), nullable=True),
        sa.Column('game_type', sa.String(length=50), nullable=False),
        sa.Column('rules', sa.Text(), nullable=True),
        sa.Column('best_of', sa.Integer(), nullable=True),
        sa.Column('organizer_id', sa.Integer(), nullable=False),
        sa.Column('venue_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['organizer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['venue_id'], ['venues.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create tournament participants table
    op.create_table('tournament_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('seed', sa.Integer(), nullable=True),
        sa.Column('registration_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('matches_played', sa.Integer(), nullable=True),
        sa.Column('matches_won', sa.Integer(), nullable=True),
        sa.Column('matches_lost', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tournament_id', 'user_id')
    )
    
    # Create tournament matches table
    op.create_table('tournament_matches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('round_number', sa.Integer(), nullable=False),
        sa.Column('match_number', sa.Integer(), nullable=False),
        sa.Column('player1_id', sa.Integer(), nullable=True),
        sa.Column('player2_id', sa.Integer(), nullable=True),
        sa.Column('player1_score', sa.Integer(), nullable=True),
        sa.Column('player2_score', sa.Integer(), nullable=True),
        sa.Column('scheduled_time', sa.DateTime(), nullable=True),
        sa.Column('actual_start_time', sa.DateTime(), nullable=True),
        sa.Column('actual_end_time', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('winner_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['player1_id'], ['tournament_participants.id'], ),
        sa.ForeignKeyConstraint(['player2_id'], ['tournament_participants.id'], ),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournaments.id'], ),
        sa.ForeignKeyConstraint(['winner_id'], ['tournament_participants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_tournaments_start_date'), 'tournaments', ['start_date'], unique=False)
    op.create_index(op.f('ix_tournaments_status'), 'tournaments', ['status'], unique=False)
    op.create_index(op.f('ix_tournament_matches_tournament_id'), 'tournament_matches', ['tournament_id'], unique=False)
    op.create_index(op.f('ix_tournament_participants_tournament_id'), 'tournament_participants', ['tournament_id'], unique=False)
    op.create_index(op.f('ix_tournament_participants_user_id'), 'tournament_participants', ['user_id'], unique=False)

def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_tournament_participants_user_id'), table_name='tournament_participants')
    op.drop_index(op.f('ix_tournament_participants_tournament_id'), table_name='tournament_participants')
    op.drop_index(op.f('ix_tournament_matches_tournament_id'), table_name='tournament_matches')
    op.drop_index(op.f('ix_tournaments_status'), table_name='tournaments')
    op.drop_index(op.f('ix_tournaments_start_date'), table_name='tournaments')
    
    # Drop tables
    op.drop_table('tournament_matches')
    op.drop_table('tournament_participants')
    op.drop_table('tournaments')
    
    # Drop enums
    op.execute('DROP TYPE tournament_format')
    op.execute('DROP TYPE tournament_status') 