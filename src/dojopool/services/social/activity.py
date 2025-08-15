"""
Activity Service Module

This module provides services for managing user activities and generating activity feeds.
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import desc, and_, or_
from datetime import datetime, timedelta
from ..models import Activity, User, Friend, ActivityType
from ..extensions import db


class ActivityService:
    """Service for managing user activities and feeds."""

    @staticmethod
    def create_activity(activity: Activity) -> Tuple[bool, Optional[str]]:
        """Create a new activity.
        
        Args:
            activity: Activity instance to create
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            db.session.add(activity)
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def get_user_activities(
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        activity_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get activities for a specific user.
        
        Args:
            user_id: ID of the user
            page: Page number for pagination
            per_page: Number of items per page
            activity_types: Optional list of activity types to filter by
            
        Returns:
            List of activities
        """
        query = Activity.query.filter(
            and_(
                Activity.user_id == user_id,
                Activity.is_public == True
            )
        )

        if activity_types:
            query = query.filter(Activity.type.in_(activity_types))

        activities = query.order_by(desc(Activity.created_at))\
            .offset((page - 1) * per_page)\
            .limit(per_page)\
            .all()

        return [activity.to_dict() for activity in activities]

    @staticmethod
    def get_feed_activities(
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        activity_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get activities for a user's feed (including friends' activities).
        
        Args:
            user_id: ID of the user
            page: Page number for pagination
            per_page: Number of items per page
            activity_types: Optional list of activity types to filter by
            
        Returns:
            List of activities
        """
        # Get user's friends
        friend_ids = [f.friend_id for f in Friend.query.filter(
            and_(
                Friend.user_id == user_id,
                Friend.status == 'accepted'
            )
        ).all()]

        # Include user's own activities and friends' activities
        query = Activity.query.filter(
            and_(
                or_(
                    Activity.user_id == user_id,
                    Activity.user_id.in_(friend_ids)
                ),
                Activity.is_public == True
            )
        )

        if activity_types:
            query = query.filter(Activity.type.in_(activity_types))

        activities = query.order_by(desc(Activity.created_at))\
            .offset((page - 1) * per_page)\
            .limit(per_page)\
            .all()

        return [activity.to_dict() for activity in activities]

    @staticmethod
    def get_recent_activities(
        user_id: int,
        days: int = 7,
        activity_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get recent activities within a specified time period.
        
        Args:
            user_id: ID of the user
            days: Number of days to look back
            activity_types: Optional list of activity types to filter by
            
        Returns:
            List of activities
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = Activity.query.filter(
            and_(
                Activity.user_id == user_id,
                Activity.created_at >= cutoff_date,
                Activity.is_public == True
            )
        )

        if activity_types:
            query = query.filter(Activity.type.in_(activity_types))

        activities = query.order_by(desc(Activity.created_at)).all()
        return [activity.to_dict() for activity in activities]

    @staticmethod
    def get_activity_stats(user_id: int, days: int = 30) -> Dict[str, Any]:
        """Get activity statistics for a user.
        
        Args:
            user_id: ID of the user
            days: Number of days to analyze
            
        Returns:
            Dictionary of activity statistics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        activities = Activity.query.filter(
            and_(
                Activity.user_id == user_id,
                Activity.created_at >= cutoff_date
            )
        ).all()

        stats = {
            'total_activities': len(activities),
            'activities_by_type': {},
            'most_active_day': None,
            'activity_trend': []
        }

        # Count activities by type
        for activity in activities:
            activity_type = activity.type
            stats['activities_by_type'][activity_type] = stats['activities_by_type'].get(activity_type, 0) + 1

        # Find most active day
        if activities:
            activity_dates = [activity.created_at.date() for activity in activities]
            stats['most_active_day'] = max(set(activity_dates), key=activity_dates.count)

        # Calculate activity trend (activities per day)
        for i in range(days):
            date = datetime.utcnow().date() - timedelta(days=i)
            count = sum(1 for activity in activities if activity.created_at.date() == date)
            stats['activity_trend'].append({
                'date': date.isoformat(),
                'count': count
            })

        return stats

    @staticmethod
    def update_activity_visibility(activity_id: int, user_id: int, is_public: bool) -> Tuple[bool, Optional[str]]:
        """Update the visibility of an activity.
        
        Args:
            activity_id: ID of the activity
            user_id: ID of the user
            is_public: New visibility status
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            activity = Activity.query.get(activity_id)
            if not activity:
                return False, "Activity not found"
            if activity.user_id != user_id:
                return False, "Not authorized to update this activity"

            activity.is_public = is_public
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, str(e) 