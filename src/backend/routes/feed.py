from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..dependencies import get_db, get_current_user
from ...services.feed_service import FeedService
from ...models.feed import FeedEntry

router = APIRouter()

@router.get("/api/v1/feed")
async def get_feed(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    since: Optional[datetime] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    Get the activity feed for the current user
    
    Args:
        limit: Maximum number of entries to return (1-100)
        offset: Number of entries to skip
        since: Only return entries newer than this datetime
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Dictionary containing feed entries and pagination info
    """
    try:
        feed_service = FeedService(db)
        entries = feed_service.get_feed(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            since=since
        )
        
        # Convert entries to dictionaries
        feed_data = [entry.to_dict() for entry in entries]
        
        return {
            "status": "success",
            "data": {
                "entries": feed_data,
                "pagination": {
                    "limit": limit,
                    "offset": offset,
                    "has_more": len(feed_data) == limit
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching feed: {str(e)}"
        )

@router.post("/api/v1/feed")
async def create_feed_entry(
    entry_type: str,
    content: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    Create a new feed entry
    
    Args:
        entry_type: Type of feed entry
        content: Content of the feed entry
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Dictionary containing the created feed entry
    """
    try:
        feed_service = FeedService(db)
        entry = feed_service.add_feed_entry(
            user_id=current_user.id,
            entry_type=entry_type,
            content=content
        )
        
        return {
            "status": "success",
            "data": entry.to_dict()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating feed entry: {str(e)}"
        ) 