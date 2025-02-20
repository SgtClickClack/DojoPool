import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, render_template
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

bp: Blueprint = Blueprint("performance", __name__)


def get_performance_data() -> Dict[Any, Any]:
    """Fetch performance metrics from the database."""
    db_path: Path = Path("performance_history.db")
    if not db_path.exists():
        return {
            "metrics": {"current": {}, "trends": {}},
            "dates": [],
            "size_trends": [],
            "avif_trends": [],
            "webp_trends": [],
        }

    with sqlite3.connect(db_path) as conn:
        # Get latest metrics
        latest: Any = conn.execute(
            """
            SELECT * FROM performance_metrics
            ORDER BY timestamp DESC LIMIT 1
        """
        ).fetchone()

        # Get historical data for the past 30 days
        history: Any = conn.execute(
            """
            SELECT
                timestamp,
                total_size_optimized,
                avif_adoption_rate,
                webp_adoption_rate
            FROM performance_metrics
            WHERE timestamp >= date('now', '-30 days')
            ORDER BY timestamp ASC
        """
        ).fetchall()

        dates: List[Any] = []
        size_trends: List[Any] = []
        avif_trends: List[Any] = []
        webp_trends: List[Any] = []

        for row in history:
            dates.append(datetime.fromisoformat(row[0]).strftime("%Y-%m-%d"))
            size_trends.append(row[1] / (1024 * 1024))  # Convert to MB
            avif_trends.append(row[2])
            webp_trends.append(row[3])

        size_reduction: int = 0
        if latest and latest[2] > 0:  # total_size_original
            size_reduction: int = (latest[2] - latest[3]) / latest[2] * 100

        return {
            "metrics": {
                "current": {
                    "total_images": latest[1] if latest else 0,
                    "size_reduction": size_reduction,
                    "avif_adoption": latest[7] if latest else 0,
                    "lazy_loading": latest[8] if latest else 0,
                },
                "trends": {},
            },
            "dates": dates,
            "size_trends": size_trends,
            "avif_trends": avif_trends,
            "webp_trends": webp_trends,
        }


@bp.route("/performance")
def dashboard():
    """Render the performance dashboard."""
    data = get_performance_data()
    return render_template(
        "performance_dashboard.html",
        metrics=data["metrics"],
        dates=data["dates"],
        size_trends=data["size_trends"],
        avif_trends=data["avif_trends"],
        webp_trends=data["webp_trends"],
    )
