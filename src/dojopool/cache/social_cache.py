from django.core.cache import cache
from django.conf import settings
from typing import Optional, List, Dict, Any
import json
from datetime import timedelta


class SocialCache:
    """Cache layer for social feed data using Redis"""

    # Cache keys
    FEED_KEY = "user:{}:feed"
    POST_KEY = "post:{}"
    SUGGESTIONS_KEY = "user:{}:suggestions"
    FRIENDS_KEY = "user:{}:friends"
    MUTUAL_KEY = "users:{}:{}:mutual"
    TRENDING_KEY = "trending:posts"

    # Cache timeouts (in seconds)
    FEED_TIMEOUT = 300  # 5 minutes
    POST_TIMEOUT = 3600  # 1 hour
    SUGGESTIONS_TIMEOUT = 1800  # 30 minutes
    FRIENDS_TIMEOUT = 3600  # 1 hour
    MUTUAL_TIMEOUT = 3600  # 1 hour
    TRENDING_TIMEOUT = 900  # 15 minutes

    @classmethod
    def get_feed(cls, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get user's feed from cache"""
        key = cls.FEED_KEY.format(user_id)
        data = cache.get(key)
        return json.loads(data) if data else None

    @classmethod
    def set_feed(cls, user_id: str, feed_items: List[Dict[str, Any]]) -> None:
        """Cache user's feed"""
        key = cls.FEED_KEY.format(user_id)
        cache.set(key, json.dumps(feed_items), cls.FEED_TIMEOUT)

    @classmethod
    def get_post(cls, post_id: str) -> Optional[Dict[str, Any]]:
        """Get post data from cache"""
        key = cls.POST_KEY.format(post_id)
        data = cache.get(key)
        return json.loads(data) if data else None

    @classmethod
    def set_post(cls, post_id: str, post_data: Dict[str, Any]) -> None:
        """Cache post data"""
        key = cls.POST_KEY.format(post_id)
        cache.set(key, json.dumps(post_data), cls.POST_TIMEOUT)

    @classmethod
    def update_post(cls, post_id: str, updates: Dict[str, Any]) -> None:
        """Update specific fields of a cached post"""
        post_data = cls.get_post(post_id)
        if post_data:
            post_data.update(updates)
            cls.set_post(post_id, post_data)

    @classmethod
    def get_suggestions(cls, user_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get friend suggestions from cache"""
        key = cls.SUGGESTIONS_KEY.format(user_id)
        data = cache.get(key)
        return json.loads(data) if data else None

    @classmethod
    def set_suggestions(cls, user_id: str, suggestions: List[Dict[str, Any]]) -> None:
        """Cache friend suggestions"""
        key = cls.SUGGESTIONS_KEY.format(user_id)
        cache.set(key, json.dumps(suggestions), cls.SUGGESTIONS_TIMEOUT)

    @classmethod
    def get_friends(cls, user_id: str) -> Optional[List[str]]:
        """Get user's friend IDs from cache"""
        key = cls.FRIENDS_KEY.format(user_id)
        data = cache.get(key)
        return json.loads(data) if data else None

    @classmethod
    def set_friends(cls, user_id: str, friend_ids: List[str]) -> None:
        """Cache user's friend IDs"""
        key = cls.FRIENDS_KEY.format(user_id)
        cache.set(key, json.dumps(friend_ids), cls.FRIENDS_TIMEOUT)

    @classmethod
    def add_friend(cls, user_id: str, friend_id: str) -> None:
        """Add friend to user's friends list in cache"""
        friends = cls.get_friends(user_id) or []
        if friend_id not in friends:
            friends.append(friend_id)
            cls.set_friends(user_id, friends)

    @classmethod
    def remove_friend(cls, user_id: str, friend_id: str) -> None:
        """Remove friend from user's friends list in cache"""
        friends = cls.get_friends(user_id) or []
        if friend_id in friends:
            friends.remove(friend_id)
            cls.set_friends(user_id, friends)

    @classmethod
    def get_mutual_info(cls, user1_id: str, user2_id: str) -> Optional[Dict[str, Any]]:
        """Get mutual information between two users from cache"""
        key = cls.MUTUAL_KEY.format(min(user1_id, user2_id), max(user1_id, user2_id))
        data = cache.get(key)
        return json.loads(data) if data else None

    @classmethod
    def set_mutual_info(cls, user1_id: str, user2_id: str, info: Dict[str, Any]) -> None:
        """Cache mutual information between two users"""
        key = cls.MUTUAL_KEY.format(min(user1_id, user2_id), max(user1_id, user2_id))
        cache.set(key, json.dumps(info), cls.MUTUAL_TIMEOUT)

    @classmethod
    def get_trending_posts(cls) -> Optional[List[str]]:
        """Get trending post IDs from cache"""
        data = cache.get(cls.TRENDING_KEY)
        return json.loads(data) if data else None

    @classmethod
    def set_trending_posts(cls, post_ids: List[str]) -> None:
        """Cache trending post IDs"""
        cache.set(cls.TRENDING_KEY, json.dumps(post_ids), cls.TRENDING_TIMEOUT)

    @classmethod
    def invalidate_feed(cls, user_id: str) -> None:
        """Invalidate user's feed cache"""
        cache.delete(cls.FEED_KEY.format(user_id))

    @classmethod
    def invalidate_post(cls, post_id: str) -> None:
        """Invalidate post cache"""
        cache.delete(cls.POST_KEY.format(post_id))

    @classmethod
    def invalidate_suggestions(cls, user_id: str) -> None:
        """Invalidate user's suggestions cache"""
        cache.delete(cls.SUGGESTIONS_KEY.format(user_id))

    @classmethod
    def invalidate_friends(cls, user_id: str) -> None:
        """Invalidate user's friends cache"""
        cache.delete(cls.FRIENDS_KEY.format(user_id))

    @classmethod
    def invalidate_mutual_info(cls, user1_id: str, user2_id: str) -> None:
        """Invalidate mutual information cache between two users"""
        key = cls.MUTUAL_KEY.format(min(user1_id, user2_id), max(user1_id, user2_id))
        cache.delete(key)

    @classmethod
    def invalidate_trending(cls) -> None:
        """Invalidate trending posts cache"""
        cache.delete(cls.TRENDING_KEY)

    @classmethod
    def add_to_feed(cls, user_id: str, post_data: Dict[str, Any]) -> None:
        """Add a new post to user's feed cache"""
        feed = cls.get_feed(user_id) or []
        feed.insert(0, post_data)  # Add to beginning of feed
        cls.set_feed(user_id, feed)

    @classmethod
    def remove_from_feed(cls, user_id: str, post_id: str) -> None:
        """Remove a post from user's feed cache"""
        feed = cls.get_feed(user_id)
        if feed:
            feed = [post for post in feed if post["id"] != post_id]
            cls.set_feed(user_id, feed)

    @classmethod
    def update_feed_post(cls, user_id: str, post_id: str, updates: Dict[str, Any]) -> None:
        """Update a post in user's feed cache"""
        feed = cls.get_feed(user_id)
        if feed:
            for post in feed:
                if post["id"] == post_id:
                    post.update(updates)
                    break
            cls.set_feed(user_id, feed)
