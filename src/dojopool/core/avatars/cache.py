"""Avatar caching module."""

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union, cast

import redis

logger = logging.getLogger(__name__)


class AvatarCache:
    """Cache for user avatars."""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        ssl: bool = False,
    ) -> None:
        """Initialize avatar cache.

        Args:
            host: Redis host
            port: Redis port
            db: Redis database number
            password: Redis password
            ssl: Use SSL connection
        """
        self.redis = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            ssl=ssl,
            decode_responses=True,
        )

        # Set default expiration time (7 days)
        self.expiration = timedelta(days=7)

    def _get_metadata_key(self, user_id: int):
        """Get Redis key for avatar metadata.

        Args:
            user_id: User ID

        Returns:
            Redis key
        """
        return f"avatar:metadata:{user_id}"

    def _get_data_key(self, user_id: int):
        """Get Redis key for avatar data.

        Args:
            user_id: User ID

        Returns:
            Redis key
        """
        return f"avatar:data:{user_id}"

    def _compute_hash(self, data: bytes):
        """Compute hash of avatar data.

        Args:
            data: Avatar data

        Returns:
            Data hash
        """
        return hashlib.sha256(data).hexdigest()

    def get_avatar(self, user_id: int) -> Optional[bytes]:
        """Get avatar data for user.

        Args:
            user_id: User ID

        Returns:
            Avatar data if found
        """
        try:
            # Get avatar data
            data = self.redis.get(self._get_data_key(user_id))
            if not data:
                return None

            # Update last accessed time
            metadata_key = self._get_metadata_key(user_id)
            metadata = self.redis.hgetall(metadata_key)
            if metadata:
                metadata["last_accessed"] = datetime.utcnow().isoformat()
                self.redis.hmset(metadata_key, metadata)

            return cast(bytes, data)

        except redis.RedisError:
            return None

    def set_avatar(
        self,
        user_id: int,
        avatar_data: bytes,
        style_name: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Set avatar data for user.

        Args:
            user_id: User ID
            avatar_data: Avatar image data
            style_name: Avatar style name
            metadata: Additional metadata

        Returns:
            True if successful
        """
        try:
            # Store avatar data
            data_key = self._get_data_key(user_id)
            self.redis.set(data_key, avatar_data)

            # Store metadata
            base_metadata = {
                "hash": self._compute_hash(avatar_data),
                "style": style_name,
                "size": len(avatar_data),
                "created_at": datetime.utcnow().isoformat(),
                "last_accessed": datetime.utcnow().isoformat(),
            }

            if metadata:
                base_metadata.update(metadata)

            metadata_key = self._get_metadata_key(user_id)
            self.redis.hmset(metadata_key, base_metadata)

            # Set expiration
            self.redis.expire(data_key, int(self.expiration.total_seconds()))
            self.redis.expire(metadata_key, int(self.expiration.total_seconds()))

            return True

        except redis.RedisError:
            return False

    def get_metadata(self, user_id: int):
        """Get avatar metadata for user.

        Args:
            user_id: User ID

        Returns:
            Avatar metadata if found
        """
        try:
            metadata = self.redis.hgetall(self._get_metadata_key(user_id))
            return metadata if metadata else None
        except redis.RedisError:
            return None

    def delete_avatar(self, user_id: int):
        """Delete avatar for user.

        Args:
            user_id: User ID

        Returns:
            True if successful
        """
        try:
            self.redis.delete(self._get_data_key(user_id))
            self.redis.delete(self._get_metadata_key(user_id))
            return True
        except redis.RedisError:
            return False

    def clear_expired(self) -> int:
        """Clear expired avatars.

        Returns:
            Number of cleared avatars
        """
        try:
            cleared = 0
            pattern = "avatar:metadata:*"

            for key in self.redis.scan_iter(match=pattern):
                metadata = self.redis.hgetall(key)
                if not metadata:
                    continue

                last_accessed = datetime.fromisoformat(metadata["last_accessed"])
                if datetime.utcnow() - last_accessed > self.expiration:
                    user_id = int(key.split(":")[-1])
                    if self.delete_avatar(user_id):
                        cleared += 1

            return cleared

        except redis.RedisError:
            return 0

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics.

        Returns:
            Cache statistics
        """
        try:
            total_avatars = 0
            total_size = 0
            styles: Dict[str, int] = {}

            pattern = "avatar:metadata:*"
            for key in self.redis.scan_iter(match=pattern):
                metadata = self.redis.hgetall(key)
                if not metadata:
                    continue

                total_avatars += 1
                total_size += int(metadata["size"])
                style = metadata["style"]
                styles[style] = styles.get(style, 0) + 1

            return {
                "total_avatars": total_avatars,
                "total_size": total_size,
                "styles": styles,
            }

        except redis.RedisError:
            return {"total_avatars": 0, "total_size": 0, "styles": {}}


def update_avatar_cache(key: str, data: Dict[str, Union[str, int, float]]):
    # Ensure all values are converted to strings to satisfy hmset's expected type.
    serialized_data: Dict[str, str] = {k: str(v) for k, v in data.items()}
    redis_client.hmset(key, serialized_data)
