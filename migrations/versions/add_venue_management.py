"""add venue management

Revision ID: add_venue_management
Revises: add_leaderboard_support
Create Date: 2024-01-20 11:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'add_venue_management'
down_revision = 'add_leaderboard_support'
branch_labels = None
depends_on = None

def upgrade():
    # Create venues table
    op.create_table(
        'venues',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('address', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('contact_info', sa.String(length=100), nullable=True),
        sa.Column('opening_hours', sa.JSON(), nullable=True),
        sa.Column('tables_count', sa.Integer(), nullable=False),
        sa.Column('hourly_rate', sa.Float(), nullable=True),
        sa.Column('amenities', sa.JSON(), nullable=True),
        sa.Column('images', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create venue_availability table
    op.create_table(
        'venue_availability',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('venue_id', sa.Integer(), nullable=False),
        sa.Column('table_number', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='available'),
        sa.Column('booking_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['venue_id'], ['venues.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create bookings table
    op.create_table(
        'bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('venue_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('table_number', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['venue_id'], ['venues.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_venue_status', 'venues', ['status'])
    op.create_index('idx_venue_owner', 'venues', ['owner_id'])
    op.create_index('idx_availability_venue_time', 'venue_availability', ['venue_id', 'start_time', 'end_time'])
    op.create_index('idx_availability_status', 'venue_availability', ['status'])
    op.create_index('idx_booking_venue_time', 'bookings', ['venue_id', 'start_time', 'end_time'])
    op.create_index('idx_booking_user', 'bookings', ['user_id'])
    op.create_index('idx_booking_status', 'bookings', ['status'])

    # Add foreign key from venue_availability to bookings
    op.create_foreign_key(
        'fk_availability_booking',
        'venue_availability', 'bookings',
        ['booking_id'], ['id']
    )

def downgrade():
    # Drop foreign keys first
    op.drop_constraint('fk_availability_booking', 'venue_availability', type_='foreignkey')
    
    # Drop indexes
    op.drop_index('idx_booking_status', table_name='bookings')
    op.drop_index('idx_booking_user', table_name='bookings')
    op.drop_index('idx_booking_venue_time', table_name='bookings')
    op.drop_index('idx_availability_status', table_name='venue_availability')
    op.drop_index('idx_availability_venue_time', table_name='venue_availability')
    op.drop_index('idx_venue_owner', table_name='venues')
    op.drop_index('idx_venue_status', table_name='venues')
    
    # Drop tables
    op.drop_table('bookings')
    op.drop_table('venue_availability')
    op.drop_table('venues') 