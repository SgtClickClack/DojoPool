import redis
import json
import logging
from typing import Optional, Dict, Any
from datetime import timedelta
import hashlib

logger = logging.getLogger(__name__)

class AvatarCache:
    """Redis-based caching service for avatars."""
    def __init__(
        self,
        host: str = 'localhost',
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        ssl: bool = False
    ):
        self.redis = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            ssl=ssl,
            decode_responses=True  # For metadata
        )
        self.binary_redis = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            ssl=ssl,
            decode_responses=False  # For binary data
        )
        
        # Cache configuration
        self.default_ttl = timedelta(days=7)  # Cache avatars for 7 days
        self.metadata_prefix = 'avatar:meta:'
        self.data_prefix = 'avatar:data:'
    
    def _get_metadata_key(self, user_id: int) -> str:
        """Get Redis key for avatar metadata."""
        return f"{self.metadata_prefix}{user_id}"
    
    def _get_data_key(self, user_id: int) -> str:
        """Get Redis key for avatar binary data."""
        return f"{self.data_prefix}{user_id}"
    
    def _compute_hash(self, data: bytes) -> str:
        """Compute SHA-256 hash of avatar data."""
        return hashlib.sha256(data).hexdigest()
    
    def get_avatar(self, user_id: int) -> Optional[bytes]:
        """Get avatar from cache."""
        try:
            # Get avatar binary data
            avatar_data = self.binary_redis.get(self._get_data_key(user_id))
            if not avatar_data:
                return None
            
            # Get and update metadata
            metadata = self.get_metadata(user_id)
            if metadata:
                # Verify data integrity
                if self._compute_hash(avatar_data) != metadata.get('hash'):
                    logger.warning(f"Avatar data corruption detected for user {user_id}")
                    self.delete_avatar(user_id)
                    return None
                
                # Update access timestamp
                metadata['last_accessed'] = datetime.utcnow().isoformat()
                self.redis.set(
                    self._get_metadata_key(user_id),
                    json.dumps(metadata),
                    ex=int(self.default_ttl.total_seconds())
                )
            
            return avatar_data
            
        except Exception as e:
            logger.error(f"Failed to get avatar from cache: {str(e)}")
            return None
    
    def set_avatar(
        self,
        user_id: int,
        avatar_data: bytes,
        style_name: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Store avatar in cache."""
        try:
            # Compute data hash
            data_hash = self._compute_hash(avatar_data)
            
            # Prepare metadata
            meta = {
                'user_id': user_id,
                'style': style_name,
                'hash': data_hash,
                'size': len(avatar_data),
                'created_at': datetime.utcnow().isoformat(),
                'last_accessed': datetime.utcnow().isoformat(),
                **metadata or {}
            }
            
            # Store data and metadata
            pipe = self.redis.pipeline()
            
            # Store binary data
            self.binary_redis.set(
                self._get_data_key(user_id),
                avatar_data,
                ex=int(self.default_ttl.total_seconds())
            )
            
            # Store metadata
            pipe.set(
                self._get_metadata_key(user_id),
                json.dumps(meta),
                ex=int(self.default_ttl.total_seconds())
            )
            
            pipe.execute()
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache avatar: {str(e)}")
            return False
    
    def get_metadata(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get avatar metadata from cache."""
        try:
            data = self.redis.get(self._get_metadata_key(user_id))
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get avatar metadata: {str(e)}")
            return None
    
    def delete_avatar(self, user_id: int) -> bool:
        """Delete avatar from cache."""
        try:
            pipe = self.redis.pipeline()
            pipe.delete(self._get_metadata_key(user_id))
            pipe.delete(self._get_data_key(user_id))
            pipe.execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete avatar: {str(e)}")
            return False
    
    def clear_expired(self) -> int:
        """Clear expired avatars from cache."""
        try:
            # Get all avatar keys
            meta_keys = self.redis.keys(f"{self.metadata_prefix}*")
            data_keys = self.redis.keys(f"{self.data_prefix}*")
            
            # Delete expired keys
            deleted = 0
            for key in meta_keys + data_keys:
                if not self.redis.ttl(key):
                    self.redis.delete(key)
                    deleted += 1
            
            return deleted
            
        except Exception as e:
            logger.error(f"Failed to clear expired avatars: {str(e)}")
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        try:
            meta_keys = self.redis.keys(f"{self.metadata_prefix}*")
            data_keys = self.redis.keys(f"{self.data_prefix}*")
            
            total_size = 0
            for key in data_keys:
                size = self.redis.memory_usage(key)
                if size:
                    total_size += size
            
            return {
                'total_avatars': len(data_keys),
                'total_size_bytes': total_size,
                'metadata_count': len(meta_keys),
                'data_count': len(data_keys)
            }
            
        except Exception as e:
            logger.error(f"Failed to get cache stats: {str(e)}")
            return {} 