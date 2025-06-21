"""
Venue Analytics Service Module

This module provides services for analyzing venue performance and generating analytics data.
"""

from datetime import datetime, timedelta
from typing import Dict, List
import logging
from sqlalchemy import func, extract  # type: ignore

from dojopool.extensions import db
from dojopool.models.venue import Venue
from dojopool.models.maintenance import Maintenance
from dojopool.models.revenue import Revenue
from dojopool.models.game import Game

logger = logging.getLogger(__name__)

class VenueAnalyticsService:
    """Service for generating venue analytics and performance metrics."""

    def __init__(self):
        """Initialize the venue analytics service."""
        self.analytics_cache = {}
        self.cache_ttl = 300  # 5 minutes cache TTL

    def get_venue_analytics(self, venue_id: int, start_date: datetime, end_date: datetime) -> Dict:
        """Get comprehensive analytics for a venue within a date range.
        
        Args:
            venue_id: ID of the venue
            start_date: Start date of the range
            end_date: End date of the range
            
        Returns:
            Dictionary containing venue analytics data
        """
        try:
            # Check cache first
            cache_key = f"{venue_id}_{start_date.isoformat()}_{end_date.isoformat()}"
            if cache_key in self.analytics_cache:
                cached_data = self.analytics_cache[cache_key]
                if datetime.utcnow() - cached_data['timestamp'] < timedelta(seconds=self.cache_ttl):
                    return cached_data['analytics']

            # Get total revenue
            total_revenue = self._get_total_revenue(venue_id, start_date, end_date)
            
            # Get total games
            total_games = self._get_total_games(venue_id, start_date, end_date)
            
            # Get average occupancy
            average_occupancy = self._get_average_occupancy(venue_id, start_date, end_date)
            
            # Get peak hours
            peak_hours = self._get_peak_hours(venue_id, start_date, end_date)
            
            # Get revenue by day
            revenue_by_day = self._get_revenue_by_day(venue_id, start_date, end_date)
            
            # Get games by day
            games_by_day = self._get_games_by_day(venue_id, start_date, end_date)
            
            # Get table utilization
            table_utilization = self._get_table_utilization(venue_id, start_date, end_date)
            
            # Get maintenance stats
            maintenance_stats = self._get_maintenance_stats(venue_id, start_date, end_date)

            analytics = {
                'totalRevenue': total_revenue,
                'totalGames': total_games,
                'averageOccupancy': average_occupancy,
                'peakHours': peak_hours,
                'revenueByDay': revenue_by_day,
                'gamesByDay': games_by_day,
                'tableUtilization': table_utilization,
                'maintenanceStats': maintenance_stats
            }

            # Update cache
            self.analytics_cache[cache_key] = {
                'analytics': analytics,
                'timestamp': datetime.utcnow()
            }

            return analytics

        except Exception as e:
            logger.error(f"Error getting venue analytics: {str(e)}")
            return {}

    def _get_total_revenue(self, venue_id: int, start_date: datetime, end_date: datetime) -> float:
        """Get total revenue for a venue within a date range."""
        try:
            total = db.session.query(func.sum(Revenue.amount)).filter(
                Revenue.venue_id == venue_id,
                Revenue.date >= start_date,
                Revenue.date <= end_date
            ).scalar()
            return float(total or 0.0)
        except Exception as e:
            logger.error(f"Error getting total revenue: {str(e)}")
            return 0.0

    def _get_total_games(self, venue_id: int, start_date: datetime, end_date: datetime) -> int:
        """Get total number of games for a venue within a date range."""
        try:
            count = db.session.query(func.count(Game.id)).filter(
                Game.venue_id == venue_id,
                Game.start_time >= start_date,
                Game.start_time <= end_date
            ).scalar()
            return count or 0
        except Exception as e:
            logger.error(f"Error getting total games: {str(e)}")
            return 0

    def _get_average_occupancy(self, venue_id: int, start_date: datetime, end_date: datetime) -> float:
        """Get average occupancy rate for a venue within a date range."""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return 0.0

            total_tables = len(venue.tables)
            if total_tables == 0:
                return 0.0

            # Calculate total occupied hours
            occupied_hours = db.session.query(
                func.sum(
                    func.extract('epoch', Game.end_time - Game.start_time) / 3600
                )
            ).filter(
                Game.venue_id == venue_id,
                Game.start_time >= start_date,
                Game.start_time <= end_date
            ).scalar() or 0

            # Calculate total available hours
            total_hours = (end_date - start_date).total_seconds() / 3600
            total_available_hours = total_hours * total_tables

            # Calculate average occupancy
            if total_available_hours > 0:
                return (occupied_hours / total_available_hours) * 100
            return 0.0

        except Exception as e:
            logger.error(f"Error getting average occupancy: {str(e)}")
            return 0.0

    def _get_peak_hours(self, venue_id: int, start_date: datetime, end_date: datetime) -> Dict[str, float]:
        """Get peak hours analysis for a venue within a date range."""
        try:
            # Get hourly game counts
            hourly_counts = db.session.query(
                extract('hour', Game.start_time).label('hour'),
                func.count(Game.id).label('count')
            ).filter(
                Game.venue_id == venue_id,
                Game.start_time >= start_date,
                Game.start_time <= end_date
            ).group_by('hour').all()

            # Get total tables
            venue = Venue.query.get(venue_id)
            total_tables = len(venue.tables) if venue else 0

            # Calculate occupancy rates
            peak_hours = {}
            for hour, count in hourly_counts:
                if total_tables > 0:
                    peak_hours[f"{int(hour):02d}:00"] = (count / total_tables) * 100
                else:
                    peak_hours[f"{int(hour):02d}:00"] = 0.0

            return peak_hours

        except Exception as e:
            logger.error(f"Error getting peak hours: {str(e)}")
            return {}

    def _get_revenue_by_day(self, venue_id: int, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Get daily revenue for a venue within a date range."""
        try:
            daily_revenue = db.session.query(
                Revenue.date.label('date'),
                func.sum(Revenue.amount).label('amount')
            ).filter(
                Revenue.venue_id == venue_id,
                Revenue.date >= start_date,
                Revenue.date <= end_date
            ).group_by(Revenue.date).all()

            return [{
                'date': date.strftime('%Y-%m-%d'),
                'amount': float(amount)
            } for date, amount in daily_revenue]
        except Exception as e:
            logger.error(f"Error getting revenue by day: {str(e)}")
            return []

    def _get_games_by_day(self, venue_id: int, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Get daily game counts for a venue within a date range."""
        try:
            daily_games = db.session.query(
                func.date(Game.start_time).label('date'),
                func.count(Game.id).label('count')
            ).filter(
                Game.venue_id == venue_id,
                Game.start_time >= start_date,
                Game.start_time <= end_date
            ).group_by('date').all()

            return [{
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            } for date, count in daily_games]

        except Exception as e:
            logger.error(f"Error getting games by day: {str(e)}")
            return []

    def _get_table_utilization(self, venue_id: int, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Get table utilization rates for a venue within a date range."""
        try:
            # Get total available hours
            total_hours = (end_date - start_date).total_seconds() / 3600

            # Get occupied hours per table
            table_utilization = db.session.query(
                Game.table_id,
                func.sum(
                    func.extract('epoch', Game.end_time - Game.start_time) / 3600
                ).label('occupied_hours')
            ).filter(
                Game.venue_id == venue_id,
                Game.start_time >= start_date,
                Game.start_time <= end_date
            ).group_by(Game.table_id).all()

            return [{
                'tableId': table_id,
                'utilization': (occupied_hours / total_hours) * 100 if total_hours > 0 else 0
            } for table_id, occupied_hours in table_utilization]

        except Exception as e:
            logger.error(f"Error getting table utilization: {str(e)}")
            return []

    def _get_maintenance_stats(self, venue_id: int, start_date: datetime, end_date: datetime) -> Dict:
        """Get maintenance statistics for a venue within a date range."""
        try:
            maintenances = db.session.query(Maintenance).filter(
                Maintenance.venue_id == venue_id,
                Maintenance.start_time >= start_date,
                Maintenance.start_time <= end_date
            ).all()
            total_maintenance = len(maintenances)
            if total_maintenance == 0:
                return {
                    'totalMaintenance': 0,
                    'averageDuration': 0.0,
                    'maintenanceByReason': {}
                }
            total_duration = sum(
                ((m.end_time or datetime.utcnow()) - m.start_time).total_seconds() for m in maintenances
            )
            average_duration = total_duration / total_maintenance / 3600  # in hours
            maintenance_by_reason = {}
            for m in maintenances:
                maintenance_by_reason.setdefault(m.reason, 0)
                maintenance_by_reason[m.reason] += 1
            return {
                'totalMaintenance': total_maintenance,
                'averageDuration': average_duration,
                'maintenanceByReason': maintenance_by_reason
            }
        except Exception as e:
            logger.error(f"Error getting maintenance stats: {str(e)}")
            return {
                'totalMaintenance': 0,
                'averageDuration': 0.0,
                'maintenanceByReason': {}
            } 