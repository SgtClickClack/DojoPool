import os

from celery import Celery


def make_celery(app_name=__name__):
    broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    backend_url = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    celery = Celery(app_name, broker=broker_url, backend=backend_url)
    
    # Enhanced configuration for DojoPool's needs
    celery.conf.update(
        task_routes={
            "dojopool.tasks.*": {"queue": "dojopool"},
            "dojopool.game_tasks.*": {"queue": "game_processing"},
            "dojopool.ai_tasks.*": {"queue": "ai_processing"},
        },
        # Add task time limits
        task_time_limit=3600,  # 1 hour max
        task_soft_time_limit=3000,  # Soft limit 50 minutes
        # Enable task retries
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        # Optimize for real-time game processing
        worker_prefetch_multiplier=1,
        worker_concurrency=os.cpu_count(),
    )
    return celery


celery = make_celery("dojopool")

__all__ = ["celery"]
