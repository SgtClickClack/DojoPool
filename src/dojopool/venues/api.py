"""
REST API endpoints for venue management dashboard.

This module provides API endpoints for:
- Dashboard metrics and analytics
- Equipment management
- Staff management
- Event management
- Financial reporting
"""

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from dojopool.auth import get_current_user, require_venue_access
from dojopool.venues.dashboard import VenueDashboard, VenueAnalytics

router = APIRouter(prefix="/api/venues", tags=["venues"])


# Request/Response Models
class DashboardSummaryResponse(BaseModel):
    """Dashboard summary response model."""

    basic_info: Dict
    current_status: Dict
    daily_metrics: Dict
    equipment_status: Dict
    staff_overview: Dict
    upcoming_events: List[Dict]


class RevenueReportResponse(BaseModel):
    """Revenue report response model."""

    total_revenue: float
    revenue_by_day: List[Dict]
    revenue_by_source: Dict
    comparison: Dict


class UtilizationReportResponse(BaseModel):
    """Utilization report response model."""

    average_utilization: float
    utilization_by_day: List[Dict]
    peak_hours: List[Dict]
    table_specific_metrics: List[Dict]


class CustomerReportResponse(BaseModel):
    """Customer report response model."""

    total_customers: int
    new_customers: int
    returning_customers: int
    customer_demographics: Dict
    customer_feedback: List[Dict]


class EventReportResponse(BaseModel):
    """Event report response model."""

    total_events: int
    events_by_type: Dict
    event_attendance: List[Dict]
    event_revenue: Dict


# Dashboard Endpoints
@router.get("/{venue_id}/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(venue_id: str, current_user=Depends(get_current_user)) -> Dict:
    """Get venue dashboard summary."""
    require_venue_access(current_user, venue_id)

    try:
        dashboard = VenueDashboard(venue_id)
        return dashboard.get_summary()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Analytics Endpoints
@router.get("/{venue_id}/analytics/revenue", response_model=RevenueReportResponse)
async def get_revenue_report(
    venue_id: str,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user=Depends(get_current_user),
) -> Dict:
    """Get venue revenue report."""
    require_venue_access(current_user, venue_id)

    try:
        analytics = VenueAnalytics(venue_id)
        return analytics.get_revenue_report(start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{venue_id}/analytics/utilization", response_model=UtilizationReportResponse)
async def get_utilization_report(
    venue_id: str,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user=Depends(get_current_user),
) -> Dict:
    """Get venue utilization report."""
    require_venue_access(current_user, venue_id)

    try:
        analytics = VenueAnalytics(venue_id)
        return analytics.get_utilization_report(start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{venue_id}/analytics/customers", response_model=CustomerReportResponse)
async def get_customer_report(
    venue_id: str,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user=Depends(get_current_user),
) -> Dict:
    """Get venue customer report."""
    require_venue_access(current_user, venue_id)

    try:
        analytics = VenueAnalytics(venue_id)
        return analytics.get_customer_report(start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{venue_id}/analytics/events", response_model=EventReportResponse)
async def get_event_report(
    venue_id: str,
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user=Depends(get_current_user),
) -> Dict:
    """Get venue event report."""
    require_venue_access(current_user, venue_id)

    try:
        analytics = VenueAnalytics(venue_id)
        return analytics.get_event_report(start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
