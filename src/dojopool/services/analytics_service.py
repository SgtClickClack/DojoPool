from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import desc, func

from ..core.extensions import cache, db
from ..core.models.analytics import (
    AggregatedMetrics,
    FeatureUsageMetrics,
    GameMetrics,
    PerformanceMetrics,
    UserMetrics,
    VenueMetrics,
)

CACHE_TTL = 300  # 5 minutes
CACHE_PREFIX = "analytics:"


class AnalyticsService:
    def track_user_metric(
        self,
        user_id: int,
        metric_type: str,
        value: float,
        period: str = "daily",
        metric_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Track a user-related metric."""
        metric_date = metric_date or date.today()

        metric = UserMetrics(
            user_id=user_id, metric_type=metric_type, value=value, period=period, date=metric_date
        )
        db.session.add(metric)
        db.session.commit()

        # Invalidate relevant caches
        cache.delete_many(
            [
                f"{CACHE_PREFIX}user:{user_id}:{metric_type}:{period}",
                f"{CACHE_PREFIX}user:{user_id}:all",
            ]
        )

        return metric.to_dict()

    def track_game_metric(self, game_id: int, metric_type: str, value: float) -> Dict[str, Any]:
        """Track a game-related metric."""
        metric = GameMetrics(game_id=game_id, metric_type=metric_type, value=value)
        db.session.add(metric)
        db.session.commit()

        # Invalidate relevant caches
        cache.delete(f"{CACHE_PREFIX}game:{game_id}:metrics")

        return metric.to_dict()

    def track_venue_metric(
        self,
        venue_id: int,
        metric_type: str,
        value: float,
        period: str = "daily",
        metric_date: Optional[date] = None,
        hour: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Track a venue-related metric."""
        metric_date = metric_date or date.today()

        metric = VenueMetrics(
            venue_id=venue_id,
            metric_type=metric_type,
            value=value,
            period=period,
            date=metric_date,
            hour=hour,
        )
        db.session.add(metric)
        db.session.commit()

        # Invalidate relevant caches
        cache.delete_many(
            [
                f"{CACHE_PREFIX}venue:{venue_id}:{metric_type}:{period}",
                f"{CACHE_PREFIX}venue:{venue_id}:all",
            ]
        )

        return metric.to_dict()

    def track_feature_usage(
        self, feature_name: str, user_id: int, action: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Track feature usage metrics."""
        metric = FeatureUsageMetrics(
            feature_name=feature_name, user_id=user_id, action=action, context=context
        )
        db.session.add(metric)
        db.session.commit()

        # Invalidate relevant caches
        cache.delete_many(
            [
                f"{CACHE_PREFIX}feature:{feature_name}:usage",
                f"{CACHE_PREFIX}user:{user_id}:feature_usage",
            ]
        )

        return metric.to_dict()

    def track_performance_metric(
        self,
        metric_type: str,
        value: float,
        endpoint: Optional[str] = None,
        component: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Track system performance metrics."""
        metric = PerformanceMetrics(
            metric_type=metric_type,
            value=value,
            endpoint=endpoint,
            component=component,
            context=context,
        )
        db.session.add(metric)
        db.session.commit()

        # Invalidate relevant caches
        cache_keys = [f"{CACHE_PREFIX}performance:{metric_type}"]
        if endpoint:
            cache_keys.append(f"{CACHE_PREFIX}performance:endpoint:{endpoint}")
        if component:
            cache_keys.append(f"{CACHE_PREFIX}performance:component:{component}")
        cache.delete_many(cache_keys)

        return metric.to_dict()

    def aggregate_metrics(
        self,
        metric_type: str,
        dimension: str,
        period: str = "daily",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        dimension_id: Optional[int] = None,
    ) -> None:
        """Aggregate metrics for faster dashboard loading."""
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()

        # Build base query depending on metric type and dimension
        if dimension == "user":
            base_query = UserMetrics.query.filter(
                UserMetrics.metric_type == metric_type,
                UserMetrics.date.between(start_date, end_date),
            )
            if dimension_id:
                base_query = base_query.filter(UserMetrics.user_id == dimension_id)

        elif dimension == "venue":
            base_query = VenueMetrics.query.filter(
                VenueMetrics.metric_type == metric_type,
                VenueMetrics.date.between(start_date, end_date),
            )
            if dimension_id:
                base_query = base_query.filter(VenueMetrics.venue_id == dimension_id)

        # Calculate aggregations
        aggregations = base_query.with_entities(
            func.count().label("count"),
            func.sum(UserMetrics.value).label("sum"),
            func.avg(UserMetrics.value).label("avg"),
            func.min(UserMetrics.value).label("min"),
            func.max(UserMetrics.value).label("max"),
        ).first()

        # Create or update aggregated metric
        existing = AggregatedMetrics.query.filter_by(
            metric_type=metric_type,
            dimension=dimension,
            dimension_id=dimension_id,
            period=period,
            date=end_date,
        ).first()

        if existing:
            existing.count = aggregations.count
            existing.sum = aggregations.sum
            existing.avg = aggregations.avg
            existing.min = aggregations.min
            existing.max = aggregations.max
            existing.updated_at = datetime.utcnow()
        else:
            metric = AggregatedMetrics(
                metric_type=metric_type,
                dimension=dimension,
                dimension_id=dimension_id,
                period=period,
                date=end_date,
                count=aggregations.count,
                sum=aggregations.sum,
                avg=aggregations.avg,
                min=aggregations.min,
                max=aggregations.max,
            )
            db.session.add(metric)

        db.session.commit()

    def get_user_metrics(
        self,
        user_id: int,
        metric_type: Optional[str] = None,
        period: str = "daily",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Get metrics for a specific user."""
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()

        cache_key = f"{CACHE_PREFIX}user:{user_id}:{metric_type or 'all'}:{period}"
        result = cache.get(cache_key)

        if result is None:
            query = UserMetrics.query.filter(
                UserMetrics.user_id == user_id,
                UserMetrics.date.between(start_date, end_date),
                UserMetrics.period == period,
            )

            if metric_type:
                query = query.filter(UserMetrics.metric_type == metric_type)

            metrics = query.order_by(UserMetrics.date).all()
            result = [metric.to_dict() for metric in metrics]
            cache.set(cache_key, result, timeout=CACHE_TTL)

        return result

    def get_venue_metrics(
        self,
        venue_id: int,
        metric_type: Optional[str] = None,
        period: str = "daily",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Get metrics for a specific venue."""
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()

        cache_key = f"{CACHE_PREFIX}venue:{venue_id}:{metric_type or 'all'}:{period}"
        result = cache.get(cache_key)

        if result is None:
            query = VenueMetrics.query.filter(
                VenueMetrics.venue_id == venue_id,
                VenueMetrics.date.between(start_date, end_date),
                VenueMetrics.period == period,
            )

            if metric_type:
                query = query.filter(VenueMetrics.metric_type == metric_type)

            metrics = query.order_by(VenueMetrics.date, VenueMetrics.hour).all()
            result = [metric.to_dict() for metric in metrics]
            cache.set(cache_key, result, timeout=CACHE_TTL)

        return result

    def get_feature_usage_stats(
        self,
        feature_name: Optional[str] = None,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """Get feature usage statistics."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        cache_key = f"{CACHE_PREFIX}feature_usage:{feature_name or 'all'}:{user_id or 'all'}"
        result = cache.get(cache_key)

        if result is None:
            query = FeatureUsageMetrics.query.filter(
                FeatureUsageMetrics.created_at.between(start_date, end_date)
            )

            if feature_name:
                query = query.filter(FeatureUsageMetrics.feature_name == feature_name)
            if user_id:
                query = query.filter(FeatureUsageMetrics.user_id == user_id)

            metrics = query.order_by(desc(FeatureUsageMetrics.created_at)).all()
            result = [metric.to_dict() for metric in metrics]
            cache.set(cache_key, result, timeout=CACHE_TTL)

        return result

    def get_performance_metrics(
        self,
        metric_type: Optional[str] = None,
        endpoint: Optional[str] = None,
        component: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """Get system performance metrics."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(hours=24)
        if not end_date:
            end_date = datetime.utcnow()

        cache_key = f"{CACHE_PREFIX}performance:{metric_type or 'all'}:{endpoint or 'all'}:{component or 'all'}"
        result = cache.get(cache_key)

        if result is None:
            query = PerformanceMetrics.query.filter(
                PerformanceMetrics.created_at.between(start_date, end_date)
            )

            if metric_type:
                query = query.filter(PerformanceMetrics.metric_type == metric_type)
            if endpoint:
                query = query.filter(PerformanceMetrics.endpoint == endpoint)
            if component:
                query = query.filter(PerformanceMetrics.component == component)

            metrics = query.order_by(desc(PerformanceMetrics.created_at)).all()
            result = [metric.to_dict() for metric in metrics]
            cache.set(cache_key, result, timeout=CACHE_TTL)

        return result

    def get_aggregated_metrics(
        self,
        metric_type: str,
        dimension: str,
        period: str = "daily",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        dimension_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Get pre-aggregated metrics."""
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()

        cache_key = (
            f"{CACHE_PREFIX}aggregated:{metric_type}:{dimension}:{period}:{dimension_id or 'all'}"
        )
        result = cache.get(cache_key)

        if result is None:
            query = AggregatedMetrics.query.filter(
                AggregatedMetrics.metric_type == metric_type,
                AggregatedMetrics.dimension == dimension,
                AggregatedMetrics.period == period,
                AggregatedMetrics.date.between(start_date, end_date),
            )

            if dimension_id:
                query = query.filter(AggregatedMetrics.dimension_id == dimension_id)

            metrics = query.order_by(AggregatedMetrics.date).all()
            result = [metric.to_dict() for metric in metrics]
            cache.set(cache_key, result, timeout=CACHE_TTL)

        return result
