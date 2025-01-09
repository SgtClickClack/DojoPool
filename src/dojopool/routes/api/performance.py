from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime
from services.performance_monitor import PerformanceMonitor
from utils.auth import get_current_user, require_admin
from utils.database import get_db
from utils.redis import get_redis
import psutil

router = APIRouter(prefix="/api/performance", tags=["performance"])

@router.get("/metrics")
async def get_performance_metrics(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    redis = Depends(get_redis)
):
    """Get performance metrics for a time range."""
    try:
        monitor = PerformanceMonitor(redis, db)
        metrics = monitor.get_performance_metrics(start_time, end_time)
        return {
            'success': True,
            'data': metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations")
async def get_optimization_recommendations(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    redis = Depends(get_redis)
):
    """Get optimization recommendations."""
    try:
        monitor = PerformanceMonitor(redis, db)
        recommendations = monitor.get_optimization_recommendations()
        return {
            'success': True,
            'data': recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize")
async def trigger_optimization(
    optimization_type: str = Query(..., description="Type of optimization to perform"),
    current_user = Depends(require_admin),
    db = Depends(get_db),
    redis = Depends(get_redis)
):
    """Trigger specific optimization."""
    try:
        monitor = PerformanceMonitor(redis, db)
        if optimization_type == 'cpu':
            await monitor._optimize_cpu_usage()
        elif optimization_type == 'memory':
            await monitor._optimize_memory_usage()
        else:
            await monitor._optimize_resource_usage(optimization_type)
            
        return {
            'success': True,
            'message': f'Optimization of type {optimization_type} triggered successfully'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_performance_alerts(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    redis = Depends(get_redis)
):
    """Get current performance alerts."""
    try:
        monitor = PerformanceMonitor(redis, db)
        analysis = monitor._analyze_metrics()
        issues = monitor._detect_performance_issues(analysis)
        return {
            'success': True,
            'data': {
                'alerts': issues,
                'analysis': analysis
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/thresholds")
async def update_alert_thresholds(
    thresholds: dict,
    current_user = Depends(require_admin),
    db = Depends(get_db),
    redis = Depends(get_redis)
):
    """Update performance alert thresholds."""
    try:
        monitor = PerformanceMonitor(redis, db)
        monitor.alert_thresholds.update(thresholds)
        return {
            'success': True,
            'data': monitor.alert_thresholds
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_system_status(
    current_user = Depends(get_current_user),
    db = Depends(get_db),
    redis = Depends(get_redis)
):
    """Get current system status."""
    try:
        monitor = PerformanceMonitor(redis, db)
        metrics = {
            'cpu_usage': psutil.cpu_percent(interval=1),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'network_io': monitor._get_network_io(),
            'process_metrics': monitor._get_process_metrics()
        }
        return {
            'success': True,
            'data': metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 