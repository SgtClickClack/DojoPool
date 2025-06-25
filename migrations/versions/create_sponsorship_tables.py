"""Create sponsorship bracket tables

Revision ID: sp001_sponsorship_tables
Revises: a5009d2fde41
Create Date: 2025-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'sp001_sponsorship_tables'
down_revision = 'a5009d2fde41'
branch_labels = None
depends_on = None


def upgrade():
    # Create sponsorship_brackets table
    op.create_table(
        'sponsorship_brackets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('bracketId', sa.String(), nullable=False),
        sa.Column('sponsorName', sa.String(), nullable=False),
        sa.Column('sponsorLogo', sa.String(), nullable=True),
        sa.Column('inGameTitle', sa.String(), nullable=False),
        sa.Column('requiredLevel', sa.Integer(), nullable=False),
        sa.Column('narrativeIntro', sa.Text(), nullable=False),
        sa.Column('narrativeOutro', sa.Text(), nullable=False),
        sa.Column('challenges', sa.JSON(), nullable=False),
        sa.Column('digitalReward', sa.JSON(), nullable=False),
        sa.Column('physicalReward', sa.JSON(), nullable=False),
        sa.Column('isActive', sa.Boolean(), nullable=False, default=True),
        sa.Column('startDate', sa.DateTime(), nullable=True),
        sa.Column('endDate', sa.DateTime(), nullable=True),
        sa.Column('maxParticipants', sa.Integer(), nullable=True),
        sa.Column('currentParticipants', sa.Integer(), nullable=False, default=0),
        sa.Column('createdAt', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updatedAt', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bracketId')
    )

    # Create player_sponsorship_progress table
    op.create_table(
        'player_sponsorship_progress',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('playerId', sa.String(), nullable=False),
        sa.Column('bracketId', sa.String(), nullable=False),
        sa.Column('bracketTitle', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('challengeProgress', sa.JSON(), nullable=False),
        sa.Column('startedAt', sa.DateTime(), nullable=True),
        sa.Column('completedAt', sa.DateTime(), nullable=True),
        sa.Column('digitalRewardClaimed', sa.Boolean(), nullable=False, default=False),
        sa.Column('physicalRewardRedeemed', sa.Boolean(), nullable=False, default=False),
        sa.Column('redemptionCode', sa.String(), nullable=True),
        sa.Column('createdAt', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updatedAt', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('playerId', 'bracketId'),
        sa.ForeignKeyConstraint(['playerId'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bracketId'], ['sponsorship_brackets.bracketId'], ondelete='CASCADE')
    )

    # Create sponsorship_events table
    op.create_table(
        'sponsorship_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('eventType', sa.String(), nullable=False),
        sa.Column('playerId', sa.String(), nullable=False),
        sa.Column('bracketId', sa.String(), nullable=False),
        sa.Column('challengeId', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('createdAt', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for better performance
    op.create_index('idx_sponsorship_brackets_active', 'sponsorship_brackets', ['isActive'])
    op.create_index('idx_sponsorship_brackets_level', 'sponsorship_brackets', ['requiredLevel'])
    op.create_index('idx_player_progress_player', 'player_sponsorship_progress', ['playerId'])
    op.create_index('idx_player_progress_bracket', 'player_sponsorship_progress', ['bracketId'])
    op.create_index('idx_player_progress_status', 'player_sponsorship_progress', ['status'])
    op.create_index('idx_sponsorship_events_player', 'sponsorship_events', ['playerId'])
    op.create_index('idx_sponsorship_events_bracket', 'sponsorship_events', ['bracketId'])
    op.create_index('idx_sponsorship_events_type', 'sponsorship_events', ['eventType'])
    op.create_index('idx_sponsorship_events_timestamp', 'sponsorship_events', ['timestamp'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_sponsorship_events_timestamp')
    op.drop_index('idx_sponsorship_events_type')
    op.drop_index('idx_sponsorship_events_bracket')
    op.drop_index('idx_sponsorship_events_player')
    op.drop_index('idx_player_progress_status')
    op.drop_index('idx_player_progress_bracket')
    op.drop_index('idx_player_progress_player')
    op.drop_index('idx_sponsorship_brackets_level')
    op.drop_index('idx_sponsorship_brackets_active')
    
    # Drop tables
    op.drop_table('sponsorship_events')
    op.drop_table('player_sponsorship_progress')
    op.drop_table('sponsorship_brackets')