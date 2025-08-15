from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException

from services.auto_scaling import AutoScalingService
from services.system_optimization import SystemOptimizationService
from utils.auth import get_current_admin_user
from utils.rate_limiter import rate_limit

router = APIRouter(prefix="/api/system", tags=["system"])
system_optimization = SystemOptimizationService()
auto_scaling = AutoScalingService()


@router.get("/metrics", dependencies=[Depends(get_current_admin_user)])
@rate_limit(max_requests=60, window_seconds=60)
async def get_system_metrics() -> Dict:
    """Get current system metrics."""
    return system_optimization.collect_system_metrics()


@router.get("/performance", dependencies=[Depends(get_current_admin_user)])
@rate_limit(max_requests=60, window_seconds=60)
async def get_performance_analysis() -> Dict:
    """Get system performance analysis."""
    return system_optimization.analyze_performance()


@router.get("/optimization/recommendations", dependencies=[Depends(get_current_admin_user)])
@rate_limit(max_requests=60, window_seconds=60)
async def get_optimization_recommendations() -> List[Dict]:
    """Get system optimization recommendations."""
    return system_optimization.get_optimization_recommendations()


@router.get("/scaling/needs", dependencies=[Depends(get_current_admin_user)])
@rate_limit(max_requests=60, window_seconds=60)
async def get_scaling_needs() -> Dict:
    """Get current scaling needs."""
    metrics = system_optimization.collect_system_metrics()
    return auto_scaling.evaluate_scaling_needs(metrics)


@router.get("/scaling/recommendations", dependencies=[Depends(get_current_admin_user)])
@rate_limit(max_requests=60, window_seconds=60)
async def get_scaling_recommendations() -> List[Dict]:
    """Get scaling recommendations."""
    return auto_scaling.get_scaling_recommendations()


@router.get("/scaling/history", dependencies=[Depends(get_current_admin_user)])
@rate_limit(max_requests=60, window_seconds=60)
async def get_scaling_history() -> List[Dict]:
    """Get scaling decision history."""
    return auto_scaling.get_scaling_history()


@router.post("/optimization/apply", dependencies=[Depends(get_current_admin_user)])
@rate_limit(max_requests=10, window_seconds=60)
async def apply_optimization(recommendation_id: str) -> Dict:
    """Apply an optimization recommendation."""
    try:
        # Here you would implement the logic to apply the optimization
        # This is a placeholder that would need to be customized based on
        # your specific optimization requirements
        return {
            "status": "success",
            "message": f"Optimization {recommendation_id} applied successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply optimization: {str(e)}")


@router.post("/scaling/apply", dependencies=[Depends(get_current_admin_user)])
@rate_limit(max_requests=10, window_seconds=60)
async def apply_scaling(action: Dict) -> Dict:
    """Apply a scaling action."""
    try:
        # Here you would implement the logic to apply the scaling action
        # This is a placeholder that would need to be customized based on
        # your specific scaling requirements
        return {
            "status": "success",
            "message": f'Scaling action {action["type"]} applied successfully',
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply scaling action: {str(e)}")
