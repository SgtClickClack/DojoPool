class AuthenticationError(Exception):
    pass

class InvalidCredentialsError(AuthenticationError):
    pass

class AccountLockedError(AuthenticationError):
    pass

class AccountDeactivatedError(AuthenticationError):
    pass

class EmailNotVerifiedError(AuthenticationError):
    pass

class TwoFactorRequiredError(AuthenticationError):
    pass

class InvalidTwoFactorCodeError(AuthenticationError):
    pass

class TokenError(Exception):
    pass

class InvalidTokenError(TokenError):
    pass

class ExpiredTokenError(TokenError):
    pass

class SessionError(Exception):
    pass

class InvalidSessionError(SessionError):
    pass

class ExpiredSessionError(SessionError):
    pass

class PasswordError(Exception):
    pass

class WeakPasswordError(PasswordError):
    pass

class PasswordResetError(PasswordError):
    pass
