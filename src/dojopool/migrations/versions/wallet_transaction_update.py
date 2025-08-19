"""Wallet and Transaction model updates

Revision ID: wallet_transaction_update
Revises: previous_revision
Create Date: 2024-03-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'wallet_transaction_update'
down_revision = None  # TODO: Set this to the previous migration's revision ID
branch_labels = None
depends_on = None


def upgrade():
    # Create wallets table
    op.create_table(
        'wallets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('balance', sa.Float(), nullable=False, default=0.0),
        sa.Column('currency', sa.String(10), nullable=False, default="DP"),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('idx_wallets_user', 'wallets', ['user_id'])

    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('wallet_id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(50), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('description', sa.String(255)),
        sa.Column('metadata', postgresql.JSON(), default={}),
        sa.Column('blockchain_tx_id', sa.String(255), unique=True),
        sa.Column('blockchain_status', sa.String(50)),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['wallet_id'], ['wallets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_transactions_wallet_type', 'transactions', ['wallet_id', 'transaction_type'])
    op.create_index('idx_transactions_created_at', 'transactions', ['created_at'])


def downgrade():
    op.drop_index('idx_transactions_created_at', table_name='transactions')
    op.drop_index('idx_transactions_wallet_type', table_name='transactions')
    op.drop_table('transactions')
    op.drop_index('idx_wallets_user', table_name='wallets')
    op.drop_table('wallets') 