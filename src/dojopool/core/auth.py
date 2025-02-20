"""
Stub definitions for auth module.
"""


def get_current_user(*args, **kwargs):
    pass


def require_admin(func):
    return func


def require_permissions(*args, **kwargs):
    def decorator(func):
        return func

    return decorator
