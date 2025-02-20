from flask_caching import Cache
from flask_caching import Cache
from celery import shared_task
from celery.schedules import crontab
from celery.utils.log import get_task_logger

from ..core.ranking.global_ranking import GlobalRankingService
from ..extensions import db
from ..models.user import User

logger = get_task_logger(__name__)
ranking_service = GlobalRankingService()


@shared_task
def update_global_rankings():
    """Update global rankings for all players."""
    logger.info("Starting global rankings update")
    try:
        success = ranking_service.update_global_rankings()
        if success:
            logger.info("Global rankings updated successfully")
        else:
            logger.info("Global rankings update skipped - too soon since last update")
        return success
    except Exception as e:
        logger.error(f"Error updating global rankings: {str(e)}")
        raise


@shared_task
def cleanup_inactive_rankings():
    """Clean up rankings for inactive players."""
    logger.info("Starting inactive rankings cleanup")
    try:
        # Get all inactive users with rankings
        inactive_users = User.query.filter(
            User.is_active == False, User.global_rating.isnot(None)
        ).all()

        # Reset their ranking data
        for user in inactive_users:
            user.global_rating = None
            user.global_rank = None
            user.rank_tier = None
            user.rank_tier_color = None
            user.rank_movement = 0
            user.rank_streak = 0
            user.rank_streak_type = None

        db.session.commit()
        logger.info(f"Cleaned up rankings for {len(inactive_users)} inactive users")
        return True
    except Exception as e:
        logger.error(f"Error cleaning up inactive rankings: {str(e)}")
        raise


# Schedule configuration
CELERY_BEAT_SCHEDULE = {
    "update-global-rankings": {
        "task": "dojopool.tasks.ranking_tasks.update_global_rankings",
        "schedule": crontab(hour="*/6"),  # Run every 6 hours
    },
    "cleanup-inactive-rankings": {
        "task": "dojopool.tasks.ranking_tasks.cleanup_inactive_rankings",
        "schedule": crontab(hour=0, minute=0),  # Run daily at midnight
    },
}
