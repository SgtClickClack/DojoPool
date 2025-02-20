from flask_caching import Cache
from flask_caching import Cache
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from slugify import slugify
from sqlalchemy import ForeignKey, desc, or_
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import cache, db
from ..models.forum import (
    ForumCategory,
    ForumPost,
    ForumPostReaction,
    ForumSubscription,
    ForumTopic,
)
from ..utils.pagination import paginate

CACHE_TTL: int = 300  # 5 minutes
CACHE_PREFIX: str = "forum:"


class ForumService:
    def get_categories(self, include_private: bool = False) -> List[Dict[str, Any]]:
        """Get all forum categories."""
        cache_key: Any = (
            f"{CACHE_PREFIX}categories:{'all' if include_private else 'public'}"
        )
        result: Any = cache.get(cache_key)

        if result is None:
            query: Any = ForumCategory.query
            if not include_private:
                query: Any = query.filter_by(is_private=False)

            categories: Any = query.order_by(ForumCategory.order).all()
            result: Any = [cat.to_dict() for cat in categories]
            cache.set(cache_key, result, timeout=CACHE_TTL)

        return result

    def get_category(self, category_id: int):
        """Get a specific category by ID."""
        cache_key: Any = f"{CACHE_PREFIX}category:{category_id}"
        result: Any = cache.get(cache_key)

        if result is None:
            category = ForumCategory.query.get(category_id)
            if category:
                result: Any = category.to_dict()
                cache.set(cache_key, result, timeout=CACHE_TTL)

        return result

    def get_topics(
        self,
        category_id: Optional[int] = None,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "last_post",
    ):
        """Get topics with pagination."""
        query: Any = ForumTopic.query

        if category_id:
            query: Any = query.filter_by(category_id=category_id)

        # Apply sorting
        if sort_by == "last_post":
            query: Any = query.order_by(desc(ForumTopic.last_post_at))
        elif sort_by == "created":
            query: Any = query.order_by(desc(ForumTopic.created_at))
        elif sort_by == "views":
            query: Any = query.order_by(desc(ForumTopic.view_count))

        # Get pinned topics first
        pinned_query: Any = query.filter_by(is_pinned=True)
        regular_query: Any = query.filter_by(is_pinned=False)

        # Paginate regular topics
        pagination: paginate = paginate(regular_query, page, per_page)

        # Combine pinned and regular topics
        topics: Any = pinned_query.all() + pagination.items

        return {
            "topics": [topic.to_dict() for topic in topics],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": pagination.total,
                "pages": pagination.pages,
            },
        }

    def get_topic(self, topic_id: int, increment_view: bool = True):
        """Get a specific topic by ID."""
        topic: Any = ForumTopic.query.get(topic_id)
        if not topic:
            return None

        if increment_view:
            topic.view_count += 1
            db.session.commit()
            cache.delete(f"{CACHE_PREFIX}topic:{topic_id}")

        return topic.to_dict()

    def create_topic(
        self, user_id: int, category_id: int, title: str, content: str
    ) -> Dict[str, Any]:
        """Create a new topic with initial post."""
        # Create topic
        slug: slugify = slugify(title)
        base_slug: slugify = slug
        counter: int = 1

        # Ensure unique slug
        while ForumTopic.query.filter_by(slug=slug).first():
            slug: slugify = f"{base_slug}-{counter}"
            counter += 1

        topic: Any = ForumTopic(
            title=title, slug=slug, category_id=category_id, user_id=user_id
        )
        db.session.add(topic)
        db.session.flush()  # Get topic ID

        # Create initial post
        post: ForumPost = ForumPost(topic_id=topic.id, user_id=user_id, content=content)
        db.session.add(post)

        # Update topic's last post info
        topic.last_post_at = datetime.utcnow()
        topic.last_post_user_id = user_id

        db.session.commit()

        # Invalidate caches
        cache.delete_many(
            [
                f"{CACHE_PREFIX}category:{category_id}",
                f"{CACHE_PREFIX}topics:{category_id}",
            ]
        )

        return topic.to_dict()

    def create_post(self, user_id: int, topic_id: int, content: str) -> Dict[str, Any]:
        """Create a new post in a topic."""
        topic: Any = ForumTopic.query.get(topic_id)
        if not topic:
            raise ValueError("Topic not found")

        if topic.is_locked:
            raise ValueError("Topic is locked")

        post: ForumPost = ForumPost(topic_id=topic_id, user_id=user_id, content=content)
        db.session.add(post)

        # Update topic's last post info
        topic.last_post_at = datetime.utcnow()
        topic.last_post_user_id = user_id

        db.session.commit()

        # Invalidate caches
        cache.delete_many(
            [f"{CACHE_PREFIX}topic:{topic_id}", f"{CACHE_PREFIX}posts:{topic_id}"]
        )

        # Notify subscribers
        self._notify_subscribers(topic, post)

        return post.to_dict()

    def get_posts(self, topic_id: int, page: int = 1, per_page: int = 20):
        """Get posts for a topic with pagination."""
        query: Any = ForumPost.query.filter_by(topic_id=topic_id)
        pagination: paginate = paginate(
            query.order_by(ForumPost.created_at), page, per_page
        )

        return {
            "posts": [post.to_dict() for post in pagination.items],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": pagination.total,
                "pages": pagination.pages,
            },
        }

    def add_reaction(self, user_id: int, post_id: int, reaction_type: str):
        """Add a reaction to a post."""
        existing: Any = ForumPostReaction.query.filter_by(
            post_id=post_id, user_id=user_id, reaction_type=reaction_type
        ).first()

        if existing:
            db.session.delete(existing)
            db.session.commit()
            return {"status": "removed"}

        reaction: ForumPostReaction = ForumPostReaction(
            post_id=post_id, user_id=user_id, reaction_type=reaction_type
        )
        db.session.add(reaction)
        db.session.commit()

        return reaction.to_dict()

    def subscribe(
        self,
        user_id: int,
        topic_id: Optional[int] = None,
        category_id: Optional[int] = None,
    ):
        """Subscribe to a topic or category."""
        if not topic_id and not category_id:
            raise ValueError("Must provide either topic_id or category_id")

        existing: Any = ForumSubscription.query.filter_by(
            user_id=user_id, topic_id=topic_id, category_id=category_id
        ).first()

        if existing:
            db.session.delete(existing)
            db.session.commit()
            return {"status": "unsubscribed"}

        subscription: ForumSubscription = ForumSubscription(
            user_id=user_id, topic_id=topic_id, category_id=category_id
        )
        db.session.add(subscription)
        db.session.commit()

        return subscription.to_dict()

    def _notify_subscribers(self, topic: ForumTopic, post: ForumPost) -> None:
        """Notify topic and category subscribers about new post."""
        # Get unique subscribers (both topic and category)
        subscribers: Any = ForumSubscription.query.filter(
            or_(
                ForumSubscription.topic_id == topic.id,
                ForumSubscription.category_id == topic.category_id,
            ),
            ForumSubscription.user_id != post.user_id,  # Don't notify the poster
        ).all()

        # Create notifications (implement notification system as needed)
        for sub in subscribers:
            self._create_notification(user_id=sub.user_id, topic=topic, post=post)

    def _create_notification(self, user_id: int, topic: ForumTopic, post: ForumPost):
        """Create a notification for a user about a new post."""
        # Implement notification creation based on your notification system
        pass
