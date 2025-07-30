# Build stage
FROM node:20-alpine AS frontend-build
ARG SKIP_FRONTEND_BUILD=false
WORKDIR /app/frontend
COPY src/dojopool/frontend/package*.json ./
RUN if [ "$SKIP_FRONTEND_BUILD" = "false" ] ; then npm install ; fi
COPY src/dojopool/frontend .
RUN if [ "$SKIP_FRONTEND_BUILD" = "false" ] ; then npm run build ; fi

# Python build stage
FROM python:3.13.3-slim AS backend-build
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.13.3-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir gunicorn celery

# Create necessary directories with proper permissions
RUN mkdir -p /var/run/supervisor /var/log/supervisor /var/log/nginx \
    && touch /var/log/nginx/access.log /var/log/nginx/error.log \
    && chown -R www-data:www-data /var/run/supervisor /var/log/supervisor /var/log/nginx

# Copy built frontend
COPY --from=frontend-build /app/frontend/build /app/static
COPY nginx.conf /etc/nginx/nginx.conf

# Copy Python packages and application code
COPY --from=backend-build /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --chown=www-data:www-data src/dojopool /app/dojopool
COPY --chown=www-data:www-data config /app/config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set environment variables
ENV PYTHONPATH=/app/src
ENV FLASK_APP=dojopool
ENV FLASK_ENV=production
ENV STATIC_FOLDER=/app/static

# Set minimal required permissions
RUN chmod 755 /app/dojopool/app.py

# Expose ports
EXPOSE 5000

# Start services using supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"] 