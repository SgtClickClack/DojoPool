"""Authentication exceptions.

This module provides custom exceptions for authentication-related errors.
"""

class AuthenticationError(Exception):
    """Base class for authentication errors."""
    pass

class RegistrationError(Exception):
    """Raised when user registration fails."""
    pass

class InvalidTokenError(Exception):
    """Raised when a token is invalid or expired."""
    pass

class InvalidCredentialsError(AuthenticationError):
    """Raised when login credentials are invalid."""
    pass

class AccountLockedError(AuthenticationError):
    """Raised when account is locked due to too many failed attempts."""
    pass

class EmailNotVerifiedError(AuthenticationError):
    """Raised when email is not verified."""
    pass

class TOTPRequiredError(AuthenticationError):
    """Raised when 2FA is required but not provided."""
    pass

class InvalidTOTPError(AuthenticationError):
    """Raised when 2FA token is invalid."""
    pass

class SessionExpiredError(AuthenticationError):
    """Raised when session has expired."""
    pass

class PermissionDeniedError(AuthenticationError):
    """Raised when user does not have required permissions."""
    pass 