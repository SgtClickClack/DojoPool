# Installation Guide

This guide will help you set up DojoPool on your local machine for development purposes.

## Prerequisites

- Python 3.9 or higher
- PostgreSQL 13 or higher
- Redis 6 or higher
- Node.js 16 or higher (for frontend development)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/dojopool.git
cd dojopool
```

## Step 2: Set Up Python Environment

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Unix or MacOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt  # for development
```

## Step 3: Database Setup

1. Create a PostgreSQL database:
```bash
createdb dojopool
```

2. Set up environment variables:
```bash
# Create .env file
cp .env.example .env

# Edit .env with your database credentials
SQLALCHEMY_DATABASE_URI=postgresql://username:password@localhost/dojopool
```

3. Initialize the database:
```bash
flask db upgrade
```

## Step 4: Redis Setup

1. Install Redis:
- Windows: Use WSL or Redis Windows port
- Unix/MacOS: Use package manager

2. Configure Redis in .env:
```bash
REDIS_URL=redis://localhost:6379/0
```

## Step 5: Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Build frontend assets
npm run build
```

## Step 6: Configuration

1. Generate a secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

2. Update .env with the secret key and other settings:
```bash
SECRET_KEY=your_generated_key
FLASK_ENV=development
FLASK_APP=src/app.py
```

## Step 7: Run the Application

1. Start Redis server:
```bash
redis-server
```

2. Run the Flask application:
```bash
flask run
```

The application should now be running at `http://localhost:5000`

## Common Issues

### Database Connection Issues
- Check PostgreSQL service is running
- Verify database credentials in .env
- Ensure database exists

### Redis Connection Issues
- Verify Redis server is running
- Check Redis connection URL
- Ensure Redis port is not blocked

### Frontend Build Issues
- Clear node_modules and reinstall
- Update Node.js version
- Check for JavaScript errors

## Next Steps

- Read the [Configuration Guide](./configuration.md)
- Set up your [Development Environment](./development.md)
- Review the [Architecture Overview](../architecture/README.md) 