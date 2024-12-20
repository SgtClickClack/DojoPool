#!/bin/bash

# Create the database if it doesn't exist
psql -U postgres -c "CREATE DATABASE dojo_pool;" || true

# Set environment variables
export FLASK_APP=src/app.py
export FLASK_ENV=development
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dojo_pool

# Initialize migrations
flask db init || true

# Create and apply migrations
flask db migrate -m "Initial migration"
flask db upgrade

# Run the database initialization script
python scripts/db_init.py

echo "Database setup completed!" 