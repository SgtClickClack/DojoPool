# Set environment variables
$env:FLASK_APP = "src/app.py"
$env:FLASK_ENV = "development"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/dojo_pool"

Write-Host "Creating database if it doesn't exist..."
try {
    psql -U postgres -c "CREATE DATABASE dojo_pool;" 2>$null
} catch {
    Write-Host "Database might already exist, continuing..."
}

Write-Host "Initializing migrations..."
python -m flask db init

Write-Host "Creating and applying migrations..."
python -m flask db migrate -m "Initial migration"
python -m flask db upgrade

Write-Host "Running database initialization script..."
python scripts/db_init.py

Write-Host "Database setup completed!" 