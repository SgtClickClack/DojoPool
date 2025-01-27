# syntax=docker/dockerfile:1.4

FROM python:3.11-slim-bullseye

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir PyJWT==2.8.0

# Copy application code
COPY . .

# Install the package in development mode
RUN pip install -e .

# Set environment variables
ENV PYTHONPATH=/app:/app/src \
    FLASK_APP=src.dojopool.app \
    FLASK_ENV=production \
    PYTHONUNBUFFERED=1 \
    GUNICORN_CMD_ARGS="--bind=0.0.0.0:5000 --workers=4 --timeout=120 --log-level=debug --error-logfile=- --access-logfile=-"

# Expose port
EXPOSE 5000

# Run the application with gunicorn
CMD ["gunicorn", "wsgi:app"] 