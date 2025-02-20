# Removed the eventlet import since it's no longer used.
# import eventlet

from .celery_app import celery

# Make sure your Celery config (broker, backend, etc.) is set up correctly.
celery.config_from_object("src.dojopool.celeryconfig")


@celery.task
def process_frame(data):
    # Import create_app here to avoid circular dependency issues.
    from dojopool.app import create_app

    app = create_app()
    with app.app_context():
        # Now process your data within the Flask context.
        # For example, log or update a record in the database.
        print(f"Processing frame data: {data}")


def process_frame(frame):
    """
    Process a frame for the gaming experience.

    Args:
        frame: The frame data to process.

    Returns:
        The processed frame (or any relevant processing result).
    """
    # Your frame processing logic goes here.
    return frame
