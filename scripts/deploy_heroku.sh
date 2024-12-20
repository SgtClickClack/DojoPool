#!/bin/bash

# Heroku deployment script
set -e

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "Heroku CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "Not logged in to Heroku. Please run 'heroku login' first."
    exit 1
fi

# Configuration
APP_NAME="dojopool"
HEROKU_REMOTE="heroku"

# Add Heroku remote if it doesn't exist
if ! git remote | grep -q "^${HEROKU_REMOTE}$"; then
    heroku git:remote -a $APP_NAME
fi

# Set Heroku config vars
echo "Setting up Heroku configuration..."
heroku config:set \
    FLASK_APP=src/app.py \
    FLASK_ENV=production \
    PYTHON_VERSION=3.9.0 \
    -a $APP_NAME

# Push to Heroku
echo "Deploying to Heroku..."
git push heroku main

# Run database migrations
echo "Running database migrations..."
heroku run flask db upgrade -a $APP_NAME

# Scale dynos
echo "Scaling dynos..."
heroku ps:scale web=1 -a $APP_NAME

echo "Deployment completed successfully!" 