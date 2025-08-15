"""Add feed entries table

Revision ID: add_feed_entries
Revises: None
Create Date: 2024-03-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_feed_entries'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create feed_entries table
    op.create_table('feed_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('content', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on user_id and created_at for faster queries
    op.create_index('ix_feed_entries_user_id_created_at', 'feed_entries', ['user_id', 'created_at'])

def downgrade():
    # Drop index
    op.drop_index('ix_feed_entries_user_id_created_at')
    
    # Drop table
    op.drop_table('feed_entries') 