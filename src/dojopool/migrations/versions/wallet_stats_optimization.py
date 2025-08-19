"""Add index for wallet stats optimization

Revision ID: wallet_stats_optimization
Revises: wallet_transaction_update
Create Date: 2024-03-22 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'wallet_stats_optimization'
down_revision = 'wallet_transaction_update'
branch_labels = None
depends_on = None


def upgrade():
    # Add index for wallet stats query optimization
    # This index helps with filtering by wallet_id and transaction_type for reward stats
    op.create_index(
        'idx_transactions_wallet_type_amount',
        'transactions',
        ['wallet_id', 'transaction_type', 'amount'],
        postgresql_where=sa.text("transaction_type = 'reward'")
    )


def downgrade():
    op.drop_index('idx_transactions_wallet_type_amount', table_name='transactions')