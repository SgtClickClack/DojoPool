# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir eventlet==0.33.3

# Copy source code for package installation
COPY . .
RUN pip install --no-cache-dir .

# Development stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Create non-root user and required directories
RUN useradd -m -r -s /bin/bash appuser && \
    mkdir -p /app/logs /app/static && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Set environment variables
ENV PYTHONPATH=/app:/app/src
ENV FLASK_APP=dojopool/__init__.py
ENV FLASK_ENV=development
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Expose port
EXPOSE 5000

# Run the application with gunicorn
CMD ["gunicorn", "--worker-class", "eventlet", "--workers", "4", "--bind", "0.0.0.0:5000", "wsgi:app"] 