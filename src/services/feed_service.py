from typing import List, Optional
from sqlalchemy.orm import Session
from models.feed import FeedEntry
from datetime import datetime, timedelta

class FeedService:
    """Service for handling feed operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_feed(self, user_id: int, limit: int = 20, offset: int = 0, 
                since: Optional[datetime] = None) -> List[FeedEntry]:
        """
        Get feed entries for a user
        
        Args:
            user_id: ID of the user to get feed for
            limit: Maximum number of entries to return
            offset: Number of entries to skip
            since: Only return entries newer than this datetime
            
        Returns:
            List of feed entries
        """
        query = self.db.query(FeedEntry)
        
        # Filter by user_id
        query = query.filter(FeedEntry.user_id == user_id)
        
        # Filter by date if since is provided
        if since:
            query = query.filter(FeedEntry.created_at >= since)
            
        # Order by most recent first
        query = query.order_by(FeedEntry.created_at.desc())
        
        # Apply pagination
        query = query.offset(offset).limit(limit)
        
        return query.all()

    def add_feed_entry(self, user_id: int, entry_type: str, content: dict) -> FeedEntry:
        """
        Add a new feed entry
        
        Args:
            user_id: ID of the user creating the entry
            entry_type: Type of feed entry
            content: Content of the feed entry
            
        Returns:
            Created feed entry
        """
        entry = FeedEntry(
            user_id=user_id,
            type=entry_type,
            content=content
        )
        
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        
        return entry

    def get_recent_activity(self, user_id: int, hours: int = 24) -> List[FeedEntry]:
        """
        Get recent activity for a user
        
        Args:
            user_id: ID of the user
            hours: Number of hours to look back
            
        Returns:
            List of recent feed entries
        """
        since = datetime.utcnow() - timedelta(hours=hours)
        return self.get_feed(user_id, since=since) 