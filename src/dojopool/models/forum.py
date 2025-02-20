from datetime import datetime

from ..core.extensions import db


class ForumCategory(db.Model):
    """Forum category model."""

    __tablename__ = "forum_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    order = db.Column(db.Integer, default=0)
    is_private = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    topics = db.relationship("ForumTopic", backref="category", lazy="dynamic")

    def to_dict(self) -> dict:
        """Convert category to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "slug": self.slug,
            "order": self.order,
            "is_private": self.is_private,
            "topic_count": self.topics.count(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class ForumTopic(db.Model):
    """Forum topic model."""

    __tablename__ = "forum_topics"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    category_id = db.Column(
        db.Integer, db.ForeignKey("forum_categories.id"), nullable=False
    )
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    is_locked = db.Column(db.Boolean, default=False)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_post_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_post_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    # Relationships
    posts = db.relationship("ForumPost", backref="topic", lazy="dynamic")
    user = db.relationship("User", foreign_keys=[user_id], backref="forum_topics")
    last_post_user = db.relationship("User", foreign_keys=[last_post_user_id])

    def to_dict(self):
        """Convert topic to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "category_id": self.category_id,
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "avatar_url": self.user.avatar_url,
            },
            "is_pinned": self.is_pinned,
            "is_locked": self.is_locked,
            "view_count": self.view_count,
            "post_count": self.posts.count(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_post_at": self.last_post_at.isoformat(),
            "last_post_user": (
                {
                    "id": self.last_post_user.id,
                    "username": self.last_post_user.username,
                    "avatar_url": self.last_post_user.avatar_url,
                }
                if self.last_post_user
                else None
            ),
        }


class ForumPost(db.Model):
    """Forum post model."""

    __tablename__ = "forum_posts"

    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey("forum_topics.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_edited = db.Column(db.Boolean, default=False)
    edited_at = db.Column(db.DateTime)
    edited_by_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = db.relationship("User", foreign_keys=[user_id], backref="forum_posts")
    edited_by = db.relationship("User", foreign_keys=[edited_by_id])
    reactions = db.relationship("ForumPostReaction", backref="post", lazy="dynamic")

    def to_dict(self):
        """Convert post to dictionary."""
        return {
            "id": self.id,
            "topic_id": self.topic_id,
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "avatar_url": self.user.avatar_url,
            },
            "content": self.content,
            "is_edited": self.is_edited,
            "edited_at": self.edited_at.isoformat() if self.edited_at else None,
            "edited_by": (
                {"id": self.edited_by.id, "username": self.edited_by.username}
                if self.edited_by
                else None
            ),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "reactions": [r.to_dict() for r in self.reactions],
        }


class ForumPostReaction(db.Model):
    """Forum post reaction model."""

    __tablename__ = "forum_post_reactions"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("forum_posts.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reaction_type = db.Column(
        db.String(20), nullable=False
    )  # like, helpful, funny, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="forum_reactions")

    def to_dict(self):
        """Convert reaction to dictionary."""
        return {
            "id": self.id,
            "post_id": self.post_id,
            "user": {"id": self.user.id, "username": self.user.username},
            "reaction_type": self.reaction_type,
            "created_at": self.created_at.isoformat(),
        }


# Forum subscription for notifications
class ForumSubscription(db.Model):
    """Forum subscription model for notifications."""

    __tablename__ = "forum_subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey("forum_topics.id"))
    category_id = db.Column(db.Integer, db.ForeignKey("forum_categories.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="forum_subscriptions")
    topic = db.relationship("ForumTopic", backref="subscriptions")
    category = db.relationship("ForumCategory", backref="subscriptions")

    def to_dict(self) -> dict:
        """Convert subscription to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "topic_id": self.topic_id,
            "category_id": self.category_id,
            "created_at": self.created_at.isoformat(),
        }
