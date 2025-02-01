"""Cache configuration settings."""

import os

# Environment-based configuration
ENV = os.environ.get("FLASK_ENV", "development")
REDIS_USE_FAKE = os.environ.get("REDIS_USE_FAKE", "true").lower() == "true"

# Redis Configuration
REDIS_CONFIG = {
    "development": {
        "REDIS_HOST": "localhost",
        "REDIS_PORT": 6379,
        "REDIS_DB": 0,
        "REDIS_PASSWORD": None,
        "REDIS_SSL": False,
        "REDIS_SOCKET_TIMEOUT": 2,
        "REDIS_SOCKET_CONNECT_TIMEOUT": 2,
        "REDIS_RETRY_ON_TIMEOUT": True,
        "REDIS_MAX_CONNECTIONS": 10,
        "REDIS_DECODE_RESPONSES": True,
    },
    "production": {
        "REDIS_HOST": os.environ.get("REDIS_HOST", "localhost"),
        "REDIS_PORT": int(os.environ.get("REDIS_PORT", 6379)),
        "REDIS_DB": int(os.environ.get("REDIS_DB", 0)),
        "REDIS_PASSWORD": os.environ.get("REDIS_PASSWORD"),
        "REDIS_SSL": os.environ.get("REDIS_SSL", "true").lower() == "true",
        "REDIS_SOCKET_TIMEOUT": 2,
        "REDIS_SOCKET_CONNECT_TIMEOUT": 2,
        "REDIS_RETRY_ON_TIMEOUT": True,
        "REDIS_MAX_CONNECTIONS": int(os.environ.get("REDIS_MAX_CONNECTIONS", 20)),
        "REDIS_DECODE_RESPONSES": True,
    },
}

# Use appropriate config based on environment
active_redis_config = REDIS_CONFIG["production" if ENV == "production" else "development"]

# Cache Settings
CACHE_CONFIG = {
    "CACHE_TYPE": "redis" if not REDIS_USE_FAKE else "simple",
    "CACHE_KEY_PREFIX": "dojopool:",
    "CACHE_DEFAULT_TIMEOUT": 300,
    "CACHE_THRESHOLD": 1000,
    "CACHE_REDIS_HOST": active_redis_config["REDIS_HOST"],
    "CACHE_REDIS_PORT": active_redis_config["REDIS_PORT"],
    "CACHE_REDIS_DB": active_redis_config["REDIS_DB"],
    "CACHE_REDIS_PASSWORD": active_redis_config["REDIS_PASSWORD"],
    "CACHE_OPTIONS": {
        "SOCKET_TIMEOUT": active_redis_config["REDIS_SOCKET_TIMEOUT"],
        "SOCKET_CONNECT_TIMEOUT": active_redis_config["REDIS_SOCKET_CONNECT_TIMEOUT"],
        "RETRY_ON_TIMEOUT": active_redis_config["REDIS_RETRY_ON_TIMEOUT"],
        "MAX_CONNECTIONS": active_redis_config["REDIS_MAX_CONNECTIONS"],
        "SSL": active_redis_config["REDIS_SSL"],
    },
}

# Cache Regions with optimized timeouts
CACHE_REGIONS = {
    "default": {"timeout": 300},  # 5 minutes
    "short": {"timeout": 60},  # 1 minute
    "medium": {"timeout": 1800},  # 30 minutes
    "long": {"timeout": 3600},  # 1 hour
    "permanent": {"timeout": 86400},  # 24 hours
}

# Frequently accessed endpoints
CACHED_ENDPOINTS = {
    "user_profile": {
        "timeout": CACHE_REGIONS["medium"]["timeout"],
        "key_pattern": "user:{user_id}:profile",
    },
    "venue_details": {
        "timeout": CACHE_REGIONS["medium"]["timeout"],
        "key_pattern": "venue:{venue_id}:details",
    },
    "game_state": {
        "timeout": CACHE_REGIONS["short"]["timeout"],
        "key_pattern": "game:{game_id}:state",
    },
    "leaderboard": {
        "timeout": CACHE_REGIONS["short"]["timeout"],
        "key_pattern": "leaderboard:{venue_id}",
    },
    "tournament": {
        "timeout": CACHE_REGIONS["medium"]["timeout"],
        "key_pattern": "tournament:{tournament_id}",
    },
    "achievements": {
        "timeout": CACHE_REGIONS["long"]["timeout"],
        "key_pattern": "user:{user_id}:achievements",
    },
}

# Performance monitoring settings
CACHE_MONITORING = {
    "ENABLE_STATS": True,
    "STATS_INTERVAL": 60,  # Collect stats every 60 seconds
    "ALERT_MEMORY_THRESHOLD": 0.8,  # Alert when memory usage is above 80%
    "ALERT_LATENCY_THRESHOLD": 0.1,  # Alert when average latency is above 100ms
}
