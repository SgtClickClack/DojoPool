from celery import Celery


def create_celery_app():
    celery = Celery(
        "dojopool",
        broker="redis://redis:6379/0",
        backend="redis://redis:6379/0",
        include=["dojopool.tasks.tournament_tasks"],
    )

    # Optional configuration
    celery.conf.update(
        result_expires=3600,  # Results expire in 1 hour
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )

    return celery


celery = create_celery_app()
