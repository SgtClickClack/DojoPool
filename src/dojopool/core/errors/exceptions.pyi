from typing import Any, Dict, Optional

class DojoPoolError(Exception):
    pass

class ValidationError(DojoPoolError):
    pass

class AuthenticationError(DojoPoolError):
    pass

class AuthorizationError(DojoPoolError):
    pass

class NotFoundError(DojoPoolError):
    pass

class ConflictError(DojoPoolError):
    pass

class RateLimitError(DojoPoolError):
    pass

class ServiceError(DojoPoolError):
    pass
