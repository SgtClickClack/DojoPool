"""Feed service module for managing user activity feed entries."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from ..models.feed import FeedEntry


class FeedService:
    """Service class for managing feed entries."""

    def __init__(self, session: Session):
        """Initialize the feed service.
        
        Args:
            session: SQLAlchemy session instance
        """
        self.session = session

    def get_feed(
        self,
        user_id: int,
        limit: int = 20,
        offset: int = 0,
        since: Optional[datetime] = None
    ) -> List[FeedEntry]:
        """Get feed entries for a user.
        
        Args:
            user_id: ID of the user to get feed for
            limit: Maximum number of entries to return
            offset: Number of entries to skip
            since: Only return entries after this timestamp
            
        Returns:
            List of feed entries
        """
        query = FeedEntry.query.filter_by(user_id=user_id)
        
        if since:
            query = query.filter(FeedEntry.created_at >= since)
            
        return query.order_by(FeedEntry.created_at.desc()) \
                   .limit(limit) \
                   .offset(offset) \
                   .all()

    def add_feed_entry(
        self,
        user_id: int,
        entry_type: str,
        content: str
    ) -> FeedEntry:
        """Add a new feed entry.
        
        Args:
            user_id: ID of the user creating the entry
            entry_type: Type of feed entry (e.g. 'post', 'achievement', etc.)
            content: Content of the feed entry
            
        Returns:
            The created feed entry
        """
        entry = FeedEntry(
            user_id=user_id,
            type=entry_type,
            content=content
        )
        self.session.add(entry)
        self.session.commit()
        return entry 