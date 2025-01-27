"""Authentication exceptions for DojoPool."""

class AuthenticationError(Exception):
    """Base class for authentication errors."""
    
    def __init__(self, message: str = 'Authentication failed'):
        """Initialize AuthenticationError.
        
        Args:
            message: Error message
        """
        self.message = message
        super().__init__(self.message)

class InvalidCredentialsError(AuthenticationError):
    """Raised when credentials are invalid."""
    
    def __init__(self, message: str = 'Invalid username or password'):
        """Initialize InvalidCredentialsError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class AccountLockedError(AuthenticationError):
    """Raised when account is locked."""
    
    def __init__(self, message: str = 'Account is locked'):
        """Initialize AccountLockedError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class AccountDeactivatedError(AuthenticationError):
    """Raised when account is deactivated."""
    
    def __init__(self, message: str = 'Account is deactivated'):
        """Initialize AccountDeactivatedError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class EmailNotVerifiedError(AuthenticationError):
    """Raised when email is not verified."""
    
    def __init__(self, message: str = 'Email not verified'):
        """Initialize EmailNotVerifiedError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class TwoFactorRequiredError(AuthenticationError):
    """Raised when 2FA is required but not provided."""
    
    def __init__(self, message: str = 'Two-factor authentication required'):
        """Initialize TwoFactorRequiredError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class InvalidTwoFactorCodeError(AuthenticationError):
    """Raised when 2FA code is invalid."""
    
    def __init__(self, message: str = 'Invalid two-factor authentication code'):
        """Initialize InvalidTwoFactorCodeError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class TokenError(Exception):
    """Base class for token errors."""
    
    def __init__(self, message: str = 'Token error'):
        """Initialize TokenError.
        
        Args:
            message: Error message
        """
        self.message = message
        super().__init__(self.message)

class InvalidTokenError(TokenError):
    """Raised when token is invalid."""
    
    def __init__(self, message: str = 'Invalid token'):
        """Initialize InvalidTokenError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class ExpiredTokenError(TokenError):
    """Raised when token is expired."""
    
    def __init__(self, message: str = 'Token expired'):
        """Initialize ExpiredTokenError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class SessionError(Exception):
    """Base class for session errors."""
    
    def __init__(self, message: str = 'Session error'):
        """Initialize SessionError.
        
        Args:
            message: Error message
        """
        self.message = message
        super().__init__(self.message)

class InvalidSessionError(SessionError):
    """Raised when session is invalid."""
    
    def __init__(self, message: str = 'Invalid session'):
        """Initialize InvalidSessionError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class ExpiredSessionError(SessionError):
    """Raised when session is expired."""
    
    def __init__(self, message: str = 'Session expired'):
        """Initialize ExpiredSessionError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class PasswordError(Exception):
    """Base class for password errors."""
    
    def __init__(self, message: str = 'Password error'):
        """Initialize PasswordError.
        
        Args:
            message: Error message
        """
        self.message = message
        super().__init__(self.message)

class WeakPasswordError(PasswordError):
    """Raised when password is too weak."""
    
    def __init__(self, message: str = 'Password too weak'):
        """Initialize WeakPasswordError.
        
        Args:
            message: Error message
        """
        super().__init__(message)

class PasswordResetError(PasswordError):
    """Raised when password reset fails."""
    
    def __init__(self, message: str = 'Password reset failed'):
        """Initialize PasswordResetError.
        
        Args:
            message: Error message
        """
        super().__init__(message) 