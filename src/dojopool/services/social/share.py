"""
Social Sharing Service Module

This module provides services for managing social sharing functionality.
"""

from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from ..models import Share, User, ShareType
from ..extensions import db
from sqlalchemy import and_


class ShareService:
    """Service for managing social sharing functionality."""

    @staticmethod
    def create_share(
        user_id: int,
        content_type: ShareType,
        content_id: int,
        title: str,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Optional[str], Optional[Share]]:
        """Create a new shareable content.
        
        Args:
            user_id: ID of the user creating the share
            content_type: Type of content being shared
            content_id: ID of the content being shared
            title: Title of the share
            description: Optional description
            metadata: Optional additional metadata
            
        Returns:
            Tuple of (success, error_message, share)
        """
        try:
            share = Share(
                user_id=user_id,
                content_type=content_type,
                content_id=content_id,
                title=title,
                description=description,
                metadata=metadata
            )
            db.session.add(share)
            db.session.commit()
            return True, None, share
        except Exception as e:
            db.session.rollback()
            return False, str(e), None

    @staticmethod
    def get_share(share_id: int) -> Optional[Share]:
        """Get a share by ID.
        
        Args:
            share_id: ID of the share to retrieve
            
        Returns:
            Share object if found, None otherwise
        """
        return Share.query.get(share_id)

    @staticmethod
    def get_user_shares(
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        content_types: Optional[List[ShareType]] = None
    ) -> List[Dict[str, Any]]:
        """Get shares created by a user.
        
        Args:
            user_id: ID of the user
            page: Page number for pagination
            per_page: Number of items per page
            content_types: Optional list of content types to filter by
            
        Returns:
            List of shares
        """
        query = Share.query.filter(Share.user_id == user_id)
        
        if content_types:
            query = query.filter(Share.content_type.in_(content_types))
            
        shares = query.order_by(Share.created_at.desc())\
            .offset((page - 1) * per_page)\
            .limit(per_page)\
            .all()
            
        return [share.to_dict() for share in shares]

    @staticmethod
    def get_shared_content(
        content_type: ShareType,
        content_id: int,
        page: int = 1,
        per_page: int = 20
    ) -> List[Dict[str, Any]]:
        """Get all shares for a specific piece of content.
        
        Args:
            content_type: Type of content
            content_id: ID of the content
            page: Page number for pagination
            per_page: Number of items per page
            
        Returns:
            List of shares
        """
        shares = Share.query.filter(
            and_(
                Share.content_type == content_type,
                Share.content_id == content_id
            )
        ).order_by(Share.created_at.desc())\
            .offset((page - 1) * per_page)\
            .limit(per_page)\
            .all()
            
        return [share.to_dict() for share in shares]

    @staticmethod
    def delete_share(share_id: int, user_id: int) -> Tuple[bool, Optional[str]]:
        """Delete a share.
        
        Args:
            share_id: ID of the share to delete
            user_id: ID of the user requesting deletion
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            share = Share.query.get(share_id)
            if not share:
                return False, "Share not found"
            if share.user_id != user_id:
                return False, "Not authorized to delete this share"
                
            db.session.delete(share)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def generate_share_url(share_id: int) -> str:
        """Generate a shareable URL for a share.
        
        Args:
            share_id: ID of the share
            
        Returns:
            Shareable URL
        """
        return f"/share/{share_id}"

    @staticmethod
    def generate_social_share_data(share: Share) -> Dict[str, Any]:
        """Generate data for social media sharing.
        
        Args:
            share: Share object
            
        Returns:
            Dictionary containing share data formatted for social media
        """
        return {
            'title': share.title,
            'description': share.description or '',
            'url': ShareService.generate_share_url(share.id),
            'type': share.content_type.value,
            'metadata': share.metadata or {}
        } 