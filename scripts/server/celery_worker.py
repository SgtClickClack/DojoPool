import eventlet

eventlet.monkey_patch()

from dojopool.celery_app import celery_app

if __name__ == "__main__":
    celery_app.start()
