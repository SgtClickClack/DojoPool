import asyncio
import logging
import os
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Dict, List, Optional

import aiohttp
import jwt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, IndexModel

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class APIHandler:
    def __init__(self):
        # Initialize API keys and database connection
        self.api_keys = {
            "places": os.getenv("GOOGLE_PLACES_API_KEY"),
            "weather": os.getenv("WEATHER_API_KEY"),
            "maps": os.getenv("GOOGLE_MAPS_API_KEY"),
        }

        # Initialize database connection
        self.db_client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
        self.db = self.db_client.dojo_pool

        # Initialize rate limiting
        self.rate_limits = {
            "places": {
                "calls": 0,
                "reset_time": datetime.now(),
                "limit": 2,
            },  # Reduced limit for testing
            "weather": {"calls": 0, "reset_time": datetime.now(), "limit": 1000},
        }

        # Initialize caching
        self.cache = {}

    async def setup_indexes(self):
        """Setup database indexes for optimization."""
        try:
            # Avatar indexes
            await self.db.avatars.create_indexes(
                [
                    IndexModel([("name", ASCENDING)], unique=True),
                    IndexModel([("rank", ASCENDING)]),
                    IndexModel([("clan", ASCENDING)]),
                ]
            )

            # Events indexes
            await self.db.events.create_indexes(
                [
                    IndexModel([("timestamp", ASCENDING)]),
                    IndexModel([("avatar_name", ASCENDING)]),
                    IndexModel([("event_type", ASCENDING)]),
                ]
            )

            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Failed to create indexes: {str(e)}")

    def rate_limit_decorator(api_name):
        """Decorator to handle rate limiting for API calls."""

        def decorator(func):
            @wraps(func)
            async def wrapper(self, *args, **kwargs):
                rate_info = self.rate_limits[api_name]

                # Reset counter if enough time has passed
                if datetime.now() - rate_info["reset_time"] > timedelta(hours=1):
                    rate_info["calls"] = 0
                    rate_info["reset_time"] = datetime.now()

                # Check rate limit
                if rate_info["calls"] >= rate_info["limit"]:
                    raise Exception(f"Rate limit exceeded for {api_name} API")

                # Increment counter and make call
                rate_info["calls"] += 1
                return await func(self, *args, **kwargs)

            return wrapper

        return decorator

    @rate_limit_decorator("places")
    async def fetch_places(self, query: str, location: Dict[str, float]) -> Dict[str, Any]:
        """Fetch places data with rate limiting and caching."""
        cache_key = f"places_{query}_{location['lat']}_{location['lng']}"

        # Check cache
        if cache_key in self.cache:
            logger.info(f"Cache hit for key: {cache_key}")
            return self.cache[cache_key]

        logger.info(f"Fetching places for query: {query} at location: {location}")

        # Simulate API call (replace with actual API call logic)
        await asyncio.sleep(0.1)  # Simulate network delay

        # Mocked response
        response = {
            "status": "success",
            "data": {
                "query": query,
                "location": location,
                "results": [{"name": "Place A", "rating": 4.5}, {"name": "Place B", "rating": 4.0}],
            },
        }

        # Cache the response
        self.cache[cache_key] = response
        return response

    @rate_limit_decorator("weather")
    async def fetch_weather(self, location: Dict[str, float]) -> Dict:
        """Fetch weather data with rate limiting and caching."""
        cache_key = f"weather_{location['lat']}_{location['lng']}"

        # Check cache
        if cache_key in self.cache:
            cache_data = self.cache[cache_key]
            if datetime.now() - cache_data["timestamp"] < timedelta(minutes=30):
                return cache_data["data"]

        async with aiohttp.ClientSession() as session:
            try:
                url = "https://api.openweathermap.org/data/2.5/weather"
                params = {
                    "appid": self.api_keys["weather"],
                    "lat": location["lat"],
                    "lon": location["lng"],
                    "units": "metric",
                }

                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Cache the results
                        self.cache[cache_key] = {"data": data, "timestamp": datetime.now()}

                        return data
                    else:
                        logger.error(f"Weather API error: {response.status}")
                        return None

            except Exception as e:
                logger.error(f"Weather API request failed: {str(e)}")
                return None

    async def save_avatar(self, avatar_data: Dict) -> bool:
        """Save avatar data to database."""
        try:
            await self.db.avatars.update_one(
                {"name": avatar_data["name"]},
                {"$set": {**avatar_data, "updated_at": datetime.now()}},
                upsert=True,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to save avatar: {str(e)}")
            return False

    async def save_event(self, event_data: Dict) -> bool:
        """Save event data to database."""
        try:
            await self.db.events.insert_one({**event_data, "created_at": datetime.now()})
            return True
        except Exception as e:
            logger.error(f"Failed to save event: {str(e)}")
            return False

    async def get_avatar_events(
        self, avatar_name: str, limit: int = 10, event_type: Optional[str] = None
    ) -> List[Dict]:
        """Retrieve avatar events with optional filtering."""
        try:
            query = {"avatar_name": avatar_name}
            if event_type:
                query["event_type"] = event_type

            cursor = self.db.events.find(query).sort("timestamp", -1).limit(limit)

            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"Failed to retrieve events: {str(e)}")
            return []

    def generate_jwt(self, avatar_name: str) -> str:
        """Generate JWT token for API authentication."""
        try:
            payload = {"avatar_name": avatar_name, "exp": datetime.utcnow() + timedelta(days=1)}
            return jwt.encode(payload, os.getenv("JWT_SECRET"), algorithm="HS256")
        except Exception as e:
            logger.error(f"Failed to generate JWT: {str(e)}")
            return None

    @staticmethod
    def verify_jwt(token: str) -> Optional[Dict]:
        """Verify JWT token and return payload."""
        try:
            return jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            logger.error("JWT token has expired")
            return None
        except jwt.InvalidTokenError:
            logger.error("Invalid JWT token")
            return None
