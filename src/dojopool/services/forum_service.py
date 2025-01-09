from typing import Dict, List, Any, Optional
from datetime import datetime
from slugify import slugify
from sqlalchemy import desc, or_, and_
from ..models.forum import (
    ForumCategory, ForumTopic, ForumPost,
    ForumPostReaction, ForumSubscription
)
from ..extensions import db, cache
from ..utils.pagination import paginate

CACHE_TTL = 300  # 5 minutes
CACHE_PREFIX = 'forum:'

class ForumService:
    def get_categories(self, include_private: bool = False) -> List[Dict[str, Any]]:
        """Get all forum categories."""
        cache_key = f"{CACHE_PREFIX}categories:{'all' if include_private else 'public'}"
        result = cache.get(cache_key)
        
        if result is None:
            query = ForumCategory.query
            if not include_private:
                query = query.filter_by(is_private=False)
            
            categories = query.order_by(ForumCategory.order).all()
            result = [cat.to_dict() for cat in categories]
            cache.set(cache_key, result, timeout=CACHE_TTL)
        
        return result

    def get_category(self, category_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific category by ID."""
        cache_key = f"{CACHE_PREFIX}category:{category_id}"
        result = cache.get(cache_key)
        
        if result is None:
            category = ForumCategory.query.get(category_id)
            if category:
                result = category.to_dict()
                cache.set(cache_key, result, timeout=CACHE_TTL)
        
        return result

    def get_topics(
        self,
        category_id: Optional[int] = None,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = 'last_post'
    ) -> Dict[str, Any]:
        """Get topics with pagination."""
        query = ForumTopic.query
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        # Apply sorting
        if sort_by == 'last_post':
            query = query.order_by(desc(ForumTopic.last_post_at))
        elif sort_by == 'created':
            query = query.order_by(desc(ForumTopic.created_at))
        elif sort_by == 'views':
            query = query.order_by(desc(ForumTopic.view_count))
        
        # Get pinned topics first
        pinned_query = query.filter_by(is_pinned=True)
        regular_query = query.filter_by(is_pinned=False)
        
        # Paginate regular topics
        pagination = paginate(regular_query, page, per_page)
        
        # Combine pinned and regular topics
        topics = pinned_query.all() + pagination.items
        
        return {
            'topics': [topic.to_dict() for topic in topics],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }

    def get_topic(self, topic_id: int, increment_view: bool = True) -> Optional[Dict[str, Any]]:
        """Get a specific topic by ID."""
        topic = ForumTopic.query.get(topic_id)
        if not topic:
            return None
            
        if increment_view:
            topic.view_count += 1
            db.session.commit()
            cache.delete(f"{CACHE_PREFIX}topic:{topic_id}")
        
        return topic.to_dict()

    def create_topic(
        self,
        user_id: int,
        category_id: int,
        title: str,
        content: str
    ) -> Dict[str, Any]:
        """Create a new topic with initial post."""
        # Create topic
        slug = slugify(title)
        base_slug = slug
        counter = 1
        
        # Ensure unique slug
        while ForumTopic.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        topic = ForumTopic(
            title=title,
            slug=slug,
            category_id=category_id,
            user_id=user_id
        )
        db.session.add(topic)
        db.session.flush()  # Get topic ID
        
        # Create initial post
        post = ForumPost(
            topic_id=topic.id,
            user_id=user_id,
            content=content
        )
        db.session.add(post)
        
        # Update topic's last post info
        topic.last_post_at = datetime.utcnow()
        topic.last_post_user_id = user_id
        
        db.session.commit()
        
        # Invalidate caches
        cache.delete_many([
            f"{CACHE_PREFIX}category:{category_id}",
            f"{CACHE_PREFIX}topics:{category_id}"
        ])
        
        return topic.to_dict()

    def create_post(
        self,
        user_id: int,
        topic_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Create a new post in a topic."""
        topic = ForumTopic.query.get(topic_id)
        if not topic:
            raise ValueError("Topic not found")
            
        if topic.is_locked:
            raise ValueError("Topic is locked")
        
        post = ForumPost(
            topic_id=topic_id,
            user_id=user_id,
            content=content
        )
        db.session.add(post)
        
        # Update topic's last post info
        topic.last_post_at = datetime.utcnow()
        topic.last_post_user_id = user_id
        
        db.session.commit()
        
        # Invalidate caches
        cache.delete_many([
            f"{CACHE_PREFIX}topic:{topic_id}",
            f"{CACHE_PREFIX}posts:{topic_id}"
        ])
        
        # Notify subscribers
        self._notify_subscribers(topic, post)
        
        return post.to_dict()

    def get_posts(
        self,
        topic_id: int,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Get posts for a topic with pagination."""
        query = ForumPost.query.filter_by(topic_id=topic_id)
        pagination = paginate(query.order_by(ForumPost.created_at), page, per_page)
        
        return {
            'posts': [post.to_dict() for post in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }

    def add_reaction(
        self,
        user_id: int,
        post_id: int,
        reaction_type: str
    ) -> Dict[str, Any]:
        """Add a reaction to a post."""
        existing = ForumPostReaction.query.filter_by(
            post_id=post_id,
            user_id=user_id,
            reaction_type=reaction_type
        ).first()
        
        if existing:
            db.session.delete(existing)
            db.session.commit()
            return {'status': 'removed'}
        
        reaction = ForumPostReaction(
            post_id=post_id,
            user_id=user_id,
            reaction_type=reaction_type
        )
        db.session.add(reaction)
        db.session.commit()
        
        return reaction.to_dict()

    def subscribe(
        self,
        user_id: int,
        topic_id: Optional[int] = None,
        category_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Subscribe to a topic or category."""
        if not topic_id and not category_id:
            raise ValueError("Must provide either topic_id or category_id")
            
        existing = ForumSubscription.query.filter_by(
            user_id=user_id,
            topic_id=topic_id,
            category_id=category_id
        ).first()
        
        if existing:
            db.session.delete(existing)
            db.session.commit()
            return {'status': 'unsubscribed'}
        
        subscription = ForumSubscription(
            user_id=user_id,
            topic_id=topic_id,
            category_id=category_id
        )
        db.session.add(subscription)
        db.session.commit()
        
        return subscription.to_dict()

    def _notify_subscribers(self, topic: ForumTopic, post: ForumPost) -> None:
        """Notify topic and category subscribers about new post."""
        # Get unique subscribers (both topic and category)
        subscribers = ForumSubscription.query.filter(
            or_(
                ForumSubscription.topic_id == topic.id,
                ForumSubscription.category_id == topic.category_id
            ),
            ForumSubscription.user_id != post.user_id  # Don't notify the poster
        ).all()
        
        # Create notifications (implement notification system as needed)
        for sub in subscribers:
            self._create_notification(
                user_id=sub.user_id,
                topic=topic,
                post=post
            )

    def _create_notification(
        self,
        user_id: int,
        topic: ForumTopic,
        post: ForumPost
    ) -> None:
        """Create a notification for a user about a new post."""
        # Implement notification creation based on your notification system
        pass 